import React, { useState, useEffect } from "react"
import { useOnlineRoom } from "@/lib/online-room"
import { listarSalas } from "@/lib/room-api"

type Props = { jogo: "poker" | "blackjack" | "bicho" }

export default function OnlineLobby({ jogo }: Props) {
  const { criar, entrar, user, loading, error } = useOnlineRoom()
  const [salas, setSalas] = useState<any[]>([])
  const [nomeJogador, setNomeJogador] = useState(user.nome)
  const [inputCodigo, setInputCodigo] = useState("")
  const [maxJogadores, setMaxJogadores] = useState(4)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    refresh()
  }, [jogo])

  async function refresh() {
    try {
      const salas = await listarSalas(jogo)
      setSalas(salas.filter((s) => s.jogo === jogo))
    } catch {
      /* ok */
    }
  }

  async function handleCriar() {
    try {
      const cod = await criar(jogo, nomeJogador, maxJogadores)
      setMsg("Sala criada! Código: " + cod)
    } catch {
      /* error is in context */
    }
  }

  async function handleEntrar(cod?: string) {
    const c = cod || inputCodigo.trim().toUpperCase()
    if (!c) return
    try {
      await entrar(c)
    } catch {
      /* error in context */
    }
  }

  const jogoLabel =
    jogo === "bicho"
      ? "Jogo do Bicho"
      : jogo === "poker"
        ? "Pôquer"
        : "Blackjack"

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="font-casino text-3xl gold-shimmer">
          {jogoLabel} — ONLINE
        </div>
        <div className="text-xs text-yellow-700 font-display mt-1">
          Crie ou entre numa sala competitiva
        </div>
      </div>

      {/* Nome do jogador */}
      <div
        className="p-4 rounded-xl border"
        style={{ background: "#0a0300", borderColor: "#2a1000" }}
      >
        <div className="text-xs text-yellow-700 font-display tracking-widest uppercase mb-2">
          Seu nome
        </div>
        <input
          value={nomeJogador}
          onChange={(e) => setNomeJogador(e.target.value)}
          className="casino-input w-full px-4 py-2 rounded-lg text-sm font-display"
        />
        <div className="text-xs text-yellow-900 font-display mt-1">
          ID: <span className="text-yellow-600">{user.id.slice(-8)}</span>
        </div>
      </div>

      {/* Criar sala */}
      <div
        className="p-4 rounded-xl border"
        style={{ background: "#0a0300", borderColor: "#2a1000" }}
      >
        <div className="text-xs text-yellow-700 font-display tracking-widest uppercase mb-3">
          Criar Sala
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-yellow-800 font-display">
              Max jogadores
            </label>
            <select
              value={maxJogadores}
              onChange={(e) => setMaxJogadores(+e.target.value)}
              className="casino-input w-full px-3 py-2 rounded-lg text-sm font-display mt-1"
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCriar}
            disabled={loading}
            className="btn-gold px-6 py-2 rounded-xl text-sm tracking-widest uppercase disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar Sala"}
          </button>
        </div>
      </div>

      {/* Entrar por código */}
      <div
        className="p-4 rounded-xl border"
        style={{ background: "#0a0300", borderColor: "#2a1000" }}
      >
        <div className="text-xs text-yellow-700 font-display tracking-widest uppercase mb-3">
          Entrar por Código
        </div>
        <div className="flex gap-3 items-end flex-wrap">
          <input
            value={inputCodigo}
            onChange={(e) => setInputCodigo(e.target.value.toUpperCase())}
            placeholder="Ex: AB12CD"
            maxLength={6}
            className="casino-input flex-1 min-w-[140px] px-4 py-2 rounded-lg text-sm font-display uppercase tracking-widest"
          />
          <button
            onClick={() => handleEntrar()}
            disabled={loading || !inputCodigo.trim()}
            className="btn-red px-6 py-2 rounded-xl text-sm tracking-widest uppercase disabled:opacity-60"
          >
            Entrar
          </button>
        </div>
      </div>

      {/* Salas abertas */}
      <div
        className="p-4 rounded-xl border"
        style={{ background: "#0a0300", borderColor: "#2a1000" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-yellow-700 font-display tracking-widest uppercase">
            Salas Abertas
          </div>
          <button
            onClick={refresh}
            className="text-xs text-yellow-600 hover:text-yellow-400 font-display underline"
          >
            Atualizar
          </button>
        </div>
        {salas.length === 0 ? (
          <div className="text-xs text-yellow-900 font-display text-center py-4">
            Nenhuma sala aberta. Crie uma!
          </div>
        ) : (
          <div className="space-y-2">
            {salas.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ background: "#120600", borderColor: "#3a1800" }}
              >
                <div>
                  <div className="text-sm text-yellow-400 font-display font-bold tracking-widest">
                    {s.id}
                  </div>
                  <div className="text-xs text-yellow-800 font-display">
                    {s.jogadores_atuais}/{s.max_jogadores} jogadores · Aposta R$
                    {(s.aposta_centavos / 100).toFixed(0)}
                  </div>
                </div>
                <button
                  onClick={() => handleEntrar(s.id)}
                  disabled={loading || s.jogadores_atuais >= s.max_jogadores}
                  className="btn-gold px-4 py-1.5 rounded-lg text-xs tracking-widest uppercase disabled:opacity-60"
                >
                  Entrar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {(error || msg) && (
        <div
          className="p-3 rounded-xl text-center text-sm font-display"
          style={{
            background: error ? "#1a0000" : "#0a1a00",
            border: error ? "1px solid #5a0000" : "1px solid #2a5a00",
          }}
        >
          <span className={error ? "text-red-400" : "text-green-400"}>
            {error || msg}
          </span>
        </div>
      )}
    </div>
  )
}
