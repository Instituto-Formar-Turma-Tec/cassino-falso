-- Corrige a identidade do host e o primeiro turno do poker.
-- O cliente usa um ID anônimo estável; a sala precisa registrar esse mesmo ID.
create or replace function public.criar_sala_turnos_com_usuario(
  p_jogo text,
  p_user_id text,
  p_nome text,
  p_max_jogadores integer default 6,
  p_aposta_centavos integer default 1000
)
returns text
language plpgsql
security definer
as $$
declare
  c text;
  seed bigint;
  ms bigint;
begin
  if p_jogo not in ('poker','blackjack','bicho') then
    raise exception 'Jogo inválido.';
  end if;
  if p_max_jogadores not between 2 and 6 then
    raise exception '2 a 6 jogadores.';
  end if;
  if p_user_id is null or length(trim(p_user_id)) = 0 then
    raise exception 'Jogador inválido.';
  end if;

  c := public.gerar_codigo_sala();
  seed := floor(random() * 9007199254740991)::bigint;
  ms := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;

  insert into public.users (id, nome, matricula, senha_hash, saldo_centavos, criado_em, atualizado_em)
  values (p_user_id, p_nome, c, 'anon', 0, ms, ms)
  on conflict (id) do update set nome = excluded.nome, atualizado_em = excluded.atualizado_em;

  insert into public.rooms (id, jogo, max_jogadores, rodadas_total, aposta_centavos, status, host_id, criado_em, estado_json)
  values (c, p_jogo, p_max_jogadores, 1, p_aposta_centavos, 'aguardando', p_user_id, ms,
          jsonb_build_object('seed', seed, 'phase', 'aguardando'));

  insert into public.room_players (id, room_id, user_id, nome, matricula, saldo_centavos, criado_em)
  values (gen_random_uuid()::text, c, p_user_id, p_nome, c, 10000, ms);

  return c;
end;
$$;

grant execute on function public.criar_sala_turnos_com_usuario(text, text, text, integer, integer)
to anon, authenticated;

-- No poker, cada jogador precisa começar disponível para agir.
create or replace function public.iniciar_partida_turnos(
  p_codigo text, p_user_id text
)
returns jsonb language plpgsql security definer as $$
declare
  r public.rooms%rowtype;
  st jsonb;
  deck jsonb;
  pa text[];
  i int;
  n int;
  d int;
  c1 text;
  c2 text;
begin
  select * into r from public.rooms where id = p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status <> 'aguardando' then raise exception 'Não está aguardando.'; end if;
  if r.host_id <> p_user_id then raise exception 'Somente o host pode iniciar.'; end if;
  if (select count(*) from public.room_players where room_id = p_codigo) < 2 then
    raise exception 'Mínimo 2 jogadores.';
  end if;

  deck := to_jsonb(public.gerar_baralho((r.estado_json->>'seed')::bigint));
  select array_agg(user_id order by criado_em) into pa from public.room_players where room_id = p_codigo;
  n := array_length(pa, 1);
  d := 0;

  if r.jogo = 'bicho' then
    st := jsonb_build_object('seed', (r.estado_json->>'seed')::bigint, 'phase', 'apostando');
  elsif r.jogo = 'blackjack' then
    c1 := deck->0; c2 := deck->1; d := 2;
    st := jsonb_build_object('seed', (r.estado_json->>'seed')::bigint, 'phase', 'jogando', 'type', 'blackjack',
      'deck', deck, 'deckIndex', 0, 'dealer', jsonb_build_object('cards', jsonb_build_array(c1, c2), 'revealed', false),
      'players', '[]'::jsonb, 'turnIndex', 1);
    for i in 1..n loop
      c1 := deck->d; c2 := deck->(d + 1); d := d + 2;
      st := jsonb_insert(st, '{players,-}', jsonb_build_object('user_id', pa[i], 'cards', jsonb_build_array(c1, c2), 'done', false));
    end loop;
    st := jsonb_set(st, '{deckIndex}', to_jsonb(d));
  elsif r.jogo = 'poker' then
    st := jsonb_build_object('seed', (r.estado_json->>'seed')::bigint, 'phase', 'jogando', 'type', 'poker',
      'deck', deck, 'deckIndex', 0, 'community', '[]'::jsonb, 'street', 1, 'pot', 0,
      'players', '[]'::jsonb, 'turnIndex', 1);
    for i in 1..n loop
      c1 := deck->d; c2 := deck->(d + 1); d := d + 2;
      st := jsonb_insert(st, '{players,-}', jsonb_build_object('user_id', pa[i], 'cards', jsonb_build_array(c1, c2),
        'folded', false, 'done', false, 'paid', 0));
    end loop;
    st := jsonb_set(st, '{deckIndex}', to_jsonb(d));
  else
    raise exception 'Jogo não suportado no online.';
  end if;

  update public.rooms set status = 'jogando', estado_json = st where id = p_codigo;
  return public.estado_sala_turnos(p_codigo);
end;
$$;

grant execute on function public.iniciar_partida_turnos(text, text) to anon, authenticated;
