'use client';

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

// Client do browser (usa anon key pública). Use apenas em componentes 'use client'.
export const supabaseBrowser: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ============================================================
// Tipos
// ============================================================
export interface Sala {
  id: string;
  jogo: 'roleta' | 'poker' | 'blackjack';
  max_jogadores: number;
  rodadas_total: number;
  rodadas_atuais: number;
  aposta_centavos: number;
  status: 'aguardando' | 'jogando' | 'encerrada';
  host_id: string;
  criado_em: number;
  encerrado_em: number | null;
  jogadores_atuais?: number;
}

export interface JogadorSala {
  id: string;
  user_id: string;
  nome: string;
  matricula: string;
  saldo_centavos: number;
  aposta_atual: number | null;
  escolha: string | null;
  venceu: boolean | null;
  criado_em: number;
}

export interface RodadaSala {
  id: string;
  numero: number;
  resultado: string;
  multiplicador: number;
  criado_em: number;
}

export interface EstadoSala {
  sala: Sala;
  jogadores: JogadorSala[];
  rodadas: RodadaSala[];
}

// ============================================================
// Helpers RPC (chamadas server-side via API routes)
// ============================================================
export async function criarSala(params: {
  jogo: 'roleta' | 'poker' | 'blackjack';
  max_jogadores: number;
  rodadas_total: number;
  aposta_centavos: number;
}) {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar sala');
  return (await res.json()) as { codigo: string };
}

export async function entrarSala(codigo: string) {
  const res = await fetch(`/api/rooms/${codigo}/join`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao entrar');
}

export async function registrarAposta(codigo: string, aposta_centavos: number, escolha: string) {
  const res = await fetch(`/api/rooms/${codigo}/apostar`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ aposta_centavos, escolha }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao apostar');
}

export async function iniciarPartida(codigo: string) {
  const res = await fetch(`/api/rooms/${codigo}/iniciar`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao iniciar');
}

export async function resolverRodada(codigo: string, resultado: string, multiplicador: number) {
  const res = await fetch(`/api/rooms/${codigo}/resolver`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ resultado, multiplicador }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao resolver');
  return await res.json();
}

export async function finalizarSala(codigo: string) {
  const res = await fetch(`/api/rooms/${codigo}/finalizar`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json()).error || 'Erro ao finalizar');
  return await res.json();
}

export async function obterEstadoSala(codigo: string): Promise<EstadoSala | null> {
  const res = await fetch(`/api/rooms/${codigo}/estado`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Erro ao obter estado');
  return await res.json();
}

export async function listarSalasAbertas(): Promise<Sala[]> {
  const res = await fetch('/api/rooms');
  if (!res.ok) throw new Error('Erro ao listar salas');
  return await res.json();
}

// ============================================================
// Realtime subscriptions (client-side)
// ============================================================

// Subscreve a alterações na sala (status, rodadas_atuais, etc.)
export function subscreverSala(
  codigo: string,
  onChange: (payload: any) => void
): RealtimeChannel {
  return supabaseBrowser
    .channel(`sala-${codigo}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${codigo}` },
      onChange
    )
    .subscribe();
}

// Subscreve alterações nos jogadores (apostas, saldo, etc.)
export function subscreverJogadores(
  codigo: string,
  onChange: (payload: any) => void
): RealtimeChannel {
  return supabaseBrowser
    .channel(`sala-jogadores-${codigo}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${codigo}` },
      onChange
    )
    .subscribe();
}

// Subscreve novas rodadas
export function subscreverRodadas(
  codigo: string,
  onChange: (payload: any) => void
): RealtimeChannel {
  return supabaseBrowser
    .channel(`sala-rodadas-${codigo}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'room_rounds', filter: `room_id=eq.${codigo}` },
      onChange
    )
    .subscribe();
}

// Subscreve tudo (sala + jogadores + rodadas) e retorna função cleanup
export function subscreverSalaCompleta(
  codigo: string,
  onSalaChange: (payload: any) => void,
  onJogadoresChange: (payload: any) => void,
  onRodadasChange: (payload: any) => void
): () => void {
  const chSala = subscreverSala(codigo, onSalaChange);
  const chJog = subscreverJogadores(codigo, onJogadoresChange);
  const chRod = subscreverRodadas(codigo, onRodadasChange);

  return () => {
    supabaseBrowser.removeChannel(chSala);
    supabaseBrowser.removeChannel(chJog);
    supabaseBrowser.removeChannel(chRod);
  };
}