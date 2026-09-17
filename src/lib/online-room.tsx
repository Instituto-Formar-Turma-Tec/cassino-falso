import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react"
import { supabase, getAnonUser } from "./supabase"
import * as api from "./room-api"

// ---------- Context shape ----------
interface OnlineRoomCtx {
  user: { id: string; nome: string }
  codigo: string | null
  estado: api.RoomEstado | null
  loading: boolean
  error: string | null

  criar: (jogo: string, nome?: string) => Promise<string>
  entrar: (codigo: string) => Promise<void>
  iniciar: () => Promise<void>
  acao: (acao: any) => Promise<void>
  finalizarPoker: (vencedor: string) => Promise<void>
  sair: () => void
  limparErro: () => void
  recarregar: () => Promise<void>
}

const Ctx = createContext<OnlineRoomCtx | null>(null)
export const useOnlineRoom = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error("useOnlineRoom must be inside <OnlineRoomProvider>")
  return c
}

// ---------- Provider ----------
export function OnlineRoomProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user] = useState(() => getAnonUser())
  const [codigo, setCodigo] = useState<string | null>(null)
  const [estado, setEstado] = useState<api.RoomEstado | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subRef = useRef<any>(null)

  // Subscribe to realtime changes on rooms
  useEffect(() => {
    if (!codigo) {
      subRef.current?.unsubscribe()
      return
    }

    const ch = supabase
      .channel("room:" + codigo)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${codigo}`,
        },
        async () => {
          try {
            const s = await api.estadoSala(codigo)
            setEstado(s)
          } catch {
            /* stale room */
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${codigo}`,
        },
        async () => {
          try {
            const s = await api.estadoSala(codigo)
            setEstado(s)
          } catch {
            /* stale */
          }
        },
      )
      .subscribe()

    subRef.current = ch
    return () => {
      ch.unsubscribe()
    }
  }, [codigo])

  const criar = useCallback(
    async (jogo: string, nome?: string, max?: number) => {
      setLoading(true)
      setError(null)
      try {
        const c = await api.criarSala(jogo, nome || user.nome, max)
        setCodigo(c)
        const s = await api.estadoSala(c)
        setEstado(s)
        return c
      } catch (e: any) {
        setError(e.message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const entrar = useCallback(
    async (cod: string) => {
      setLoading(true)
      setError(null)
      try {
        const s = await api.entrarSala(cod, user.id, user.nome)
        setCodigo(cod)
        setEstado(s)
      } catch (e: any) {
        setError(e.message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  const iniciar = useCallback(async () => {
    if (!codigo) return
    setLoading(true)
    setError(null)
    try {
      const s = await api.iniciarPartida(codigo, user.id)
      setEstado(s)
    } catch (e: any) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [codigo, user])

  const acao = useCallback(
    async (a: any) => {
      if (!codigo) return
      setLoading(true)
      setError(null)
      try {
        const s = await api.acaoTurno(codigo, user.id, a)
        setEstado(s)
      } catch (e: any) {
        setError(e.message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [codigo, user],
  )

  const finalizarPoker = useCallback(
    async (vencedor: string) => {
      if (!codigo) return
      setLoading(true)
      setError(null)
      try {
        const s = await api.finalizarPoker(codigo, vencedor)
        setEstado(s)
      } catch (e: any) {
        setError(e.message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [codigo],
  )

  const sair = useCallback(() => {
    subRef.current?.unsubscribe()
    setCodigo(null)
    setEstado(null)
  }, [])

  const limparErro = useCallback(() => setError(null), [])

  const recarregar = useCallback(async () => {
    if (!codigo) return
    try {
      const s = await api.estadoSala(codigo)
      setEstado(s)
    } catch {
      /* ok */
    }
  }, [codigo])

  return (
    <Ctx.Provider
      value={{
        user,
        codigo,
        estado,
        loading,
        error,
        criar,
        entrar,
        iniciar,
        acao,
        finalizarPoker,
        sair,
        limparErro,
        recarregar,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}
