import React from "react"

export type StakeType = "dinheiro" | "carro" | "casa" | "futuro" | "vida"

export interface StakeOption {
  id: StakeType
  label: string
  emoji: string
  descricao: string
  impacto: string
}

export const STAKE_OPTIONS: StakeOption[] = [
  {
    id: "dinheiro",
    label: "Dinheiro (R$)",
    emoji: "💵",
    descricao: "Saldo fictício de fichas",
    impacto: "Apostas convencionais de valor financeiro",
  },
  {
    id: "carro",
    label: "Carro da Família",
    emoji: "🚗",
    descricao: "Seu meio de transporte e conquista",
    impacto: "Relatos mostram milhares que venderam veículos para cobrir apostas",
  },
  {
    id: "casa",
    label: "Casa / Teto",
    emoji: "🏠",
    descricao: "Seu lar e abrigo de sua família",
    impacto: "Perder a moradia é a consequência extrema da escalada do vício",
  },
  {
    id: "futuro",
    label: "Economias do Futuro",
    emoji: "🎓",
    descricao: "Aposentadoria e faculdade dos filhos",
    impacto: "Destruição de projetos de vida construídos por décadas",
  },
  {
    id: "vida",
    label: "Saúde Mental & Vida",
    emoji: "💔",
    descricao: "Paz de espírito, família e dignidade",
    impacto: "O vício consome a saúde psíquica e destrói laços afetivos",
  },
]

interface StakeSelectorProps {
  selectedStake: StakeType
  onSelectStake: (stake: StakeType) => void
}

export default function StakeSelector({ selectedStake, onSelectStake }: StakeSelectorProps) {
  const currentOption = STAKE_OPTIONS.find((s) => s.id === selectedStake) || STAKE_OPTIONS[0]

  return (
    <div className="bg-gray-950/80 border border-yellow-800/40 p-3.5 rounded-xl space-y-2 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-display text-yellow-600 uppercase tracking-widest font-semibold">
          O que você está colocando em jogo?
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 font-display">
          {currentOption.emoji} {currentOption.label}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
        {STAKE_OPTIONS.map((opt) => {
          const isSelected = selectedStake === opt.id
          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => onSelectStake(opt.id)}
              className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                isSelected
                  ? "border-yellow-400 bg-yellow-900/40 text-yellow-300 scale-105 shadow-md"
                  : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-yellow-700"
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className="text-[10px] font-display font-semibold mt-0.5 truncate w-full">
                {opt.label.split(" ")[0]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="text-[10px] text-yellow-700 italic font-display pt-1 border-t border-gray-900">
        ⚠️ <strong>Alerta:</strong> {currentOption.impacto}
      </div>
    </div>
  )
}
