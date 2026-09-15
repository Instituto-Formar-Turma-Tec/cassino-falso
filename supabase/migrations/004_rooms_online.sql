-- =============================================================
-- Migration 004: Modo Online Competitivo (salas 2–6 jogadores)
--
-- Conceito (tema "cassino reverso"):
--   * Uma sala tem 2–6 jogadores. Cada um entra com uma banca
--     inicial (R$100 = 10000 centavos).
--   * A sala joga N rodadas de UM jogo competitivo (roleta, poker,
--     blackjack). Em cada rodada TODOS apostam a mesma quantia na
--     MESMA rodada compartilhada (mesmo resultado/multiplicador).
--   * Quem preservar mais saldo ao fim das N rodadas VENCE.
--   * Estado e atualizações sincronizam via Supabase Realtime (a
--     tabela rooms está na publicação de realtime).
--
-- Modelagem: as apostas das rodadas NÃO usam resolver_jogada (que é
-- individual e debita do user/transactions). Aqui o saldo da banca é
-- por-partida (room_players.saldo_centavos), desacoplado do saldo real
-- do jogador. Ao terminar, o jogador recebe o PRÊMIO na sua conta real.
-- =============================================================

-- ---------- rooms ----------
create table if not exists public.rooms (
  id            text primary key,            -- código amigável (ex: "AB12CD")
  jogo          text not null,               -- roleta | poker | blackjack
  max_jogadores integer not null check (max_jogadores between 2 and 6),
  rodadas_total integer not null default 5 check (rodadas_total between 1 and 20),
  rodadas_atuais integer not null default 0,
  aposta_centavos integer not null default 1000,
  status        text not null default 'aguardando' check (status in ('aguardando','jogando','encerrada')),
  host_id       text not null references public.users(id) on delete cascade,
  criado_em     bigint not null,
  encerrado_em  bigint
);

-- ---------- room_players ----------
create table if not exists public.room_players (
  id             text primary key,
  room_id        text not null references public.rooms(id) on delete cascade,
  user_id        text not null references public.users(id) on delete cascade,
  nome           text not null,
  matricula      text not null,
  saldo_centavos integer not null default 10000,  -- banca da partida
  aposta_atual   integer null,                     -- aposta registrada na rodada atual
  escolha        text null,                        -- escolha do jogador (ex: betType, animal, numero)
  venceu         boolean null,                     -- marcado ao encerrar
  criado_em      bigint not null,
  unique (room_id, user_id)
);

-- ---------- room_rounds (log das rodadas compartilhadas) ----------
create table if not exists public.room_rounds (
  id                   text primary key,
  room_id              text not null references public.rooms(id) on delete cascade,
  numero               integer not null,
  resultado            text not null,             -- resultado da rodada compartilhada
  multiplicador        real not null default 0,
  criado_em            bigint not null,
  unique (room_id, numero)
);

-- ---------- room_round_players (resultado por jogador em cada rodada) ----------
create table if not exists public.room_round_players (
  id                   text primary key,
  round_id             text not null references public.room_rounds(id) on delete cascade,
  player_id            text not null references public.room_players(id) on delete cascade,
  saldo_antes          integer not null,
  saldo_depois         integer not null,
  ganho_centavos       integer not null default 0,
  unique (round_id, player_id)
);

-- índices
create index if not exists idx_rooms_status      on public.rooms (status);
create index if not exists idx_room_players_room on public.room_players (room_id);
create index if not exists idx_room_rounds_room  on public.room_rounds (room_id);

-- ---------- RLS: permitir acesso pleno via chave (app server-side usa secret key) ----------
alter table public.rooms            disable row level security;
alter table public.room_players     disable row level security;
alter table public.room_rounds      disable row level security;
alter table public.room_round_players disable row level security;
grant all on public.rooms            to anon, authenticated;
grant all on public.room_players     to anon, authenticated;
grant all on public.room_rounds      to anon, authenticated;
grant all on public.room_round_players to anon, authenticated;

-- ---------- Realtime: publicar salas e players ----------
begin;
  alter publication supabase_realtime add table public.rooms;
  alter publication supabase_realtime add table public.room_players;
commit;

-- ---------- Funções ----------

-- Gerar código de sala curto (6 alfanum)
create or replace function public.gerar_codigo_sala()
returns text language sql as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
$$;

-- Criar sala. Retorna o código.
create or replace function public.criar_sala(
  p_host_id text,
  p_jogo text,
  p_max_jogadores integer,
  p_rodadas_total integer,
  p_aposta_centavos integer
)
returns text
language plpgsql
security definer
as $$
declare
  codigo text;
