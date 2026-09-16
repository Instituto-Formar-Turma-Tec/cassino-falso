import React from "react"
import { useOnlineRoom } from "@/lib/online-room"
import PokerOnline from "./games/PokerOnline"
import BlackjackOnline from "./games/BlackjackOnline"
import BichoOnline from "./games/BichoOnline"

const GAME_MAP: Record<string, React.FC> = {
  poker: PokerOnline,
  blackjack: BlackjackOnline,
  bicho: BichoOnline,
}

export default function OnlineRoomShell() {
  const { estado, codigo, user, loading, iniciar, sair, recarregar } =
    useOnlineRoom()
  if (!estado || !codigo) return null

  const { sala, jogadores } = estado
  const isHost = sala.host_id === user.id
  const phase = sala.estado?.phase

  // ─── Waiting room ────────────────────────────────────────
  if (sala.status === "aguardando") {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="font-casino text-3xl gold-shimmer">SALA ONLINE</div>
          <div className="font-casino text-lg text-yellow-500 mt-1">
            Código: <span className="tracking-widest">{codigo}</span>
          </div>
          <div className="text-xs text-yellow-800 font-display mt-1">
            Compartilhe o código com seus amigos
          </div>
        </div>

        <div
          className="p-4 rounded-xl border"
          style={{ background: "#0a0300", borderColor: "#2a1000" }}
        >
          <div className="text-xs text-yellow-700 font-display tracking-widest uppercase mb-3">
            Jogadores ({jogadores.length}/{sala.max_jogadores})
          </div>
          <div className="space-y-2">
            {jogadores.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: "#120600", border: "1px solid #3a1800" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "linear-gradient(135deg,#7c5200,#d4a017)",
                    color: "#050100",
                  }}
                >
                  {p.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-yellow-400 font-display">
                    {p.nome}
                  </div>
                  <div className="text-xs text-yellow-800 font-display">
                    {p.user_id.slice(-8)}
                  </div>
                </div>
                {p.user_id === sala.host_id && (
                  <span
                    className="text-xs px-2 py-0.5 rounded font-casino"
                    style={{
                      background: "#3a1000",
                      color: "#d4a017",
                      border: "1px solid #5a2000",
                    }}
                  >
                    HOST
                  </span>
                )}
                {p.user_id === user.id && (
                  <span
                    className="text-xs px-2 py-0.5 rounded font-casino"
                    style={{
                      background: "#001a00",
                      color: "#4ade80",
                      border: "1px solid #003a00",
                    }}
                  >
                    VOCÊ
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {isHost && jogadores.length >= 2 && (
            <button
              onClick={iniciar}
              disabled={loading}
              className="btn-gold flex-1 py-3 rounded-xl text-sm tracking-widest uppercase disabled:opacity-60"
            >
              {loading ? "Iniciando..." : "INICIAR PARTIDA"}
            </button>
          )}
          {isHost && jogadores.length < 2 && (
            <div className="flex-1 text-center text-xs text-yellow-800 font-display py-3">
              Aguardando mais jogadores...
            </div>
          )}
          <button
            onClick={sair}
            className="btn-red px-6 py-3 rounded-xl text-sm tracking-widest uppercase"
          >
            Sair
          </button>
        </div>

        <div className="text-center text-xs text-yellow-900 font-display">
          Jogo: <span className="text-yellow-600 uppercase">{sala.jogo}</span> ·
          Aposta: R${(sala.aposta_centavos / 100).toFixed(0)} por rodada
        </div>
      </div>
    )
  }

  // ─── Game in progress ────────────────────────────────────
  const GameComponent = GAME_MAP[sala.jogo]

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div
        className="flex items-center justify-between p-3 rounded-xl border"
        style={{ background: "#0a0300", borderColor: "#2a1000" }}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              sala.status === "jogando"
                ? "bg-yellow-400 animate-pulse"
                : "bg-red-500"
            }`}
          />
          <span className="text-xs text-yellow-600 font-display tracking-widest uppercase">
            {sala.status === "jogando" ? "PARTIDA EM ANDAMENTO" : "ENCERRADA"}
          </span>
        </div>
        <div className="text-xs text-yellow-700 font-display">
          {sala.jogo.toUpperCase()} · {codigo}
        </div>
      </div>

      {/* Leaderboard sidebar */}
      <div
        className="p-3 rounded-xl border"
        style={{ background: "#0a0300", borderColor: "#2a1000" }}
      >
        <div className="text-xs text-yellow-800 font-display tracking-widest uppercase mb-2">
          Placar
        </div>
        <div className="space-y-1">
          {[...jogadores]
            .sort((a, b) => b.saldo_centavos - a.saldo_centavos)
            .map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-display
              ${p.user_id === user.id ? "border border-yellow-700/60" : ""}`}
                style={{ background: i === 0 ? "#1a1200" : "transparent" }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-yellow-800 w-4 text-right">
                    {i + 1}.
                  </span>
                  <span
                    className={
                      p.user_id === user.id
                        ? "text-yellow-300"
                        : "text-yellow-600"
                    }
                  >
                    {p.nome} {p.user_id === user.id && "(você)"}
                  </span>
                </div>
                <span
                  className={`font-casino ${
                    p.saldo_centavos >= 10000
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  R${(p.saldo_centavos / 100).toFixed(0)}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Game board */}
      <div
        className="p-5 rounded-xl border"
        style={{ background: "#080200", border: "1px solid #2a1000" }}
      >
        {GameComponent && <GameComponent />}
      </div>

      {/* Encerrada: resultado final */}
      {sala.status === "encerrada" && (
        <div
          className="p-5 rounded-xl border text-center"
          style={{ background: "#1a1200", border: "1px solid #d4a01760" }}
        >
          <div className="font-casino text-2xl neon-gold text-yellow-400 mb-3">
            PARTIDA ENCERRADA
          </div>
          <div className="font-casino text-lg text-yellow-600 mb-4">
            Vencedor:{" "}
            <span className="text-yellow-300">
              {jogadores.find((j) => j.venceu)?.nome || "?"}
            </span>
          </div>
          <button
            onClick={sair}
            className="btn-gold px-8 py-3 rounded-xl text-sm tracking-widest uppercase"
          >
            Voltar ao Lobby
          </button>
        </div>
      )}

      <button
        onClick={recarregar}
        className="text-xs text-yellow-800 font-display underline w-full text-center"
      >
        Atualizar estado
      </button>
    </div>
  )
}
