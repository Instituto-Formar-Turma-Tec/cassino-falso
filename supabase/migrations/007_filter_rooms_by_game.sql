-- ============================================================
-- Migration 007: Isolar salas online por jogo
-- Adiciona parâmetro opcional p_jogo em listar_salas_turnos()
-- para que o banco filtre as salas por jogo.
-- ============================================================

-- Remove a versão anterior para evitar conflito de assinatura
DROP FUNCTION IF EXISTS public.listar_salas_turnos();

-- Cria a nova versão com parâmetro opcional
CREATE OR REPLACE FUNCTION public.listar_salas_turnos(p_jogo text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id',            r.id,
          'jogo',          r.jogo,
          'max_jogadores', r.max_jogadores,
          'aposta_centavos', r.aposta_centavos,
          'status',        r.status,
          'host_id',       r.host_id,
          'criado_em',     r.criado_em,
          'jogadores_atuais', (SELECT count(*) FROM public.room_players WHERE room_id = r.id)
        ) ORDER BY r.criado_em DESC
      )
      FROM public.rooms r
      WHERE r.status = 'aguardando'
        AND r.jogo IN ('poker', 'blackjack', 'bicho')
        AND (p_jogo IS NULL OR r.jogo = p_jogo)
    ),
    '[]'::jsonb
  );
END;
$$;

-- Preserva grants existentes
GRANT EXECUTE ON FUNCTION public.listar_salas_turnos(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listar_salas_turnos() TO anon, authenticated;
