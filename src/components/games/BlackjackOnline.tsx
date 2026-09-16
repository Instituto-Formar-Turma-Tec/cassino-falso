import React from "react"
import { useOnlineRoom } from "@/lib/online-room"

export default function BlackjackOnline() {
  const { estado, user, loading, acao } = useOnlineRoom()
  if (!estado) return null
  const { sala, jogadores } = estado
  const st = sala.estado
  if (!st || !st.players) return null

  const players: any[] = st.players
  const dealer: any = st.dealer
  const turnIndex = st.turnIndex
  const phase = st.phase
  const myIdx = players.findIndex((p: any) => p.user_id === user.id)
  const myPlayer = myIdx >= 0 ? players[myIdx] : null
  const isMyTurn = turnIndex > 0 && players[turnIndex - 1]?.user_id === user.id

  function calcTotal(cards: string[]): number {
    let total = 0,
      aces = 0
    for (const c of cards) {
      const rank = c[0]
      if (rank === "A") {
        total += 11
        aces++
      } else if (["T", "J", "Q", "K"].includes(rank)) total += 10
      else total += parseInt(rank)
    }
    while (total > 21 && aces > 0) {
      total -= 10
      aces--
    }
    return total
  }

  function renderCard(c: string, faceDown = false) {
    if (faceDown)
      return (
        <div className="w-10 h-14 rounded-lg border-2 border-red-800 bg-red-900 flex items-center justify-center">
          <span className="text-red-600 text-xs">🂠</span>
        </div>
      )
    const rank = c[0] === "T" ? "10" : c[0]
    const suitChar = c[1]
    const suitMap: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" }
    const color = suitChar === "h" || suitChar === "d" ? "#cc0000" : "#111"
    return (
      <div
        className="w-10 h-14 rounded-lg border-2 border-gray-200 bg-white flex flex-col items-center justify-center card-deal"
        style={{ color, boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
      >
        <div className="text-xs leading-none font-bold">{rank}</div>
        <div className="text-base leading-none">
          {suitMap[suitChar] || suitChar}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Dealer */}
      <div className="text-center">
        <div className="text-xs text-yellow-700 font-display tracking-widest uppercase mb-2">
          Mesa
        </div>
        <div className="flex gap-2 justify-center">
          {dealer?.cards?.map((c: string, i: number) => (
            <div key={i}>{renderCard(c, !dealer.revealed && i === 1)}</div>
          ))}
        </div>
        {dealer?.revealed && (
          <div className="font-casino text-xl text-yellow-500 mt-1">
            Total: {calcTotal(dealer.cards)}
            {calcTotal(dealer.cards) > 21 && (
              <span className="text-red-400 ml-2">BUST!</span>
            )}
          </div>
        )}
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {players.map((p: any, i: number) => {
          const total = calcTotal(p.cards || [])
          const isCurrentTurn = turnIndex === i + 1
          const isMe = p.user_id === user.id
          return (
            <div
              key={p.user_id}
              className={`p-3 rounded-xl border transition-all ${
                isCurrentTurn
                  ? "border-yellow-400 bg-yellow-900/20"
                  : p.done
                    ? "border-gray-700 opacity-60"
                    : "border-gray-800 bg-gray-900/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-display ${
                    isMe ? "text-yellow-300" : "text-yellow-600"
                  }`}
                >
                  {isMe
                    ? "Você"
                    : jogadores.find((j) => j.user_id === p.user_id)?.nome ||
                      p.user_id.slice(-6)}
                </span>
                {isCurrentTurn && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-700 text-yellow-100 font-display">
                    VEZ
                  </span>
                )}
                {p.done && (
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300 font-display">
                    PAROU
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 justify-center mb-1">
                {p.cards?.map((c: string, ci: number) => (
                  <div key={ci}>{renderCard(c)}</div>
                ))}
              </div>
              <div
                className="font-casino text-lg text-center mt-1"
                style={{ color: total > 21 ? "#ef4444" : "#fbbf24" }}
              >
                {total}
                {total > 21 ? " BUST!" : ""}
              </div>
            </div>
          )
        })}
      </div>

      {/* Turn controls */}
      {phase === "jogando" && isMyTurn && !myPlayer?.done && (
        <div className="flex gap-3">
          <button
            onClick={() => acao({ tipo: "pedir" })}
            disabled={loading}
            className="btn-gold flex-1 py-3 rounded-xl text-sm tracking-widest uppercase disabled:opacity-60"
          >
            Pedir Carta
          </button>
          <button
            onClick={() => acao({ tipo: "parar" })}
            disabled={loading}
            className="btn-red flex-1 py-3 rounded-xl text-sm tracking-widest uppercase disabled:opacity-60"
          >
            Parar
          </button>
        </div>
      )}

      {phase === "jogando" && !isMyTurn && (
        <div className="text-center text-xs text-yellow-800 font-display py-2">
          Aguardando{" "}
          {players[turnIndex - 1]?.user_id === user.id
            ? "sua vez"
            : jogadores.find(
                (j) => j.user_id === players[turnIndex - 1]?.user_id,
              )?.nome || "..."}
        </div>
      )}

      {phase === "encerrada" && (
        <div
          className="text-center p-3 rounded-xl"
          style={{ background: "#1a1200", border: "1px solid #d4a01760" }}
        >
          <div className="font-casino text-xl text-yellow-400">
            PARTIDA ENCERRADA
          </div>
        </div>
      )}
    </div>
  )
}
