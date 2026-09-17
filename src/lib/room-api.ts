import { supabase } from "./supabase"

// ---------- Types ----------
export interface RoomPlayer {
  id: string
  user_id: string
  nome: string
  matricula: string
  saldo_centavos: number
  aposta_atual: number | null
  escolha: string | null
  venceu: boolean | null
  criado_em: number
}

export interface RoomRound {
  id: string
  numero: number
  resultado: string
  multiplicador: number
  criado_em: number
}

export interface RoomEstado {
  sala: {
    id: string
    jogo: "poker" | "blackjack" | "bicho"
    max_jogadores: number
    rodadas_total: number
    rodadas_atuais: number
    aposta_centavos: number
    status: "aguardando" | "jogando" | "encerrada"
    host_id: string
    criado_em: number
    encerrado_em: number | null
    estado: any
  }
  jogadores: RoomPlayer[]
  rodadas: RoomRound[]
}

// ---------- RPC wrappers ----------
async function rpc<T = any>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export async function criarSala(
  jogo: string,
  nome: string,
  max?: number,
  aposta?: number,
): Promise<string> {
  return rpc<string>("criar_sala_turnos", {
    p_jogo: jogo,
    p_nome: nome,
    p_max_jogadores: max ?? 6,
    p_aposta_centavos: aposta ?? 1000,
  })
}

export async function entrarSala(
  codigo: string,
  userId: string,
  nome: string,
): Promise<RoomEstado> {
  return rpc<RoomEstado>("entrar_sala_turnos", {
    p_codigo: codigo,
    p_user_id: userId,
    p_nome: nome,
  })
}

export async function iniciarPartida(
  codigo: string,
  userId: string,
): Promise<RoomEstado> {
  return rpc<RoomEstado>("iniciar_partida_turnos", {
    p_codigo: codigo,
    p_user_id: userId,
  })
}

export async function acaoTurno(
  codigo: string,
  userId: string,
  acao: any,
): Promise<RoomEstado> {
  return rpc<RoomEstado>("acao_turno", {
    p_codigo: codigo,
    p_user_id: userId,
    p_acao: acao,
  })
}

export async function finalizarPoker(
  codigo: string,
  vencedor: string,
): Promise<RoomEstado> {
  return rpc<RoomEstado>("finalizar_poker", {
    p_codigo: codigo,
    p_vencedor_user_id: vencedor,
  })
}

export async function listarSalas(jogo?: string): Promise<any[]> {
  return rpc<any[]>("listar_salas_turnos", jogo ? { p_jogo: jogo } : {})
}

export async function estadoSala(codigo: string): Promise<RoomEstado> {
  return rpc<RoomEstado>("estado_sala_turnos", { p_codigo: codigo })
}
