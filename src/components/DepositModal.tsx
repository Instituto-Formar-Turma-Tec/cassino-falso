import React, { useState } from "react"
import {
  DEPOSIT_IMPACT_QUOTES,
  getRandomQuote,
  getEquivalenciaFinanceira,
  ImpactQuote,
} from "@/lib/impact-phrases"

interface DepositModalProps {
  isOpen: boolean
  onClose: () => void
  onDeposit: (amountCents: number) => void
}

export default function DepositModal({ isOpen, onClose, onDeposit }: DepositModalProps) {
  const [amount, setAmount] = useState<number>(100)
  const [method, setMethod] = useState<"pix" | "cartao" | "emprestimo">("pix")
  const [activeQuote, setActiveQuote] = useState<ImpactQuote | null>(null)
  const [showImpactAlert, setShowImpactAlert] = useState(false)
  const [successToast, setSuccessToast] = useState(false)

  if (!isOpen) return null

  const handleStartDeposit = (selectedAmount: number) => {
    setAmount(selectedAmount)
    const quote = getRandomQuote(DEPOSIT_IMPACT_QUOTES)
    setActiveQuote(quote)
    setShowImpactAlert(true)
  }

  const handleConfirmDeposit = () => {
    onDeposit(amount * 100) // Converte para centavos
    setSuccessToast(true)
    setTimeout(() => {
      setSuccessToast(false)
      setShowImpactAlert(false)
      setActiveQuote(null)
      onClose()
    }, 1200)
  }

  const equivalencia = getEquivalenciaFinanceira(amount)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="game-card rounded-2xl p-5 sm:p-6 max-w-lg w-full border border-amber-500/60 shadow-2xl relative gold-border-anim max-h-[92vh] overflow-y-auto bg-neutral-900 text-amber-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-amber-500 hover:text-amber-300 text-xl font-bold transition-colors p-1"
          title="Fechar"
        >
          ✕
        </button>

        {successToast && (
          <div className="absolute inset-0 bg-neutral-950/95 z-30 flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-fade-in">
            <span className="text-5xl mb-3 animate-bounce">✅</span>
            <h3 className="font-casino text-3xl text-emerald-400 tracking-wider">
              DEPÓSITO FICTÍCIO CONCLUÍDO!
            </h3>
            <p className="text-sm font-display text-amber-200 mt-2">
              + R$ {amount.toLocaleString("pt-BR")},00 adicionados às suas fichas educativas.
            </p>
          </div>
        )}

        {/* Modal Header */}
        <div className="text-center mb-5">
          <span className="text-4xl inline-block mb-1 float-anim">💰</span>
          <h2 className="font-casino text-3xl neon-gold text-amber-400 tracking-wider">
            DEPÓSITO FICTÍCIO EDUCATIVO
          </h2>
          <p className="text-xs text-amber-400/90 font-display mt-1">
            Adicione fichas de teste para vivenciar na prática a matemática das apostas
          </p>
        </div>

        {!showImpactAlert ? (
          <div className="space-y-5">
            {/* Escolha do Método Fictício */}
            <div>
              <label className="block text-xs font-display text-amber-400 uppercase tracking-wider mb-2 font-bold">
                Forma de Pagamento Fictícia
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "pix", label: "⚡ PIX Instantâneo", desc: "Direto da conta" },
                  { id: "cartao", label: "💳 Cartão de Crédito", desc: "Juros 440% a.a." },
                  { id: "emprestimo", label: "🏦 Empréstimo", desc: "Agiota / Banco" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      method === m.id
                        ? "border-amber-400 bg-amber-900/60 text-amber-200 font-bold shadow-lg scale-102"
                        : "border-neutral-700 bg-neutral-800/90 text-neutral-300 hover:border-amber-600"
                    }`}
                  >
                    <span className="text-xs font-display font-semibold">{m.label}</span>
                    <span className="text-[9px] text-amber-400/80 font-mono mt-0.5">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Valores Pré-definidos */}
            <div>
              <label className="block text-xs font-display text-amber-400 uppercase tracking-wider mb-2 font-bold">
                Selecione o Valor Fictício (R$)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[50, 100, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-3 px-3 rounded-xl border font-display text-sm font-bold transition-all text-center ${
                      amount === val
                        ? "border-amber-400 bg-amber-800/80 text-amber-100 shadow-md scale-102 ring-2 ring-amber-400/50"
                        : "border-neutral-700 bg-neutral-800 text-neutral-200 hover:border-amber-500 hover:bg-neutral-700"
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Input de Valor Personalizado */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-display text-amber-400 uppercase tracking-wider font-bold">
                  Ou Digite o Valor Desejado
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">Min: R$10 · Max: R$10.000</span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-3 text-amber-400 font-casino text-lg">R$</span>
                <input
                  type="number"
                  min={10}
                  max={10000}
                  value={amount}
                  onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-700 text-amber-200 font-casino text-xl focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Equivalência da Vida Real */}
            <div className="bg-neutral-950/90 border border-amber-600/40 p-3.5 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-display text-amber-400 font-bold uppercase tracking-wider">
                <span>{equivalencia.emoji}</span>
                <span>Equivalência na Vida Real</span>
              </div>
              <p className="text-xs font-display text-neutral-200 font-semibold">
                R$ {amount.toLocaleString("pt-BR")},00 equivale a:{" "}
                <strong className="text-amber-300">{equivalencia.item}</strong>
              </p>
              <p className="text-[11px] text-neutral-400 font-display italic">
                {equivalencia.descricao}
              </p>
            </div>

            {/* Botão de Depósito */}
            <button
              type="button"
              onClick={() => handleStartDeposit(amount)}
              className="btn-gold w-full py-3.5 rounded-xl text-xs tracking-widest uppercase font-bold shadow-xl flex items-center justify-center gap-2"
            >
              <span>💰</span>
              <span>Continuar Depósito (R$ {amount.toLocaleString("pt-BR")},00)</span>
            </button>
          </div>
        ) : (
          /* Alerta Pedagógico de Impacto Real */
          <div className="space-y-4 text-center">
            <div className="inline-block p-3 rounded-full bg-red-950 border border-red-700 text-red-400 animate-pulse text-2xl">
              ⚠️
            </div>

            <h3 className="font-casino text-2xl text-red-500 neon-red tracking-wider">
              ALERTA PEDAGÓGICO DE IMPACTO REAL
            </h3>

            {/* Informações da Equivalência */}
            <div className="bg-red-950/60 border border-red-800 p-3 rounded-xl text-left text-xs text-red-200 font-display space-y-1">
              <div className="font-bold text-red-400 uppercase tracking-wider text-[11px]">
                ⚠️ O Custo Real Deste Depósito (R$ {amount},00):
              </div>
              <p>
                Na vida real, este valor equivale a <strong>{equivalencia.item}</strong>. Na casa de aposta, 98% dos apostadores perdem essa quantia de forma irreversível em poucos minutos.
              </p>
            </div>

            {/* Depoimento Real */}
            <div className="bg-neutral-950 border border-red-900/80 p-4 rounded-xl text-left space-y-2">
              <div className="text-xs font-bold text-amber-400 font-display">
                {activeQuote?.autor}
              </div>
              <div className="text-[10px] text-red-400 uppercase tracking-widest font-display font-semibold">
                Caso: {activeQuote?.contexto}
              </div>
              <blockquote className="text-xs text-neutral-200 leading-relaxed italic border-l-2 border-red-600 pl-3 my-2 font-display">
                "{activeQuote?.depoimento}"
              </blockquote>
            </div>

            <div className="bg-amber-950/40 border border-amber-600/50 p-3 rounded-xl text-xs text-amber-200 font-display leading-relaxed text-left">
              💡 <strong>Conscientização:</strong> Este simulador serve para você testar a estatística e comprovar que no longo prazo a casa sempre ganha.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowImpactAlert(false)}
                className="btn-red flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeposit}
                className="btn-gold flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg"
              >
                Confirmar R$ {amount},00 Fictício ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
