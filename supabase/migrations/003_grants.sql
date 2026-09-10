-- =============================================================
-- Migration 003: expor tabelas + funções RPC para o anon key
-- O projeto tem RLS ATIVA nas tabelas. Habilitamos aqui o acesso
-- pleno para o papel `anon` (que a chave public uses). Como a lógica
-- de negócio (saldo, aposta) roda 100% dentro de resolver_jogada /
-- obter_snapshot (SECURITY DEFINER), o acesso direto às tabelas
-- precisa ser concessivo para o fluxo do app.
-- =============================================================

-- --- Tabelas: grants totais para anon + authenticated ---
grant select, insert, update, delete on public.users        to anon, authenticated;
grant select, insert, update, delete on public.sessions     to anon, authenticated;
grant select, insert, update, delete on public.rounds       to anon, authenticated;
grant select, insert, update, delete on public.transactions to anon, authenticated;

-- --- Funções RPC: executáveis por anon ---
grant execute on function public.obter_snapshot(text)       to anon, authenticated;
grant execute on function public.resolver_jogada(text, text, integer, text, real) to anon, authenticated;