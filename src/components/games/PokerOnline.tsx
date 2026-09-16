import React from "react"
import { useOnlineRoom } from "@/lib/online-room"
import { determineWinner, cardDisplay } from "@/lib/poker-hands"

export default function PokerOnline() {
  const { estado, user, loading, acao, finalizarPoker } = useOnlineRoom()
  if (!estado) return null
  const { sala, jogadores } = estado
  const st = sala.estado
  if (!st || !st.players) return null

  const players: any[] = st.players
  const community: string[] = st.community || []
  const deck: string[] = st.deck || []
  const turnIndex = st.turnIndex
  const street = st.street
  const pot = st.pot
  const phase = st.phase
  const myIdx = players.findIndex((p: any) => p.user_id === user.id)
  const myPlayer = myIdx >= 0 ? players[myIdx] : null
  const isMyTurn = turnIndex > 0 && players[turnIndex - 1]?.user_id === user.id

  const streetNames: Record<number, string> = {
    1: "Pré-Flop",
    2: "Flop",
    3: "Turn",
    4: "River",
  }

  function renderCard(c: string, hidden = false) {
    if (hidden)
      return (
        <div className="w-10 h-14 rounded-lg border-2 border-red-800 bg-red-900 flex items-center justify-center">
          <span className="text-red-600 text-xs">🂠</span>
        </div>
      )
    const { rank, suit, color } = cardDisplay(c)
    return (
      <div
        className="w-10 h-14 rounded-lg border-2 border-gray-300 bg-white flex flex-col items-center justify-center card-deal"
        style={{ color, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
      >
        <div className="text-xs leading-none font-bold">{rank}</div>
        <div className="text-base leading-none">{suit}</div>
      </div>
    )
  }

  function renderPlayerCard(p: any, idx: number) {
    const isCurrentTurn = turnIndex === idx + 1
    const isMe = p.user_id === user.id
    const card0 = isMe ? p.cards?.[0] : p.cards?.[0] || null
    const card1 = isMe ? p.cards?.[1] : p.cards?.[1] || null

    return (
      <div
        key={p.user_id}
        className={`p-3 rounded-xl border transition-all ${
          isCurrentTurn
            ? "border-yellow-400 bg-yellow-900/20"
            : p.folded
              ? "border-red-900/40 bg-red-900/10 opacity-50"
              : "border-gray-800 bg-gray-900/30"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-display font-semibold">
            <span className={isMe ? "text-yellow-300" : "text-yellow-600"}>
              {p.user_id === user.id
                ? "Você"
                : jogadores.find((j) => j.user_id === p.user_id)?.nome ||
                  p.user_id.slice(-6)}
            </span>
          </div>
          {isCurrentTurn && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-700 text-yellow-100 font-display">
              VEZ
            </span>
          )}
          {p.folded && (
            <span className="text-xs px-2 py-0.5 rounded bg-red-800 text-red-200 font-display">
              FOLD
            </span>
          )}
        </div>
        <div className="flex gap-1.5 justify-center">
          {renderCard(card0 || "??")}
          {renderCard(card1 || "??")}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Street indicator */}
      <div className="text-center">
        <div className="font-casino text-xl text-yellow-500">
          {streetNames[street] || "Showdown"}
        </div>
        <div className="text-xs text-yellow-800 font-display">
          Pote:{" "}
          <span className="text-yellow-400">R${(pot / 100).toFixed(0)}</span>
        </div>
      </div>

      {/* Community cards */}
      <div className="flex gap-2 justify-center py-3">
        {community.length === 0 ? (
          <div className="text-xs text-yellow-900 font-display">
            Aguardando flop...
          </div>
        ) : (
          community.map((c: string, i: number) => (
            <div
              key={i}
              className="card-deal"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {renderCard(c)}
            </div>
          ))
        )}
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {players.map((p: any, i: number) => renderPlayerCard(p, i))}
      </div>

      {/* My turn controls */}
      {phase === "jogando" && isMyTurn && !myPlayer?.folded && (
        <div className="flex gap-3">
          <button
            onClick={() => acao({ tipo: "confirmar" })}
            disabled={loading}
            className="btn-gold flex-1 py-3 rounded-xl text-sm tracking-widest uppercase disabled:opacity-60"
          >
            Pagar Aposta
          </button>
          <button
            onClick={() => acao({ tipo: "desistir" })}
            disabled={loading}
            className="btn-red flex-1 py-3 rounded-xl text-sm tracking-widest uppercase disabled:opacity-60"
          >
            Desistir (Fold)
          </button>
        </div>
      )}

      {phase === "jogando" && !isMyTurn && (
        <div className="text-center text-xs text-yellow-800 font-display py-2">
          Aguardando a vez de{" "}
          {players[turnIndex - 1]?.user_id === user.id
            ? "você"
            : jogadores.find(
                (j) => j.user_id === players[turnIndex - 1]?.user_id,
              )?.nome || "..."}
        </div>
      )}

      {/* Showdown */}
      {phase === "showdown" && (
        <div
          className="p-4 rounded-xl text-center"
          style={{ background: "#1a1200", border: "1px solid #d4a01760" }}
        >
          <div className="font-casino text-xl text-yellow-400 mb-2">
            SHOWDOWN
          </div>
          <div className="text-xs text-yellow-700 font-display mb-3">
            Defina quem ganhou (baseado na mão)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {players
              .filter((p: any) => !p.folded)
              .map((p: any) => (
                <button
                  key={p.user_id}
                  onClick={() => finalizarPoker(p.user_id)}
                  disabled={loading}
                  className="btn-gold py-2 rounded-lg text-xs tracking-widest uppercase disabled:opacity-60"
                >
                  {p.user_id === user.id
                    ? "Você"
                    : jogadores.find((j) => j.user_id === p.user_id)?.nome ||
                      p.user_id.slice(-6)}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