begin
  if p_max_jogadores not between 2 and 6 then
    raise exception 'A sala deve ter entre 2 e 6 jogadores.';
  end if;
  if p_rodadas_total not between 1 and 20 then
    raise exception 'Rodadas entre 1 e 20.';
  end if;

  codigo := public.gerar_codigo_sala();

  insert into public.rooms (id, jogo, max_jogadores, rodadas_total, aposta_centavos, status, host_id, criado_em)
  values (codigo, p_jogo, p_max_jogadores, p_rodadas_total, p_aposta_centavos, 'aguardando', p_host_id, floor(extract(epoch from clock_timestamp())*1000)::bigint);

  -- host entra como player com banca
  insert into public.room_players (id, room_id, user_id, nome, matricula, saldo_centavos, criado_em)
  select gen_random_uuid()::text, codigo, u.id, u.nome, u.matricula, 10000,
         floor(extract(epoch from clock_timestamp())*1000)::bigint
    from public.users u where u.id = p_host_id;

  return codigo;
end;
$$;

-- Entrar numa sala aguardando.
create or replace function public.entrar_sala(
  p_codigo text,
  p_user_id text
)
returns void
language plpgsql
security definer
as $$
declare
  atual int;
  maxp  int;
  nome_j text; matr_j text;
  r public.rooms%rowtype;
begin
  select * into r from public.rooms where id = p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status <> 'aguardando' then raise exception 'Sala já está em andamento.'; end if;

  select count(*) into atual from public.room_players where room_id = p_codigo;
  if atual >= r.max_jogadores then raise exception 'Sala cheia.'; end if;

  select nome, matricula into nome_j, matr_j from public.users where id = p_user_id;

  insert into public.room_players (id, room_id, user_id, nome, matricula, saldo_centavos, criado_em)
  values (gen_random_uuid()::text, p_codigo, p_user_id, nome_j, matr_j, 10000,
          floor(extract(epoch from clock_timestamp())*1000)::bigint)
  on conflict (room_id, user_id) do nothing;
end;
$$;

-- Registrar aposta/escolha do jogador na rodada atual (a banca será debitada na resolução).
create or replace function public.registrar_aposta(
  p_codigo text,
  p_user_id text,
  p_aposta integer,
  p_escolha text
)
returns void
language plpgsql
security definer
as $$
declare
  r public.rooms%rowtype;
begin
  select * into r from public.rooms where id = p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status <> 'jogando' then raise exception 'A partida ainda não começou.'; end if;
  if p_aposta <= 0 or p_aposta <> r.aposta_centavos then
    raise exception 'Aposta inválida para esta sala.';
  end if;

  update public.room_players
     set aposta_atual = p_aposta, escolha = p_escolha
   where room_id = p_codigo and user_id = p_user_id;
end;
$$;
-- =============================================================
-- Migration 004 (continuação): funções de partida + estado
-- =============================================================

-- Iniciar a partida (host chama quando sala cheia ou quando quiser)
create or replace function public.iniciar_partida(
  p_codigo text
)
returns void
language plpgsql
security definer
as $$
declare
  r public.rooms%rowtype;
  total_players int;
begin
  select * into r from public.rooms where id = p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status <> 'aguardando' then raise exception 'Sala não está aguardando.'; end if;

  select count(*) into total_players from public.room_players where room_id = p_codigo;
  if total_players < 2 then raise exception 'Mínimo 2 jogadores para começar.'; end if;

  update public.rooms
     set status = 'jogando', rodadas_atuais = 0
   where id = p_codigo;
end;
$$;

-- Resolve uma rodada COMPARTILHADA: todos os jogadores que apostaram
-- recebem o MESMO multiplicador/resultado. Debita/aplica na banca da partida
-- (room_players.saldo_centavos), loga em room_rounds + room_round_players.
create or replace function public.resolver_rodada_compartilhada(
  p_codigo text,
  p_resultado text,
  p_multiplicador real
)
returns jsonb
language plpgsql
security definer
as $$
declare
  r public.rooms%rowtype;
  total_players int;
  jogadores_apostaram int;
  now_ms bigint;
  rid text;
  player_rec record;
  antes int;
  depois int;
  ganho int;
  resultado_json jsonb := '[]'::jsonb;
