import React, { useState } from "react"
import { DEPOSIT_IMPACT_QUOTES, getRandomQuote, ImpactQuote } from "@/lib/impact-phrases"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onDeposit: (amountCents: number) => void
}

export default function DepositModal({ isOpen, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState<number>(100)
  const [activeQuote, setActiveQuote] = useState<ImpactQuote | null>(null)
  const [showImpactAlert, setShowImpactAlert] = useState(false)

  if (!isOpen) return null

  const handleStartDeposit = (selectedAmount: number) => {
    setAmount(selectedAmount)
    const quote = getRandomQuote(DEPOSIT_IMPACT_QUOTES)
    setActiveQuote(quote)
    setShowImpactAlert(true)
  }

  const handleConfirmDeposit = () => {
    onDeposit(amount * 100) // Converte para centavos
    setShowImpactAlert(false)
    setActiveQuote(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="game-card rounded-2xl p-6 max-w-lg w-full border border-yellow-600/50 shadow-2xl relative gold-border-anim max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-yellow-700 hover:text-yellow-400 text-xl font-bold transition-colors"
        >
          ✕
        </button>

        {/* Normal Deposit Selection Screen */}
        {!showImpactAlert ? (
          <div>
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2 float-anim">💰</span>
              <h2 className="font-casino text-3xl neon-gold text-yellow-400 tracking-wider">
                DEPÓSITO FICTÍCIO
              </h2>
              <p className="text-xs text-yellow-700 font-display mt-1">
                Adicione fichas de demonstração para entender a ilusão do jogo
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[50, 100, 500, 1000].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-3 px-4 rounded-xl border font-display text-sm font-bold transition-all ${
                    amount === val
                      ? "border-yellow-400 bg-yellow-900/40 text-yellow-300 scale-105 shadow-md"
                      : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-yellow-700"
                  }`}
                >
                  + R$ {val},00
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-display text-yellow-600 uppercase tracking-wider mb-2">
                Valor Personalizado (R$)
              </label>
              <input
                type="number"
                min={10}
                max={10000}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-yellow-100 font-casino text-xl focus:outline-none focus:border-yellow-500"
              />
            </div>

            <button
              onClick={() => handleStartDeposit(amount)}
              className="btn-gold w-full py-3.5 rounded-xl text-xs tracking-widest uppercase font-bold shadow-lg"
            >
              Confirmar Depósito (R$ {amount},00)
            </button>
          </div>
        ) : (
          /* Impact Alert Screen Triggered on Deposit */
          <div className="space-y-4 text-center">
            <div className="inline-block p-3 rounded-full bg-red-950 border border-red-700 text-red-400 animate-pulse text-2xl mb-1">
              ⚠️
            </div>

            <h3 className="font-casino text-2xl text-red-500 neon-red tracking-wider">
              ALERTA DE IMPACTO REAL — DEPOSITO
            </h3>

            <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-xl text-left space-y-2">
              <div className="text-xs font-bold text-yellow-400 font-display">
                {activeQuote?.autor}
              </div>
              <div className="text-[10px] text-red-400 uppercase tracking-widest font-display">
                Contexto: {activeQuote?.contexto}
              </div>
              <blockquote className="text-xs text-yellow-100/90 leading-relaxed italic border-l-2 border-red-600 pl-3 my-2 font-display">
                "{activeQuote?.depoimento}"
              </blockquote>
            </div>

            <div className="bg-yellow-950/30 border border-yellow-700/40 p-3 rounded-xl text-xs text-yellow-300 font-display leading-relaxed">
              💡 <strong>Lembrete Pedagógico:</strong> Na vida real, dinheiro depositado em casas de aposta é perdido em mais de 98% dos casos.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowImpactAlert(false)}
                className="btn-red flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeposit}
                className="btn-gold flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Entendi, Adicionar R$ {amount},00 Fictício
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
