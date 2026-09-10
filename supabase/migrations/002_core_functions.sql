-- =============================================================
-- Migration 002: funções RPC para o backend lógico do cassino
-- Substituem a transação síncrona do better-sqlite3 por uma
-- função atômica no Postgres (resolver_jogada).
-- =============================================================

-- Snapshot do usuário (saldo, perdido, rodadas, risco, últimas 60 rounds)
create or replace function public.obter_snapshot(p_user_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  u public.users%rowtype;
  recent_json jsonb;
  bal integer;
  lost integer;
  rounds int;
  risk numeric;
begin
  select * into u from public.users where id = p_user_id;
  if not found then
    return null;
  end if;

  bal := u.saldo_centavos;
  lost := u.total_perdido_centavos;
  rounds := u.rodadas_jogadas;
  risk := least(100, round((lost::numeric / 100000.0) * 100));

  select coalesce(
    jsonb_agg(x order by x.criado_em desc), '[]'::jsonb)
    into recent_json
    from (
      select id, user_id, tipo_jogo, aposta_centavos, resultado,
             multiplicador, saldo_antes_centavos, saldo_depois_centavos, criado_em
      from public.rounds
      where user_id = p_user_id
      order by criado_em desc
      limit 60
    ) x;

  return jsonb_build_object(
    'balance',     bal,
    'totalLost',   lost,
    'rounds',      rounds,
    'riskScore',   risk,
    'recent',      recent_json
  );
end;
$$;

-- Resolve uma aposta de forma atômica e retorna o novo snapshot.
-- Verifica saldo (for update), debita, insere em rounds e transactions.
create or replace function public.resolver_jogada(
  p_user_id text,
  p_jogo text,
  p_aposta_centavos integer,
  p_resultado text,
  p_multiplicador real
)
returns jsonb
language plpgsql
security definer
as $$
declare
  u public.users%rowtype;
  before_c integer;
  after_c  integer;
  loss_c   integer;
  now_ms   bigint;
begin
  select * into u from public.users where id = p_user_id for update;
  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  if p_aposta_centavos <= 0 or p_aposta_centavos > u.saldo_centavos then
    raise exception 'Aposta inválida ou saldo insuficiente.';
  end if;

  before_c := u.saldo_centavos;
  after_c  := greatest(0, before_c - p_aposta_centavos
                          + round(p_aposta_centavos * coalesce(p_multiplicador, 0))::integer);
  loss_c   := greatest(0, before_c - after_c);
  now_ms   := floor(extract(epoch from clock_timestamp()) * 1000)::bigint;

  update public.users
     set saldo_centavos = after_c,
         total_perdido_centavos = total_perdido_centavos + loss_c,
         rodadas_jogadas = rodadas_jogadas + 1,
         atualizado_em = now_ms
   where id = p_user_id;

  insert into public.rounds
    (id, user_id, tipo_jogo, aposta_centavos, resultado, multiplicador,
     saldo_antes_centavos, saldo_depois_centavos, criado_em)
    values
    (gen_random_uuid()::text, p_user_id, p_jogo, p_aposta_centavos, p_resultado,
     p_multiplicador, before_c, after_c, now_ms);

  insert into public.transactions
    (id, user_id, tipo, valor_centavos, saldo_anterior_centavos,
     saldo_novo_centavos, descricao, criado_em)
    values
    (gen_random_uuid()::text, p_user_id,
     case when p_multiplicador > 0 then 'resultado' else 'perda' end,
     after_c - before_c, before_c, after_c, p_resultado, now_ms);

  return public.obter_snapshot(p_user_id);
end;
$$;