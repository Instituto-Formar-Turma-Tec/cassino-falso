-- =============================================================
-- Migration 005: Modo Online POR TURNO (bicho, dados, poker)
--
-- Modelo "vez de um jogador por rodada":
--   * rooms.jogo passa a aceitar 'bicho', 'dados' (poker já existia).
--   * A 'vez' é DERIVADA da rodada atual: jogador da vez =
--       (rodadas_atuais mod <nº de jogadores>) na ordem de entrada.
--   * O jogador da vez faz sua jogada (escolhe animal / rola dado /
--     decide a mão de poker) e SOMENTE o saldo dele muda.
--   * Os demais observam ("aguardando sua vez").
--   * Ao fim de rodadas_total, quem preservar mais saldo vence.
--
-- A resolução é atomicamente feita em resolver_turno_jogador, que já
-- debita/aplica o multiplicador na banca da partida (room_players) e
-- loga em room_rounds + room_round_players — sem usar o fluxo
-- individual (resolver_jogada), preservando o desacoplamento.
-- =============================================================

-- ---------- 1) Ampliar check constraint de rooms.jogo ----------
-- A constraint foi criada inline no create table; nome automático
-- Postgres = <table>_<coluna>_check → rooms_jogo_check.
do $$
begin
  begin
    alter table public.rooms drop constraint rooms_jogo_check;
  exception when others then
    -- constraint já não existe; segue em frente
  end;
end $$;

alter table public.rooms
  add constraint rooms_jogo_check
  check (jogo in ('roleta','poker','blackjack','bicho','dados'));

-- ---------- 2) Helper: quem está na vez ----------
create or replace function public.jogador_da_vez(p_codigo text)
returns text
language plpgsql
security definer
as $$
declare
  r public.rooms%rowtype;
  idx int;
  user_id_atual text;
begin
  select * into r from public.rooms where id = p_codigo;
  if not found then
    return null;
  end if;

  -- Índice do turno: rodadas_atuais % <nº de jogadores>
  select (r.rodadas_atuais % greatest(count(*), 1))::int into idx
    from public.room_players where room_id = p_codigo;

  -- Jogador na posição idx (ordem de entrada = criado_em asc)
  select p.user_id into user_id_atual
    from public.room_players p
   where p.room_id = p_codigo
   order by p.criado_em asc
   offset idx
   limit 1;

  return user_id_atual;
end;
$$;

-- Essencial para que todos os clients saibam de quem é a vez.
-- Publicar jogadores na realtime resolveria, mas simplificamos:
-- o client deriva a vez da mesma forma do lado TS.

-- ---------- 3) Resolver a rodada APENAS do jogador da vez ----------
create or replace function public.resolver_turno_jogador(
  p_codigo text,
  p_user_id text,
  p_resultado text,
  p_multiplicador real
)
returns jsonb
language plpgsql
security definer
as $$
declare
  r public.rooms%rowtype;
  player_rec public.room_players%rowtype;
  vez_user text;
  now_ms bigint;
  rid text;
  antes int;
  depois int;
  ganho int;
  total_players int;
  encerrada boolean := false;
begin
  select * into r from public.rooms where id = p_codigo;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status <> 'jogando' then raise exception 'Partida não está em andamento.'; end if;
  if r.rodadas_atuais >= r.rodadas_total then raise exception 'Partida já terminou.'; end if;

  select count(*) into total_players from public.room_players where room_id = p_codigo;
  if total_players < 1 then raise exception 'Sala sem jogadores.'; end if;

  -- Valida turno
  vez_user := public.jogador_da_vez(p_codigo);
  if vez_user is null or vez_user <> p_user_id then
    raise exception 'Não é a sua vez nesta rodada.';
  end if;

  -- Bloqueia a linha da sala para atomicidade
  select * into r from public.rooms where id = p_codigo for update;

  -- Jogador da vez
  select * into player_rec
    from public.room_players
   where room_id = p_codigo and user_id = p_user_id;

  if not found then raise exception 'Você não está nesta sala.'; end if;

  now_ms := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  rid := gen_random_uuid()::text;

  -- Log da rodada compartilhada
  insert into public.room_rounds (id, room_id, numero, resultado, multiplicador, criado_em)
  values (rid, p_codigo, r.rodadas_atuais + 1, p_resultado, p_multiplicador, now_ms);

  -- Aplica resultado SÓ no jogador da vez
  antes := player_rec.saldo_centavos;
  depois := greatest(0, antes - r.aposta_centavos + round(r.aposta_centavos * coalesce(p_multiplicador, 0))::integer);
  ganho := depois - antes;

  update public.room_players
     set saldo_centavos = depois,
         aposta_atual = r.aposta_centavos,
         escolha = p_resultado
   where id = player_rec.id;

  insert into public.room_round_players (id, round_id, player_id, saldo_antes, saldo_depois, ganho_centavos)
  values (gen_random_uuid()::text, rid, player_rec.id, antes, depois, ganho);

  -- Avança rodada / encerra quando acabam as rodadas
  encerrada := (r.rodadas_atuais + 1 >= r.rodadas_total);
  update public.rooms
     set rodadas_atuais = r.rodadas_atuais + 1,
         status = case when encerrada then 'encerrada' else 'jogando' end,
         encerrado_em = case when encerrada then now_ms else null end,
         host_id = host_id  -- mantém host_id inalterado
   where id = p_codigo;

  return jsonb_build_object(
    'rodada', r.rodadas_atuais + 1,
    'jogador', player_rec.id,
    'user_id', player_rec.user_id,
    'resultado', p_resultado,
    'multiplicador', p_multiplicador,
    'antes', antes,
    'depois', depois,
    'ganho', ganho,
    'encerrada', encerrada
  );
end;
$$;

-- ---------- 4) obter_estado_sala passa a expor a vez ----------
create or replace function public.obter_estado_sala(p_codigo text)
returns jsonb
language plpgsql
security definer
as $$
declare
  sala_json jsonb;
  jogadores_json jsonb;
  rounds_json jsonb;
  vez_user text;
begin
  select jsonb_build_object(
    'id', id, 'jogo', jogo, 'max_jogadores', max_jogadores,
    'rodadas_total', rodadas_total, 'rodadas_atuais', rodadas_atuais,
    'aposta_centavos', aposta_centavos, 'status', status,
    'host_id', host_id, 'criado_em', criado_em, 'encerrado_em', encerrado_em
  ) into sala_json
    from public.rooms where id = p_codigo;

  if not found then return null; end if;

  select jsonb_agg(jsonb_build_object(
    'id', id, 'user_id', user_id, 'nome', nome, 'matricula', matricula,
    'saldo_centavos', saldo_centavos, 'aposta_atual', aposta_atual,
    'escolha', escolha, 'venceu', venceu, 'criado_em', criado_em
  ) order by criado_em)
    into jogadores_json
    from public.room_players where room_id = p_codigo;

  select jsonb_agg(jsonb_build_object(
    'id', id, 'numero', numero, 'resultado', resultado,
    'multiplicador', multiplicador, 'criado_em', criado_em
  ) order by numero)
    into rounds_json
    from public.room_rounds where room_id = p_codigo;

  vez_user := public.jogador_da_vez(p_codigo);

  return jsonb_build_object(
    'sala', sala_json,
    'jogadores', coalesce(jogadores_json, '[]'::jsonb),
    'rodadas', coalesce(rounds_json, '[]'::jsonb),
    'vez_user_id', vez_user
  );
end;
$$;

-- ---------- 5) finalizar_sala: prêmio ao vencedor ----------
-- (inalterado — já distribui o bônus ao maior saldo da partida)