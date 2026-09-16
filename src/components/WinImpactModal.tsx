import React from "react"
import { WIN_IMPACT_QUOTES, getRandomQuote, ImpactQuote } from "@/lib/impact-phrases"

interface WinImpactModalProps {
  isOpen: boolean
  prizeDescription?: string
  onClose: () => void
}

export default function WinImpactModal({ isOpen, prizeDescription, onClose }: WinImpactModalProps) {
  if (!isOpen) return null

  const quote = getRandomQuote(WIN_IMPACT_QUOTES)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="game-card rounded-2xl p-6 max-w-lg w-full border border-yellow-500 shadow-2xl relative gold-border-anim text-center space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl animate-bounce">🎁</div>

        <h3 className="font-casino text-3xl text-yellow-400 neon-gold tracking-wider">
          VOCÊ GANHO UMA RODADA!
        </h3>

        {prizeDescription && (
          <div className="text-sm font-display text-green-400 font-bold bg-green-950/40 p-2.5 rounded-xl border border-green-800">
            {prizeDescription}
          </div>
        )}

        <div className="bg-yellow-950/40 border border-yellow-700/50 p-4 rounded-xl text-left space-y-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-red-400 text-lg">⚠️</span>
            <span className="text-xs font-bold text-yellow-400 font-display uppercase tracking-wider">
              {quote.autor} — {quote.contexto}
            </span>
          </div>

          <blockquote className="text-xs text-yellow-100/90 leading-relaxed italic border-l-2 border-yellow-500 pl-3 my-2 font-display">
            "{quote.depoimento}"
          </blockquote>
        </div>

        <div className="text-[11px] text-yellow-600 font-display leading-relaxed">
          O cassino utiliza pequenas vitórias temporárias para disparar dopamina no seu cérebro, fazendo você aumentar as apostas e perder tudo no final.
        </div>

        <button
          onClick={onClose}
          className="btn-gold w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg"
        >
          Entendi a Ilusão da Vitória ➔
        </button>
      </div>
    </div>
  )
}
