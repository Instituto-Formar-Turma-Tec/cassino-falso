-- =============================================================
-- Migration: cassino-reverso — schema inicial
-- Compatível com o frontend Next.js que usa better-sqlite3.
-- Todos os timestamps são bigint (milissegundos desde epoch),
-- igual ao Date.now() do JavaScript.
-- =============================================================

-- ====================== users ======================
create table if not exists public.users (
  id            text primary key,
  nome          text not null,
  matricula     text not null unique,
  senha_hash    text not null,
  saldo_centavos        integer not null default 100000,
  total_perdido_centavos integer not null default 0,
  rodadas_jogadas       integer not null default 0,
  criado_em      bigint not null,
  atualizado_em  bigint not null
);

create index if not exists idx_users_matricula
  on public.users (matricula);

-- ====================== sessions ======================
create table if not exists public.sessions (
  id        text primary key,
  user_id   text not null references public.users(id) on delete cascade,
  expira_em bigint not null,
  criado_em bigint not null
);

create index if not exists idx_sessions_user_id
  on public.sessions (user_id);
create index if not exists idx_sessions_expira_em
  on public.sessions (expira_em);

-- ====================== rounds ======================
create table if not exists public.rounds (
  id                   text primary key,
  user_id              text not null references public.users(id) on delete cascade,
  tipo_jogo            text not null,
  aposta_centavos      integer not null,
  resultado            text not null,
  multiplicador        real    not null,
  saldo_antes_centavos integer not null,
  saldo_depois_centavos integer not null,
  criado_em            bigint not null
);

create index if not exists idx_rounds_user_id
  on public.rounds (user_id);
create index if not exists idx_rounds_criado_em
  on public.rounds (criado_em);

-- ====================== transactions ======================
create table if not exists public.transactions (
  id                       text primary key,
  user_id                  text not null references public.users(id) on delete cascade,
  tipo                     text not null,
  valor_centavos           integer not null,
  saldo_anterior_centavos  integer not null,
  saldo_novo_centavos      integer not null,
  descricao                text,
  criado_em                bigint not null
);

create index if not exists idx_transactions_user_id
  on public.transactions (user_id);