begin
  select * into r from public.rooms where id = p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status <> 'jogando' then raise exception 'Partida não está em andamento.'; end if;
  if r.rodadas_atuais >= r.rodadas_total then raise exception 'Partida já terminou.'; end if;

  select count(*) into total_players from public.room_players where room_id = p_codigo;
  select count(*) into jogadores_apostaram
    from public.room_players where room_id = p_codigo and aposta_atual is not null;
  if jogadores_apostaram < total_players then
    raise exception 'Ainda há jogadores que não apostaram.';
  end if;

  now_ms := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  rid := gen_random_uuid()::text;

  -- Cria a rodada compartilhada
  insert into public.room_rounds (id, room_id, numero, resultado, multiplicador, criado_em)
  values (rid, p_codigo, r.rodadas_atuais + 1, p_resultado, p_multiplicador, now_ms);

  -- Para cada jogador: aplica resultado na banca da partida
  for player_rec in
    select id, saldo_centavos from public.room_players where room_id = p_codigo
  loop
    antes := player_rec.saldo_centavos;
    depois := greatest(0, antes - r.aposta_centavos + round(r.aposta_centavos * coalesce(p_multiplicador, 0))::integer);
    ganho := depois - antes;

    -- Atualiza saldo do jogador na partida
    update public.room_players
       set saldo_centavos = depois, aposta_atual = null, escolha = null
     where id = player_rec.id;

    -- Log por jogador
    insert into public.room_round_players (id, round_id, player_id, saldo_antes, saldo_depois, ganho_centavos)
    values (gen_random_uuid()::text, rid, player_rec.id, antes, depois, ganho);

    resultado_json := resultado_json || jsonb_build_object(
      'player_id', player_rec.id,
      'antes', antes,
      'depois', depois,
      'ganho', ganho
    );
  end loop;

  -- Incrementa rodadas_atuais; se acabou, marca encerrada
  update public.rooms
     set rodadas_atuais = rodadas_atuais + 1,
         status = case when r.rodadas_atuais + 1 >= r.rodadas_total then 'encerrada' else 'jogando' end,
         encerrado_em = case when r.rodadas_atuais + 1 >= r.rodadas_total then now_ms else null end
   where id = p_codigo;

  return jsonb_build_object(
    'rodada', r.rodadas_atuais + 1,
    'resultado', p_resultado,
    'multiplicador', p_multiplicador,
    'jogadores', resultado_json,
    'encerrada', (r.rodadas_atuais + 1 >= r.rodadas_total)
  );
end;
$$;

-- Finaliza a sala: distribui prêmio ao vencedor (saldo real no users) e limpa.
-- O vencedor recebe a diferença entre o saldo final da banca da partida e
-- a banca inicial (10000 centavos = R$100) como BÔNUS na conta real.
create or replace function public.finalizar_sala(
  p_codigo text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  r public.rooms%rowtype;
  vencedor_id text;
  vencedor_user_id text;
  vencedor_saldo int;
  bonus int;
  now_ms bigint;
  ranking jsonb := '[]'::jsonb;
begin
  select * into r from public.rooms where id = p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status <> 'encerrada' then raise exception 'Partida ainda não terminou.'; end if;

  -- Encontra vencedor (maior saldo_centavos na banca da partida)
  select rp.user_id, rp.saldo_centavos into vencedor_user_id, vencedor_saldo
    from public.room_players rp
   where rp.room_id = p_codigo
   order by rp.saldo_centavos desc, rp.criado_em
   limit 1;

  -- Bônus = saldo_final - 10000 (banca inicial) — limitado a >=0
  bonus := greatest(0, vencedor_saldo - 10000);

  if bonus > 0 then
    update public.users
       set saldo_centavos = saldo_centavos + bonus,
           atualizado_em = floor(extract(epoch from clock_timestamp())*1000)::bigint
     where id = vencedor_user_id;
  end if;

  -- Marca vencedor
  update public.room_players set venceu = true where room_id = p_codigo and user_id = vencedor_user_id;
  update public.room_players set venceu = false where room_id = p_codigo and user_id <> vencedor_user_id;

  -- Ranking final
  select jsonb_agg(jsonb_build_object(
    'nome', rp.nome,
    'matricula', rp.matricula,
    'saldo_final', rp.saldo_centavos,
    'vencedor', (rp.user_id = vencedor_user_id)
  ) order by rp.saldo_centavos desc)
    into ranking
    from public.room_players rp
   where rp.room_id = p_codigo;

  return jsonb_build_object(
    'vencedor_user_id', vencedor_user_id,
    'bonus_centavos', bonus,
    'ranking', ranking
  );
end;
$$;

-- Obter estado completo da sala (para cliente realtime)
create or replace function public.obter_estado_sala(p_codigo text)
returns jsonb
language plpgsql
security definer
as $$
declare
  sala_json jsonb;
  jogadores_json jsonb;
  rounds_json jsonb;
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

  return jsonb_build_object(
    'sala', sala_json,
    'jogadores', jogadores_json,
    'rodadas', coalesce(rounds_json, '[]'::jsonb)
  );
end;
$$;

-- Listar salas abertas/aguardando
create or replace function public.listar_salas_abertas()
returns jsonb
language plpgsql
security definer
as $$
begin
  return (
    select jsonb_agg(jsonb_build_object(
      'id', id, 'jogo', jogo, 'max_jogadores', max_jogadores,
      'rodadas_total', rodadas_total, 'aposta_centavos', aposta_centavos,
      'status', status, 'host_id', host_id, 'criado_em', criado_em,
      'jogadores_atuais', (select count(*) from public.room_players where room_id = r.id)
    ) order by criado_em desc)
      from public.rooms r
     where r.status = 'aguardando'
  );
end;
$$;