import { useState, useEffect, useRef } from "react"

import { OnlineRoomProvider } from "@/lib/online-room"
import OnlineGames from "@/components/OnlineGames"
import AuthModal from "@/components/AuthModal"
import DepositModal from "@/components/DepositModal"
import StakeSelector, { StakeType } from "@/components/StakeSelector"
import WinImpactModal from "@/components/WinImpactModal"
import { obterUsuarioAtual, logoutUsuario, UserAuth, salvarUsuarioLocal } from "@/lib/auth"
import {
  startNewHand,
  processPlayerAction,
  getValidActions,
  getBotAction,
  cardDisplay,
  PokerState,
  ActionType,
} from "@/lib/poker-engine"

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = "jogos" | "conta" | "perfil" | "ranking" | "extrato"
interface Testimonial {
  id: number
  nome: string
  cidade: string
  avatar: string
  depoimento: string
  perdido: number
  ganho: number
  tempo: string
  posicaoRanking: number
}
interface GameInfo {
  id: string
  nome: string
  emoji: string
  descricao: string
  vantagemCasa: number
  jogadores: number
  jackpot?: number
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    nome: "Carlos M.",
    cidade: "São Paulo, SP",
    avatar: "CM",
    depoimento:
      "Joguei por 3 meses e só perdi R$847. Meus amigos perderam muito mais. Pelo menos fui o que MENOS perdeu no grupo!",
    perdido: 847,
    ganho: 312,
    tempo: "3 meses",
    posicaoRanking: 23,
  },
  {
    id: 2,
    nome: "Ana Paula R.",
    cidade: "Belo Horizonte, MG",
    avatar: "AP",
    depoimento:
      "Comecei com R$200 de bônus. No fim do mês tinha R$50. Mas minha vizinha perdeu R$2.000! Então tecnicamente 'ganhei', né?",
    perdido: 150,
    ganho: 0,
    tempo: "1 mês",
    posicaoRanking: 7,
  },
  {
    id: 3,
    nome: "Rafael S.",
    cidade: "Rio de Janeiro, RJ",
    avatar: "RS",
    depoimento:
      "Já gastei R$3.400 em 6 meses. Meu colega perdeu R$12.000. Comparando, eu sou o campeão aqui.",
    perdido: 3400,
    ganho: 890,
    tempo: "6 meses",
    posicaoRanking: 156,
  },
  {
    id: 4,
    nome: "Fernanda L.",
    cidade: "Curitiba, PR",
    avatar: "FL",
    depoimento:
      "A plataforma é viciante demais. Fiquei 8 horas jogando e perdi R$600. Mas foi a melhor noite da semana… isso é um problema.",
    perdido: 600,
    ganho: 120,
    tempo: "2 semanas",
    posicaoRanking: 41,
  },
  {
    id: 5,
    nome: "Marcos T.",
    cidade: "Fortaleza, CE",
    avatar: "MT",
    depoimento:
      "Perdi R$1.200 mas recuperei R$400 no poker. Ainda no vermelho, mas pelo menos não perdi tudo de uma vez.",
    perdido: 1200,
    ganho: 400,
    tempo: "4 meses",
    posicaoRanking: 89,
  },
  {
    id: 6,
    nome: "Juliana W.",
    cidade: "Porto Alegre, RS",
    avatar: "JW",
    depoimento:
      "Meu marido perdeu o emprego apostando. Eu perdi apenas R$450. Estou vencendo? Não. Mas perdi menos. Isso é triste.",
    perdido: 450,
    ganho: 80,
    tempo: "2 meses",
    posicaoRanking: 14,
  },
]

const GAMES: GameInfo[] = [
  {
    id: "caca-niquel",
    nome: "Caça Níquel",
    emoji: "🎰",
    descricao:
      "Gire os rolos e torça pela sorte — mas a sorte raramente aparece.",
    vantagemCasa: 15,
    jogadores: 1247,
    jackpot: 48200,
  },
  {
    id: "jogo-bicho",
    nome: "Jogo do Bicho",
    emoji: "🐯",
    descricao: "O clássico brasileiro. Aposte no bicho, perca no sistema.",
    vantagemCasa: 20,
    jogadores: 892,
  },
  {
    id: "dados",
    nome: "Dados",
    emoji: "🎲",
    descricao: "Jogue os dados. A probabilidade nunca está ao seu favor.",
    vantagemCasa: 1.4,
    jogadores: 431,
  },
  {
    id: "roleta",
    nome: "Roleta",
    emoji: "🎡",
    descricao: "33 números e um zero verde. Esse zero é o lucro da casa.",
    vantagemCasa: 2.7,
    jogadores: 678,
  },
  {
    id: "blackjack",
    nome: "Blackjack",
    emoji: "🃏",
    descricao:
      "21 é o objetivo. A casa sempre joga por último — e sempre vence.",
    vantagemCasa: 0.5,
    jogadores: 334,
  },
  {
    id: "poker",
    nome: "Pôquer",
    emoji: "♠️",
    descricao: "Habilidade conta, mas a rake da mesa garante o lucro da casa.",
    vantagemCasa: 5,
    jogadores: 219,
  },
]

const RANKING = [
  { pos: 1, nome: "BrunoF_SP", perdido: 120, ganho: 95, saldo: -25 },
  { pos: 2, nome: "Mari_RJ", perdido: 240, ganho: 190, saldo: -50 },
  { pos: 3, nome: "Pedro.BH", perdido: 80, ganho: 30, saldo: -50 },
  { pos: 4, nome: "Carla_CE", perdido: 350, ganho: 290, saldo: -60 },
  { pos: 5, nome: "Lucas_PR", perdido: 500, ganho: 430, saldo: -70 },
  { pos: 6, nome: "Ana_RS", perdido: 150, ganho: 70, saldo: -80 },
  { pos: 7, nome: "Você", perdido: 450, ganho: 300, saldo: -150 },
  { pos: 8, nome: "Tiago_MG", perdido: 900, ganho: 730, saldo: -170 },
]

const EXTRATO = [
  {
    data: "15/09/2026 22:41",
    jogo: "Caça Níquel",
    apostado: 50,
    resultado: -50,
    tipo: "derrota",
  },
  {
    data: "15/09/2026 21:15",
    jogo: "Roleta",
    apostado: 100,
    resultado: 180,
    tipo: "vitoria",
  },
  {
    data: "15/09/2026 20:03",
    jogo: "Blackjack",
    apostado: 75,
    resultado: -75,
    tipo: "derrota",
  },
  {
    data: "14/09/2026 23:55",
    jogo: "Pôquer",
    apostado: 200,
    resultado: -200,
    tipo: "derrota",
  },
  {
    data: "14/09/2026 22:10",
    jogo: "Dados",
    apostado: 30,
    resultado: 55,
    tipo: "vitoria",
  },
  {
    data: "14/09/2026 20:45",
    jogo: "Jogo do Bicho",
    apostado: 120,
    resultado: -120,
    tipo: "derrota",
  },
  {
    data: "13/09/2026 21:30",
    jogo: "Caça Níquel",
    apostado: 80,
    resultado: -80,
    tipo: "derrota",
  },
]

// ─── Animated game previews ────────────────────────────────────────────────────

function SlotAnimation() {
  const SYMBOLS = ["🍒", "💎", "🎰", "⭐", "🔔", "🍋", "🍊", "7️⃣"]
  const [spinning, setSpinning] = useState(false)
  const [reels, setReels] = useState(["🎰", "🎰", "🎰"])
  const [won, setWon] = useState(false)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setWon(false)
    setTimeout(() => {
      const r = [0, 1, 2].map(
        () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      )
      setReels(r)
      setSpinning(false)
      setWon(r[0] === r[1] && r[1] === r[2])
    }, 2200)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* machine body */}
      <div
        className={`relative rounded-xl p-1 ${won ? "gold-glow-anim" : ""}`}
        style={{
          background: "linear-gradient(145deg,#7c5200,#d4a017,#7c5200)",
          padding: "3px",
        }}
      >
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#0a0300" }}
        >
          {/* top light bar */}
          <div className="flex gap-1 px-3 py-1.5 justify-center">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: spinning ? `hsl(${i * 50},100%,60%)` : "#2a1000",
                  boxShadow: spinning
                    ? `0 0 8px hsl(${i * 50},100%,60%)`
                    : "none",
                  animation: spinning
                    ? `sparkle ${0.3 + i * 0.1}s ease-in-out infinite alternate`
                    : "none",
                }}
              />
            ))}
          </div>
          {/* reels */}
          <div className="flex gap-2 px-4 pb-3">
            {reels.map((sym, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden relative"
                style={{ background: "#0f0500", border: "2px solid #3a1800" }}
              >
                <div
                  className={spinning ? `slot-reel spinning${i + 1}` : ""}
                  style={{
                    fontSize: "1.8rem",
                    lineHeight: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {spinning ? (
                    SYMBOLS.map((s, j) => (
                      <div
                        key={j}
                        style={{
                          height: "3.5rem",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {s}
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        height: "3.5rem",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {sym}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* win message */}
          {won && (
            <div className="text-center pb-2 font-casino text-xl neon-gold text-yellow-400 winner-flash">
              🎉 JACKPOT!
            </div>
          )}
          {/* lever / button */}
          <div className="px-4 pb-3">
            <button
              onClick={spin}
              disabled={spinning}
              className="btn-gold w-full py-2 rounded-lg text-sm tracking-widest uppercase disabled:opacity-60"
            >
              {spinning ? "Girando..." : "🎰 Girar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiceAnimation() {
  const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]
  const [rolling, setRolling] = useState(false)
  const [dice, setDice] = useState([2, 4])
  const [total, setTotal] = useState(7)
  const [result, setResult] = useState<"win" | "loss" | null>(null)

  const roll = () => {
    if (rolling) return
    setRolling(true)
    setResult(null)
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6)
      const d2 = Math.floor(Math.random() * 6)
      const t = d1 + d2 + 2
      setDice([d1, d2])
      setTotal(t)
      setResult(t === 7 || t === 11 ? "win" : "loss")
      setRolling(false)
    }, 1300)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-4 justify-center">
        {dice.map((d, i) => (
          <div
            key={i}
            className={`text-5xl select-none cursor-pointer ${
              rolling ? "dice-rolling" : "float-anim"
            }`}
            style={{
              animationDelay: rolling ? `${i * 0.15}s` : `${i * 0.8}s`,
              filter:
                result === "win"
                  ? "drop-shadow(0 0 12px #ffd700)"
                  : result === "loss"
                    ? "drop-shadow(0 0 12px #cc0000)"
                    : "none",
            }}
          >
            {FACES[d]}
          </div>
        ))}
      </div>
      <div
        className={`font-casino text-2xl ${
          result === "win"
            ? "neon-gold text-yellow-400"
            : result === "loss"
              ? "neon-red text-red-400"
              : "text-yellow-700"
        }`}
      >
        {result === "win"
          ? `SOMA ${total} — GANHOU! 🎉`
          : result === "loss"
            ? `SOMA ${total} — PERDEU`
            : `Soma: ${total}`}
      </div>
      <button
        onClick={roll}
        disabled={rolling}
        className="btn-red px-6 py-2 rounded-lg text-sm tracking-widest uppercase disabled:opacity-60"
      >
        {rolling ? "Rolando..." : "🎲 Jogar Dados"}
      </button>
    </div>
  )
}

function RouletteAnimation() {
  const NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
    24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
  ]
  const RED = [
    1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
  ]
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [angle, setAngle] = useState(0)
  const [betColor, setBetColor] = useState<"red" | "black" | null>(null)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setResult(null)
    let a = angle
    let speed = 20
    animRef.current = setInterval(() => {
      a += speed
      setAngle(a % 360)
    }, 16)
    setTimeout(() => {
      clearInterval(animRef.current!)
      const num = NUMBERS[Math.floor(Math.random() * NUMBERS.length)]
      setResult(num)
      setAngle(a % 360)
      setSpinning(false)
    }, 3000)
  }

  const isRed = (n: number) => RED.includes(n)
  const won =
    result !== null &&
    betColor !== null &&
    result !== 0 &&
    (betColor === "red" ? isRed(result) : !isRed(result))

  return (
    <div className="flex flex-col items-center gap-3">
      {/* wheel */}
      <div className="relative w-32 h-32">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: spinning ? "none" : "transform 0.3s ease",
          }}
        >
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="#0a0300"
            stroke="#d4a017"
            strokeWidth="2"
          />
          {NUMBERS.map((n, i) => {
            const a1 = (i / 37) * 360 - 90
            const a2 = ((i + 1) / 37) * 360 - 90
            const r1 = 42,
              r2 = 20
            const x1 = 50 + r1 * Math.cos((a1 * Math.PI) / 180),
              y1 = 50 + r1 * Math.sin((a1 * Math.PI) / 180)
            const x2 = 50 + r1 * Math.cos((a2 * Math.PI) / 180),
              y2 = 50 + r1 * Math.sin((a2 * Math.PI) / 180)
            const x3 = 50 + r2 * Math.cos((a2 * Math.PI) / 180),
              y3 = 50 + r2 * Math.sin((a2 * Math.PI) / 180)
            const x4 = 50 + r2 * Math.cos((a1 * Math.PI) / 180),
              y4 = 50 + r2 * Math.sin((a1 * Math.PI) / 180)
            const color = n === 0 ? "#22c55e" : isRed(n) ? "#cc0000" : "#111"
            return (
              <path
                key={i}
                d={`M${x1},${y1} A${r1},${r1} 0 0,1 ${x2},${y2} L${x3},${y3} A${r2},${r2} 0 0,0 ${x4},${y4}Z`}
                fill={color}
                stroke="#d4a01740"
                strokeWidth="0.5"
              />
            )
          })}
          <circle
            cx="50"
            cy="50"
            r="18"
            fill="#0a0300"
            stroke="#d4a017"
            strokeWidth="1.5"
          />
          <text
            x="50"
            y="54"
            textAnchor="middle"
            fontSize="7"
            fill="#d4a017"
            fontFamily="Bebas Neue"
          >
            TIGRINHO
          </text>
        </svg>
        {/* ball indicator */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-lg"
          style={{
            boxShadow: "0 0 6px #fff, 0 0 12px #fff8",
            marginTop: "-2px",
          }}
        />
      </div>

      {result !== null && (
        <div
          className={`font-casino text-3xl ${
            result === 0
              ? "text-green-400 neon-gold"
              : isRed(result)
                ? "text-red-400 neon-red"
                : "text-gray-300"
          }`}
        >
          {result === 0 ? "0 — Casa vence!" : result}{" "}
          {won ? "🎉 GANHOU!" : betColor ? "PERDEU" : ""}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setBetColor("red")}
          className={`px-4 py-1.5 rounded-lg font-display text-sm tracking-wide border-2 transition-all ${
            betColor === "red"
              ? "border-yellow-400 bg-red-800 text-yellow-400"
              : "border-red-800 bg-red-950 text-red-400"
          }`}
        >
          🔴 Vermelho
        </button>
        <button
          onClick={() => setBetColor("black")}
          className={`px-4 py-1.5 rounded-lg font-display text-sm tracking-wide border-2 transition-all ${
            betColor === "black"
              ? "border-yellow-400 bg-gray-800 text-yellow-400"
              : "border-gray-800 bg-gray-950 text-gray-400"
          }`}
        >
          ⚫ Preto
        </button>
      </div>
      <button
        onClick={spin}
        disabled={spinning}
        className="btn-gold px-8 py-2 rounded-lg text-sm tracking-widest uppercase disabled:opacity-60"
      >
        {spinning ? "Girando..." : "🎡 Girar Roleta"}
      </button>
    </div>
  )
}

function BlackjackAnimation() {
  type Card = { suit: string; val: string; num: number }
  const SUITS = ["♠", "♥", "♦", "♣"]
  const VALUES = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ]
  const NUMS = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10]

  const makeCard = (): Card => {
    const i = Math.floor(Math.random() * 13)
    return {
      suit: SUITS[Math.floor(Math.random() * 4)],
      val: VALUES[i],
      num: NUMS[i],
    }
  }

  const calcTotal = (cards: Card[]) => {
    let t = cards.reduce((s, c) => s + c.num, 0)
    let aces = cards.filter((c) => c.val === "A").length
    while (t > 21 && aces-- > 0) t -= 10
    return t
  }

  const [playerCards, setPlayerCards] = useState<Card[]>([
    makeCard(),
    makeCard(),
  ])
  const [dealerCards, setDealerCards] = useState<Card[]>([
    makeCard(),
    makeCard(),
  ])
  const [hidden, setHidden] = useState(true)
  const [phase, setPhase] = useState<"bet" | "play" | "result">("bet")
  const [flipAnim, setFlipAnim] = useState(false)

  const deal = () => {
    setPlayerCards([makeCard(), makeCard()])
    setDealerCards([makeCard(), makeCard()])
    setHidden(true)
    setPhase("play")
    setFlipAnim(false)
  }
  const hit = () => setPlayerCards((p) => [...p, makeCard()])
  const stand = () => {
    setFlipAnim(true)
    setTimeout(() => {
      setHidden(false)
      setPhase("result")
    }, 500)
  }

  const playerTotal = calcTotal(playerCards)
  const dealerTotal = calcTotal(dealerCards)
  const bustPlayer = playerTotal > 21
  const playerWon =
    !bustPlayer &&
    phase === "result" &&
    (playerTotal > dealerTotal || dealerTotal > 21)

  const isRed = (s: string) => s === "♥" || s === "♦"

  const CardComp = ({
    card,
    delay = 0,
    faceDown = false,
  }: {
    card: Card
    delay?: number
    faceDown?: boolean
  }) => (
    <div
      className={`card-deal w-10 h-14 rounded-lg flex flex-col items-center justify-center text-sm font-bold border-2 select-none ${
        faceDown ? "bg-red-900 border-red-700" : "bg-white border-gray-200"
      }`}
      style={{
        animationDelay: `${delay}s`,
        color: faceDown ? "transparent" : isRed(card.suit) ? "#cc0000" : "#111",
        boxShadow: faceDown ? "none" : "0 2px 8px rgba(0,0,0,0.5)",
      }}
    >
      {faceDown ? (
        <div className="text-red-500 text-xs">🂠</div>
      ) : (
        <>
          <div className="text-xs leading-none">{card.val}</div>
          <div className="text-base leading-none">{card.suit}</div>
        </>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-2 items-center">
      {/* dealer */}
      <div className="text-xs text-yellow-700 font-display tracking-widest uppercase">
        Mesa — {hidden ? "?" : dealerTotal}
      </div>
      <div className="flex gap-2 justify-center">
        {dealerCards.map((c, i) => (
          <CardComp
            key={i}
            card={c}
            delay={i * 0.15}
            faceDown={i === 1 && hidden}
          />
        ))}
      </div>
      {/* player */}
      <div className="text-xs text-yellow-700 font-display tracking-widest uppercase mt-1">
        Você — {playerTotal}
        {bustPlayer ? " (BUST!)" : ""}
      </div>
      <div className="flex gap-2 justify-center flex-wrap">
        {playerCards.map((c, i) => (
          <CardComp key={i} card={c} delay={i * 0.15} />
        ))}
      </div>
      {phase === "result" && (
        <div
          className={`font-casino text-2xl ${
            playerWon ? "neon-gold text-yellow-400" : "neon-red text-red-400"
          }`}
        >
          {bustPlayer
            ? "BUST — PERDEU!"
            : playerWon
              ? "🎉 GANHOU!"
              : "CASA VENCE!"}
        </div>
      )}
      <div className="flex gap-2 mt-1">
        {phase === "play" && !bustPlayer ? (
          <>
            <button
              onClick={hit}
              className="btn-gold px-4 py-2 rounded-lg text-xs tracking-widest uppercase"
            >
              Pedir Carta
            </button>
            <button
              onClick={stand}
              className="btn-red  px-4 py-2 rounded-lg text-xs tracking-widest uppercase"
            >
              Parar
            </button>
          </>
        ) : (
          <button
            onClick={deal}
            className="btn-gold px-6 py-2 rounded-lg text-xs tracking-widest uppercase"
          >
            Nova Partida
          </button>
        )}
      </div>
    </div>
  )
}

function PokerAnimation() {
  const initialPlayers = [
    { id: "user", name: "Você", chips: 1000, isBot: false },
    { id: "bot1", name: "Bot Carlos", chips: 1000, isBot: true },
    { id: "bot2", name: "Bot Daniel", chips: 1000, isBot: true },
  ]

  const [gameState, setGameState] = useState<PokerState>(() =>
    startNewHand({
      players: initialPlayers,
      smallBlindAmount: 10,
      bigBlindAmount: 20,
    }),
  )

  const [raiseSlider, setRaiseSlider] = useState<number>(40)
  const [isProcessingBot, setIsProcessingBot] = useState(false)

  const userIndex = gameState.players.findIndex((p) => p.id === "user")
  const userPlayer = gameState.players[userIndex]
  const isUserTurn =
    !gameState.isHandComplete && gameState.currentTurnIndex === userIndex

  const validActions = getValidActions(gameState, "user")

  // Update slider default when user turn changes
  useEffect(() => {
    if (isUserTurn) {
      if (validActions.canRaise) {
        setRaiseSlider(validActions.minRaiseTo)
      } else if (validActions.canBet) {
        setRaiseSlider(validActions.minBet)
      }
    }
  }, [isUserTurn, validActions.minRaiseTo, validActions.minBet, validActions.canRaise, validActions.canBet])

  // Process bot turns automatically with a small delay
  useEffect(() => {
    if (gameState.isHandComplete) return

    const currentP = gameState.players[gameState.currentTurnIndex]
    if (currentP && currentP.isBot && !currentP.folded && !currentP.isAllIn) {
      setIsProcessingBot(true)
      const timer = setTimeout(() => {
        try {
          const botDecision = getBotAction(gameState, currentP.id)
          setGameState((prev) =>
            processPlayerAction(
              prev,
              currentP.id,
              botDecision.action,
              botDecision.amount,
            ),
          )
        } catch {
          // Fallback fold if error
          setGameState((prev) =>
            processPlayerAction(prev, currentP.id, "fold"),
          )
        } finally {
          setIsProcessingBot(false)
        }
      }, 900)
      return () => clearTimeout(timer)
    }
  }, [gameState])

  const handleUserAction = (action: ActionType, amount?: number) => {
    try {
      const next = processPlayerAction(gameState, "user", action, amount)
      setGameState(next)
    } catch (e: any) {
      alert(e.message || "Ação inválida")
    }
  }

  const handleNextHand = () => {
    const nextPlayers = gameState.players.map((p) => ({
      id: p.id,
      name: p.name,
      chips: p.chips <= 0 ? 1000 : p.chips, // Re-buy if busted
      isBot: p.isBot,
    }))
    setGameState(
      startNewHand(
        {
          players: nextPlayers,
          smallBlindAmount: 10,
          bigBlindAmount: 20,
        },
        gameState,
      ),
    )
  }

  const renderCardVisual = (c: string, hidden = false) => {
    if (hidden || !c) {
      return (
        <div className="w-10 h-14 rounded-lg border-2 border-red-800 bg-red-950 flex items-center justify-center shadow-md">
          <span className="text-red-700 text-xs">🂠</span>
        </div>
      )
    }
    const { rank, suit, color } = cardDisplay(c)
    return (
      <div
        className="w-10 h-14 rounded-lg border-2 border-gray-300 bg-white flex flex-col items-center justify-center shadow-md select-none card-deal"
        style={{ color }}
      >
        <div className="text-xs leading-none font-bold">{rank}</div>
        <div className="text-base leading-none">{suit}</div>
      </div>
    )
  }

  const roundNameMap: Record<string, string> = {
    PRE_FLOP: "Pré-Flop",
    FLOP: "Flop",
    TURN: "Turn",
    RIVER: "River",
    SHOWDOWN: "Showdown",
  }

  const totalPot = gameState.pots.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto text-left">
      {/* Table Header: Round & Pots */}
      <div className="bg-yellow-950/40 border border-yellow-700/40 p-3 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-display text-yellow-600 uppercase tracking-widest block">
            Rodada Atual
          </span>
          <span className="font-casino text-lg text-yellow-400">
            {roundNameMap[gameState.round] || gameState.round}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-display text-yellow-600 uppercase tracking-widest block">
            Pote Total
          </span>
          <span className="font-casino text-xl text-yellow-300 neon-gold">
            R${(totalPot / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Side Pots indicator if any */}
      {gameState.pots.length > 1 && (
        <div className="flex gap-2 flex-wrap justify-center text-xs">
          {gameState.pots.map((pot, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded bg-yellow-900/60 border border-yellow-600/40 text-yellow-200"
            >
              {pot.name}: R${(pot.amount / 100).toFixed(2)}
            </span>
          ))}
        </div>
      )}

      {/* Community Cards */}
      <div className="bg-emerald-950/60 border border-emerald-700/50 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-inner">
        <span className="text-xs text-emerald-400 font-display tracking-widest uppercase">
          Mesa (Cartas Comunitárias)
        </span>
        <div className="flex gap-2 justify-center min-h-[60px] items-center">
          {gameState.communityCards.length === 0 ? (
            <span className="text-xs text-emerald-700 italic">
              Aguardando o Flop...
            </span>
          ) : (
            gameState.communityCards.map((c, i) => (
              <div key={i}>{renderCardVisual(c)}</div>
            ))
          )}
        </div>
      </div>

      {/* Players Layout */}
      <div className="grid grid-cols-3 gap-2">
        {gameState.players.map((p, idx) => {
          const isTurn =
            !gameState.isHandComplete && gameState.currentTurnIndex === idx
          const isUser = p.id === "user"
          const showCards =
            isUser || gameState.round === "SHOWDOWN" || gameState.isHandComplete

          return (
            <div
              key={p.id}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                isTurn
                  ? "border-yellow-400 bg-yellow-900/30 shadow-[0_0_12px_rgba(234,179,8,0.3)]"
                  : p.folded
                    ? "border-red-900/30 bg-red-950/20 opacity-50"
                    : "border-gray-800 bg-gray-900/40"
              }`}
            >
              {/* Header: Name & Badges */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-xs font-semibold truncate ${
                      isUser ? "text-yellow-300 font-bold" : "text-gray-200"
                    }`}
                  >
                    {p.name}
                  </span>

                  <div className="flex gap-1">
                    {p.isDealer && (
                      <span className="w-4 h-4 rounded-full bg-yellow-500 text-black text-[10px] font-bold flex items-center justify-center shadow">
                        D
                      </span>
                    )}
                    {p.isSmallBlind && (
                      <span className="px-1 text-[9px] rounded bg-blue-900 text-blue-200 font-bold">
                        SB
                      </span>
                    )}
                    {p.isBigBlind && (
                      <span className="px-1 text-[9px] rounded bg-purple-900 text-purple-200 font-bold">
                        BB
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-yellow-500 font-display">
                  Fichas: R${(p.chips / 100).toFixed(2)}
                </div>

                {p.currentRoundContribution > 0 && (
                  <div className="text-[10px] text-gray-400">
                    Aposta: R${(p.currentRoundContribution / 100).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Cards */}
              <div className="flex gap-1 justify-center my-2">
                {p.holeCards.length === 2 ? (
                  <>
                    {renderCardVisual(p.holeCards[0], !showCards)}
                    {renderCardVisual(p.holeCards[1], !showCards)}
                  </>
                ) : (
                  <span className="text-[10px] text-gray-600">Sem cartas</span>
                )}
              </div>

              {/* Status footer */}
              <div className="text-center">
                {p.folded ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 font-bold">
                    FOLD
                  </span>
                ) : p.isAllIn ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-black font-bold animate-pulse">
                    ALL-IN
                  </span>
                ) : isTurn ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500 text-black font-bold">
                    SUA VEZ
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hand Complete Announcement */}
      {gameState.isHandComplete && (
        <div className="bg-yellow-900/40 border border-yellow-500 p-4 rounded-xl text-center space-y-3">
          <div className="font-casino text-lg text-yellow-300">
            Mão Finalizada!
          </div>
          <div className="text-xs text-yellow-100 font-display">
            {gameState.handWinnerMessage}
          </div>
          <button
            onClick={handleNextHand}
            className="btn-gold px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg"
          >
            Próxima Mão ♠
          </button>
        </div>
      )}

      {/* User Controls Panel */}
      {isUserTurn && !userPlayer?.folded && (
        <div className="bg-gray-900/80 border border-yellow-600/40 p-4 rounded-xl space-y-3 shadow-xl">
          <div className="text-xs text-yellow-400 font-display font-semibold uppercase tracking-wider text-center">
            Seu Turno — Escolha sua Ação
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            {/* Fold */}
            {validActions.canFold && (
              <button
                onClick={() => handleUserAction("fold")}
                className="btn-red px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex-1"
              >
                Desistir (Fold)
              </button>
            )}

            {/* Check */}
            {validActions.canCheck && (
              <button
                onClick={() => handleUserAction("check")}
                className="btn-gold px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex-1"
              >
                Passar (Check)
              </button>
            )}

            {/* Call */}
            {validActions.canCall && (
              <button
                onClick={() => handleUserAction("call")}
                className="btn-gold px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex-1"
              >
                Pagar (Call R${(validActions.callAmount / 100).toFixed(2)})
              </button>
            )}

            {/* All-In */}
            {validActions.canAllIn && (
              <button
                onClick={() => handleUserAction("all_in")}
                className="bg-amber-600 hover:bg-amber-500 text-black px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                All-In (R${(validActions.allInAmount / 100).toFixed(2)})
              </button>
            )}
          </div>

          {/* Bet / Raise slider controls */}
          {(validActions.canBet || validActions.canRaise) && (
            <div className="pt-2 border-t border-gray-800 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-300">
                <span>
                  {validActions.canRaise ? "Raise para:" : "Bet:"}{" "}
                  <strong className="text-yellow-400">
                    R${(raiseSlider / 100).toFixed(2)}
                  </strong>
                </span>
                <span className="text-[10px] text-gray-500">
                  Mín: R$
                  {(
                    (validActions.canRaise
                      ? validActions.minRaiseTo
                      : validActions.minBet) / 100
                  ).toFixed(2)}{" "}
                  | Máx: R$
                  {(
                    (validActions.canRaise
                      ? validActions.maxRaiseTo
                      : validActions.maxBet) / 100
                  ).toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min={
                  validActions.canRaise
                    ? validActions.minRaiseTo
                    : validActions.minBet
                }
                max={
                  validActions.canRaise
                    ? validActions.maxRaiseTo
                    : validActions.maxBet
                }
                step={10}
                value={raiseSlider}
                onChange={(e) => setRaiseSlider(Number(e.target.value))}
                className="w-full accent-yellow-500 bg-gray-800"
              />

              <button
                onClick={() =>
                  handleUserAction(
                    validActions.canRaise ? "raise" : "bet",
                    raiseSlider,
                  )
                }
                className="btn-gold w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Confirmar {validActions.canRaise ? "Raise" : "Bet"} (R$
                {(raiseSlider / 100).toFixed(2)})
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Feed History */}
      <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-xs space-y-1 max-h-32 overflow-y-auto">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-display">
          Histórico de Ações
        </div>
        {gameState.actionHistory.slice(-6).map((log, i) => (
          <div key={i} className="text-gray-300 flex justify-between text-[11px]">
            <span>
              <strong className="text-yellow-500">{log.playerName}</strong>:{" "}
              {log.action === "POST_SB" &&
                `postou Small Blind (R$${((log.amount || 0) / 100).toFixed(2)})`}
              {log.action === "POST_BB" &&
                `postou Big Blind (R$${((log.amount || 0) / 100).toFixed(2)})`}
              {log.action === "FOLD" && "deu Fold"}
              {log.action === "CHECK" && "deu Check"}
              {log.action === "CALL" &&
                `deu Call (R$${((log.amount || 0) / 100).toFixed(2)})`}
              {log.action === "BET" &&
                `apostou (Bet) R$${((log.amount || 0) / 100).toFixed(2)}`}
              {log.action === "RAISE" &&
                `aumentou (Raise) para R$${((log.amount || 0) / 100).toFixed(2)}`}
              {log.action === "ALL_IN" &&
                `entrou All-In (R$${((log.amount || 0) / 100).toFixed(2)})`}
            </span>
            <span className="text-[9px] text-gray-600">{log.round}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TigerAnimation() {
  const [roaring, setRoaring] = useState(false)
  const ANIMALS = [
    "🐯",
    "🦁",
    "🐻",
    "🦊",
    "🐺",
    "🦅",
    "🐍",
    "🐊",
    "🦈",
    "🦓",
    "🦒",
    "🐘",
    "🦀",
    "🦜",
    "🐮",
  ]
  const [chosen, setChosen] = useState<number | null>(null)
  const [result, setResult] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)

  const bet = (i: number) => {
    if (animating) return
    setChosen(i)
    setResult(null)
    setAnimating(true)
    setRoaring(true)
    setTimeout(() => {
      setResult(Math.floor(Math.random() * ANIMALS.length))
      setAnimating(false)
      setRoaring(false)
    }, 1500)
  }

  const won = result !== null && chosen === result

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`text-6xl select-none ${
          roaring ? "tiger-bounce" : "float-anim"
        }`}
        style={{ filter: won ? "drop-shadow(0 0 20px #ffd700)" : "none" }}
      >
        🐯
      </div>
      {result !== null && (
        <div className="text-center">
          <div className="text-3xl mb-1">{ANIMALS[result]}</div>
          <div
            className={`font-casino text-xl ${
              won ? "neon-gold text-yellow-400" : "neon-red text-red-400"
            }`}
          >
            {won ? "🎉 ACERTOU!" : "ERROU — TENTE NOVAMENTE"}
          </div>
        </div>
      )}
      <div className="text-xs text-yellow-700 font-display tracking-wide">
        Escolha um animal
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
        {ANIMALS.map((a, i) => (
          <button
            key={i}
            onClick={() => bet(i)}
            className={`text-xl p-1.5 rounded-lg transition-all border ${
              chosen === i
                ? "border-yellow-400 bg-yellow-900/40 scale-110"
                : "border-yellow-900/40 hover:border-yellow-700"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Floating gold coins bg ────────────────────────────────────────────────────

function GoldParticles() {
  const coins = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
    dur: `${3 + Math.random() * 4}s`,
    size: `${10 + Math.random() * 16}px`,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {coins.map((c) => (
        <div
          key={c.id}
          className="absolute text-yellow-500 select-none"
          style={{
            left: c.left,
            top: "-20px",
            fontSize: c.size,
            opacity: 0.15,
            animation: `coinFall ${c.dur} ${c.delay} linear infinite`,
          }}
        >
          💰
        </div>
      ))}
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function WarningBanner() {
  return (
    <div
      className="relative z-10 px-4 py-2 text-center text-xs font-display tracking-widest uppercase"
      style={{
        background: "linear-gradient(90deg,#1a0000,#2a0000,#1a0000)",
        borderBottom: "1px solid #5a0000",
      }}
    >
      <span className="text-red-400">⚠️ ALERTA EDUCATIVO:</span>
      <span className="text-yellow-300 ml-2">
        Esta plataforma simula casas de apostas para fins educativos. Apostas
        causam dependência e prejuízo financeiro.
      </span>
      <span className="text-red-400 ml-2 font-bold">
        A casa SEMPRE vence. Sempre.
      </span>
    </div>
  )
}

function LiveTicker() {
  const items = [
    "🔴 CARLOS perdeu R$200 no caça-níquel",
    "🔴 ANA perdeu R$450 na roleta",
    "🟡 PEDRO ganhou R$80 no blackjack — mas perdeu R$400 antes disso",
    "🔴 MARIANA perdeu R$1.200 no jogo do bicho",
    "🔴 ROBERTO perdeu R$600 nos dados",
    "🟡 JULIA ganhou R$150 — e apostou tudo de volta",
    "🔴 THIAGO perdeu mais R$320 tentando recuperar as perdas",
    "🔴 CAMILA perdeu R$800 em uma noite",
    "🟡 MARCOS ganhou R$90 — mas no total perdeu R$530",
  ]
  return (
    <div
      className="relative z-10 border-b border-yellow-900/40 py-1.5 ticker-wrap"
      style={{ background: "#0a0300" }}
    >
      <div className="ticker-text font-display text-xs tracking-wider text-yellow-600">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="mx-8">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function Sidebar({
  active,
  onNav,
}: {
  active: NavItem
  onNav: (n: NavItem) => void
}) {
  const items: { id: NavItem; label: string; icon: string; badge?: string }[] = [
    { id: "jogos", label: "Jogos", icon: "🎮", badge: "6" },
    { id: "conta", label: "Conta Bancária", icon: "🏦" },
    { id: "perfil", label: "Perfil", icon: "👤" },
    { id: "ranking", label: "Ranking", icon: "🏆", badge: "TOP" },
    { id: "extrato", label: "Extrato", icon: "📋" },
  ]
  return (
    <aside
      className="w-64 min-h-screen flex-shrink-0 relative z-10 flex flex-col"
      style={{
        background: "linear-gradient(180deg,#0a0300 0%,#060200 100%)",
        borderRight: "1px solid #2a1000",
      }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "#2a1000" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-3xl gold-glow-anim"
            style={{
              background: "linear-gradient(135deg,#7c5200,#ffd700,#d4a017)",
              flexShrink: 0,
            }}
          >
            🐯
          </div>
          <div>
            <div className="font-casino text-3xl leading-none neon-gold text-yellow-400 tracking-widest">
              TIGRINHO
            </div>
            <div className="font-display text-xs text-yellow-700 tracking-widest uppercase">
              BET EDUCATIVO
            </div>
          </div>
        </div>

        {/* Balance */}
        <div
          className="mt-4 p-3 rounded-xl border"
          style={{ background: "#0a0300", borderColor: "#2a1000" }}
        >
          <div className="text-xs text-yellow-800 font-display tracking-widest uppercase">
            Saldo Atual
          </div>
          <div className="text-2xl font-casino text-red-400 neon-red mt-0.5">
            -R$150,00
          </div>
          <div className="flex justify-between mt-2 text-xs font-display">
            <span className="text-yellow-800">Depositado</span>
            <span className="text-yellow-600">R$450,00</span>
          </div>
          <div className="flex justify-between text-xs font-display">
            <span className="text-yellow-800">Ganho</span>
            <span className="text-green-600">R$300,00</span>
          </div>
          {/* mini bar */}
          <div
            className="mt-2 h-1.5 rounded-full overflow-hidden"
            style={{ background: "#1a0800" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: "66%",
                background: "linear-gradient(90deg,#cc0000,#d4a017)",
              }}
            />
          </div>
          <div className="text-xs text-red-600 font-display mt-1">
            Recuperou 66% do que perdeu
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="p-3 flex-1 space-y-1 mt-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`sidebar-item w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left ${
              active === item.id ? "active" : ""
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span
              className={`font-display tracking-wide text-sm flex-1 ${
                active === item.id ? "text-yellow-300" : "text-yellow-700"
              }`}
            >
              {item.label}
            </span>
            {item.badge && (
              <span
                className="text-xs px-1.5 py-0.5 rounded font-casino"
                style={{
                  background: "#3a1000",
                  color: "#d4a017",
                  border: "1px solid #5a2000",
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Alert */}
      <div
        className="mx-3 mb-3 p-3 rounded-xl border border-red-900/40 red-glow-anim"
        style={{ background: "#0f0000" }}
      >
        <div className="text-xs text-red-400 font-display leading-relaxed">
          ⚠️ Nesta sessão você já perdeu{" "}
          <strong className="text-red-300">R$150,00</strong>.<br />A casa lucrou
          esse valor com você.
        </div>
      </div>
      <div className="px-4 pb-4 text-center">
        <div className="text-xs text-yellow-900 font-display">
          CVV: <span className="text-yellow-700">188</span>
        </div>
      </div>
    </aside>
  )
}

function HouseEdgeBar({ edge }: { edge: number }) {
  const pct = Math.min(edge * 5, 100)
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-yellow-800 font-display tracking-wider uppercase">
          Vantagem da Casa
        </span>
        <span className="text-red-400 font-display font-bold">{edge}%</span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "#1a0800" }}
      >
        <div
          className="h-full rounded-full house-edge-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Game Modal with animation ─────────────────────────────────────────────────

const GAME_ANIMATIONS: Record<string, React.FC> = {
  "caca-niquel": SlotAnimation,
  "jogo-bicho": TigerAnimation,
  dados: DiceAnimation,
  roleta: RouletteAnimation,
  blackjack: BlackjackAnimation,
  poker: PokerAnimation,
}

const ONLINE_GAMES = new Set(["jogo-bicho", "blackjack", "poker"])
const GAME_TO_ONLINE: Record<string, "bicho" | "blackjack" | "poker"> = {
  "jogo-bicho": "bicho",
  blackjack: "blackjack",
  poker: "poker",
}

function GameModal({ game, onClose }: { game: GameInfo; onClose: () => void }) {
  const Animation = GAME_ANIMATIONS[game.id]
  const [modo, setModo] = useState<"local" | "online">("local")
  const [selectedStake, setSelectedStake] = useState<StakeType>("dinheiro")
  const isOnline = ONLINE_GAMES.has(game.id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.9)" }}
      onClick={onClose}
    >
      <div
        className="game-card rounded-2xl p-6 max-w-lg w-full gold-border-anim"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-casino text-3xl neon-gold text-yellow-400 tracking-wider">
              {game.nome}
            </h2>
            <p className="text-yellow-800 text-xs font-display mt-0.5">
              {game.descricao}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-yellow-700 hover:text-yellow-400 text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stake Selector (O que está em jogo) */}
        <div className="mb-4">
          <StakeSelector
            selectedStake={selectedStake}
            onSelectStake={setSelectedStake}
          />
        </div>

        {isOnline && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setModo("local")}
              className={`flex-1 py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all font-display ${
                modo === "local"
                  ? "btn-gold"
                  : "border border-gray-800 text-yellow-800 hover:text-yellow-500"
              }`}
            >
              Local
            </button>
            <button
              onClick={() => setModo("online")}
              className={`flex-1 py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all font-display ${
                modo === "online"
                  ? "btn-green"
                  : "border border-gray-800 text-yellow-800 hover:text-yellow-500"
              }`}
            >
              🌐 Online por Turnos
            </button>
          </div>
        )}

        {modo === "online" && isOnline ? (
          <OnlineRoomProvider key={game.id}>
            <OnlineGames jogo={GAME_TO_ONLINE[game.id]} />
          </OnlineRoomProvider>
        ) : (
          <>
            {/* animation */}
            <div
              className="rounded-xl p-5 mb-5"
              style={{ background: "#080200", border: "1px solid #2a1000" }}
            >
              {Animation && <Animation />}
            </div>

            {/* house edge */}
            <div
              className="p-4 rounded-xl mb-4"
              style={{ background: "#0f0000", border: "1px solid #5a0000" }}
            >
              <div className="text-center">
                <div className="text-xs text-red-500 font-display tracking-widest uppercase">
                  Vantagem da Casa
                </div>
                <div className="font-casino text-5xl text-red-400 neon-red my-1">
                  {game.vantagemCasa}%
                </div>
                <div className="text-xs text-yellow-800 font-display">
                  A cada R$100 apostados, a casa retém R$
                  {game.vantagemCasa.toFixed(2)} em média.
                </div>
              </div>
              <HouseEdgeBar edge={game.vantagemCasa} />
            </div>

            <div className="text-center text-xs text-yellow-800 font-display mb-3">
              Conecte sua lógica de backend aqui. O design e animações estão
              prontos.
            </div>

            <button
              onClick={onClose}
              className="btn-gold w-full py-3 rounded-xl text-sm tracking-widest uppercase"
            >
              Fechar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Games Panel ──────────────────────────────────────────────────────────────

function GamesPanel({ onPlay }: { onPlay: (g: GameInfo) => void }) {
  return (
    <div>
      <div className="mb-8">
        <h2 className="font-casino text-5xl gold-shimmer leading-none">
          ESCOLHA SEU JOGO
        </h2>
        <p className="text-yellow-800 text-sm font-display tracking-wide mt-2">
          Todos os jogos têm vantagem para a casa. Escolha o que te prejudica
          menos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {GAMES.map((game) => (
          <div key={game.id} className="game-card rounded-2xl p-5">
            {/* icon + live */}
            <div className="flex items-start justify-between mb-4">
              <div
                className="text-5xl float-anim"
                style={{ animationDelay: `${Math.random() * 2}s` }}
              >
                {game.emoji}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400 font-display tracking-wider uppercase">
                    Ao Vivo
                  </span>
                </div>
                <div className="text-sm text-yellow-500 font-display font-bold">
                  {game.jogadores.toLocaleString()} jogadores
                </div>
              </div>
            </div>

            <h3 className="font-casino text-2xl text-yellow-400 tracking-wider">
              {game.nome}
            </h3>
            <p className="text-yellow-800 text-xs mt-1 leading-relaxed font-display">
              {game.descricao}
            </p>

            {game.jackpot && (
              <div
                className="mt-3 p-2 rounded-lg text-center"
                style={{ background: "#0a0300", border: "1px solid #3a1800" }}
              >
                <div className="text-xs text-yellow-700 font-display tracking-widest uppercase">
                  Jackpot
                </div>
                <div className="text-xl font-casino neon-gold text-yellow-400">
                  R${game.jackpot.toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-red-500 font-display">
                  Chance: 1 em 16.777.216
                </div>
              </div>
            )}

            <HouseEdgeBar edge={game.vantagemCasa} />

            <button
              onClick={() => onPlay(game)}
              className="btn-gold w-full mt-4 py-2.5 rounded-xl text-sm tracking-widest uppercase"
            >
              Jogar Agora ▶
            </button>
          </div>
        ))}
      </div>

      <TestimonialsSection />
    </div>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <div className="mt-14">
      <div className="mb-8">
        <h2 className="font-casino text-4xl gold-shimmer">
          "DEPOIMENTOS REAIS"
        </h2>
        <p className="text-yellow-800 text-sm font-display mt-2 tracking-wide">
          Nossos "vencedores" — quem{" "}
          <strong className="text-red-400">perdeu menos</strong> que os outros
          usuários.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TESTIMONIALS.map((t) => {
          const saldo = t.ganho - t.perdido
          const pct = Math.round((t.ganho / t.perdido) * 100)
          return (
            <div key={t.id} className="testimonial-card rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-display flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#7c5200,#d4a017)",
                    color: "#050100",
                  }}
                >
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-yellow-400 text-sm">
                    {t.nome}
                  </div>
                  <div className="text-xs text-yellow-800">
                    {t.cidade} · {t.tempo}
                  </div>
                </div>
                <div className="text-center flex-shrink-0">
                  <div className="text-xs text-yellow-800 font-display">
                    Ranking
                  </div>
                  <div className="text-lg font-casino text-yellow-500">
                    #{t.posicaoRanking}
                  </div>
                </div>
              </div>

              <blockquote className="text-yellow-200/70 text-sm leading-relaxed italic font-display mb-4">
                "{t.depoimento}"
              </blockquote>

              <div
                className="grid grid-cols-3 gap-2 text-center pt-3 border-t"
                style={{ borderColor: "#2a1000" }}
              >
                <div>
                  <div className="text-xs text-yellow-800 font-display uppercase">
                    Perdido
                  </div>
                  <div className="text-red-400 font-display font-bold text-sm mt-0.5">
                    R${t.perdido.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-yellow-800 font-display uppercase">
                    Ganhou
                  </div>
                  <div className="text-green-400 font-display font-bold text-sm mt-0.5">
                    R${t.ganho.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-yellow-800 font-display uppercase">
                    Saldo
                  </div>
                  <div
                    className={`font-display font-bold text-sm mt-0.5 ${
                      saldo >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    R${saldo.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div
                  className="h-1.5 flex-1 rounded-full overflow-hidden"
                  style={{ background: "#1a0800" }}
                >
                  <div
                    className="h-full rounded-full bg-yellow-600"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-yellow-800 font-display whitespace-nowrap">
                  Recuperou {pct}%
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats callout */}
      <div
        className="mt-10 p-6 rounded-2xl border border-red-900/50"
        style={{ background: "linear-gradient(135deg,#120000,#1a0400)" }}
      >
        <h3 className="font-casino text-2xl text-red-400 neon-red mb-5">
          A VERDADE QUE AS BETs NÃO MOSTRAM
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              val: "98,3%",
              label: "Jogadores que perdem dinheiro",
              detalhe: "Apenas 1,7% lucra, e mesmo assim temporariamente",
            },
            {
              val: "R$847",
              label: "Renda média perdida por mês",
              detalhe:
                "Equivale a 2-3 cestas básicas desperdiçadas mensalmente",
            },
            {
              val: "4,2 Mi",
              label: "Brasileiros endividados por apostas",
              detalhe: "Número cresceu 340% desde 2023 segundo dados de 2026",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="text-center p-5 rounded-xl border border-red-900/30"
              style={{ background: "#0f0000" }}
            >
              <div className="font-casino text-4xl text-red-400 neon-red">
                {s.val}
              </div>
              <div className="font-display text-yellow-400 text-sm font-semibold mt-2">
                {s.label}
              </div>
              <div className="text-xs text-yellow-900 mt-2 leading-relaxed font-display">
                {s.detalhe}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Conta Panel ──────────────────────────────────────────────────────────────

function ContaPanel() {
  return (
    <div>
      <h2 className="font-casino text-5xl gold-shimmer mb-8">CONTA BANCÁRIA</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="game-card rounded-2xl p-6">
          <div className="text-xs text-yellow-800 font-display tracking-widest uppercase mb-2">
            Saldo Atual
          </div>
          <div className="font-casino text-6xl text-red-400 neon-red">
            -R$150
          </div>
          <div className="text-xs text-yellow-800 mt-2 font-display">
            Você está no vermelho. A casa agradece.
          </div>

          <div className="mt-6 space-y-3">
            {[
              {
                label: "Total Depositado",
                val: "R$450,00",
                color: "text-yellow-400",
              },
              {
                label: "Total Ganho",
                val: "R$300,00",
                color: "text-green-400",
              },
              {
                label: "Bônus Recebido",
                val: "R$50,00",
                color: "text-yellow-600",
              },
              {
                label: "Lucro da Casa com você",
                val: "R$150,00",
                color: "text-red-400",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center pb-2 border-b"
                style={{ borderColor: "#2a1000" }}
              >
                <span className="text-xs text-yellow-800 font-display">
                  {item.label}
                </span>
                <span
                  className={`font-display font-bold text-sm ${item.color}`}
                >
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="game-card rounded-2xl p-6">
          <div className="text-xs text-yellow-700 font-display tracking-widest uppercase mb-4">
            Depositar
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[20, 50, 100, 200, 500, 1000].map((v) => (
              <button
                key={v}
                className="btn-red py-2 rounded-xl text-sm font-bold"
              >
                R${v}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Valor personalizado (R$)"
            className="casino-input w-full px-4 py-3 rounded-xl text-sm mb-4 font-display"
          />
          <button className="btn-gold w-full py-3 rounded-xl text-sm tracking-widest uppercase">
            Depositar Agora 💰
          </button>
          <div
            className="mt-4 p-3 rounded-xl border border-red-900/40 text-xs text-red-400 font-display leading-relaxed"
            style={{ background: "#0f0000" }}
          >
            ⚠️ Dinheiro depositado raramente volta. Média de recuperação: 66%.
            Você dificilmente será a exceção.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Perfil Panel ─────────────────────────────────────────────────────────────

function PerfilPanel() {
  return (
    <div>
      <h2 className="font-casino text-5xl gold-shimmer mb-8">MEU PERFIL</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="game-card rounded-2xl p-6 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-bold font-display mb-4 gold-glow-anim"
            style={{
              background: "linear-gradient(135deg,#7c5200,#ffd700)",
              color: "#050100",
            }}
          >
            JO
          </div>
          <div className="font-display text-yellow-400 text-xl font-semibold">
            João Oliveira
          </div>
          <div className="text-yellow-800 text-sm font-display">
            São Paulo, SP
          </div>
          <div
            className="mt-3 px-3 py-1 rounded-full inline-block text-xs font-display tracking-widest uppercase"
            style={{
              background: "#1a0800",
              color: "#d4a017",
              border: "1px solid #3a1800",
            }}
          >
            Nível Ouro 🏅
          </div>
          <div
            className="mt-5 p-3 rounded-xl border border-red-900/40 text-xs text-red-400 font-display leading-relaxed"
            style={{ background: "#0f0000" }}
          >
            Você está neste site há <strong>7 meses</strong>.<br />
            Considerou parar alguma vez?
          </div>
        </div>

        <div className="md:col-span-2 space-y-5">
          <div className="game-card rounded-2xl p-5">
            <div className="font-display text-yellow-700 text-xs tracking-widest uppercase mb-3">
              Estatísticas de Jogo
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Partidas Jogadas",
                  val: "1.247",
                  color: "text-yellow-400",
                },
                {
                  label: "Horas Jogadas",
                  val: "342h",
                  color: "text-yellow-400",
                },
                { label: "Maior Ganho", val: "R$320", color: "text-green-400" },
                { label: "Maior Perda", val: "R$200", color: "text-red-400" },
                { label: "Ranking", val: "#7", color: "text-yellow-500" },
                { label: "Pontos", val: "4.820", color: "text-yellow-400" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl"
                  style={{ background: "#0a0300", border: "1px solid #2a1000" }}
                >
                  <div className="text-xs text-yellow-800 font-display">
                    {s.label}
                  </div>
                  <div className={`font-casino text-2xl mt-0.5 ${s.color}`}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="game-card rounded-2xl p-5 border border-red-900/50">
            <div className="font-display text-red-400 text-xs tracking-widest uppercase mb-3">
              ⚠️ Padrões Preocupantes
            </div>
            <div className="space-y-2.5">
              {[
                "Você jogou às 3h da manhã em 14 dos últimos 30 dias",
                "Seu tempo de jogo aumentou 60% no último mês",
                "Você já depositou 4x esta semana",
                "Sua maior perda foi logo após um grande ganho",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-sm text-yellow-200/60 font-display"
                >
                  <span className="text-red-500 flex-shrink-0">•</span>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: item.replace(
                        /(\d+[hx%]|\d+h|\d+ dos|\d+%)/,
                        '<strong class="text-red-400">$&</strong>',
                      ),
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Ranking Panel ────────────────────────────────────────────────────────────

function RankingPanel() {
  return (
    <div>
      <h2 className="font-casino text-5xl gold-shimmer mb-2">
        RANKING SEMANAL
      </h2>
      <p className="text-yellow-800 text-sm font-display mb-8">
        Classificação de quem{" "}
        <strong className="text-red-400">perdeu menos</strong>. Todos estão no
        vermelho.
      </p>

      <div className="game-card rounded-2xl overflow-hidden">
        <div
          className="grid grid-cols-5 gap-3 px-6 py-3 text-xs font-display tracking-widest uppercase text-yellow-800 border-b"
          style={{ borderColor: "#2a1000" }}
        >
          <div>#</div>
          <div className="col-span-2">Jogador</div>
          <div className="text-right">Perdido</div>
          <div className="text-right">Saldo</div>
        </div>
        {RANKING.map((r, i) => (
          <div
            key={r.pos}
            className="grid grid-cols-5 gap-3 px-6 py-4 border-b items-center"
            style={{
              borderColor: "#1a0800",
              background: r.nome === "Você" ? "#1a0a00" : "transparent",
            }}
          >
            <div
              className={`font-casino text-2xl ${
                i === 0
                  ? "text-yellow-400 neon-gold"
                  : i === 1
                    ? "text-gray-300"
                    : i === 2
                      ? "text-orange-400"
                      : "text-yellow-800"
              }`}
            >
              {r.pos <= 3 ? ["🥇", "🥈", "🥉"][r.pos - 1] : `#${r.pos}`}
            </div>
            <div className="col-span-2">
              <span
                className={`font-display font-semibold text-sm ${
                  r.nome === "Você" ? "text-yellow-300" : "text-yellow-600"
                }`}
              >
                {r.nome}
              </span>
              {r.nome === "Você" && (
                <span className="ml-2 text-xs text-yellow-800">(você)</span>
              )}
            </div>
            <div className="text-right font-display text-red-500 text-sm">
              R${r.perdido}
            </div>
            <div className="text-right font-display font-bold text-red-400 text-sm">
              R${r.saldo}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-4 p-4 rounded-2xl text-center text-xs text-yellow-800 font-display"
        style={{ background: "#0a0300", border: "1px solid #2a1000" }}
      >
        🏆 O "campeão" perdeu R$25 esta semana. O último perdeu R$170.
        <strong className="text-red-400 ml-1">Todos perderam.</strong>A casa
        ganhou R$605 no total com estes 8 jogadores.
      </div>
    </div>
  )
}

// ─── Extrato Panel ────────────────────────────────────────────────────────────

function ExtratoPanel() {
  return (
    <div>
      <h2 className="font-casino text-5xl gold-shimmer mb-8">
        EXTRATO DE JOGO
      </h2>
      <div className="game-card rounded-2xl overflow-hidden mb-5">
        <div
          className="grid grid-cols-4 gap-3 px-6 py-3 text-xs font-display tracking-widest uppercase text-yellow-800 border-b"
          style={{ borderColor: "#2a1000" }}
        >
          <div>Data / Hora</div>
          <div>Jogo</div>
          <div className="text-right">Apostado</div>
          <div className="text-right">Resultado</div>
        </div>
        {EXTRATO.map((e, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-3 px-6 py-4 border-b items-center"
            style={{ borderColor: "#1a0800" }}
          >
            <div className="text-xs text-yellow-900 font-display">{e.data}</div>
            <div className="font-display text-yellow-500 text-sm">{e.jogo}</div>
            <div className="text-right font-display text-yellow-600 text-sm">
              R${e.apostado}
            </div>
            <div
              className={`text-right font-display text-sm font-bold ${
                e.tipo === "vitoria" ? "text-green-400" : "text-red-400"
              }`}
            >
              {e.tipo === "vitoria" ? "+" : ""}R${Math.abs(e.resultado)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Apostado", val: "R$755", color: "text-yellow-400" },
          { label: "Total Ganho", val: "R$235", color: "text-green-400" },
          { label: "Prejuízo", val: "-R$520", color: "text-red-400" },
        ].map((s, i) => (
          <div key={i} className="game-card rounded-2xl p-5 text-center">
            <div className="text-xs text-yellow-800 font-display uppercase tracking-wider">
              {s.label}
            </div>
            <div className={`font-casino text-3xl mt-1 ${s.color}`}>
              {s.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Mobile Bottom Navigation ──────────────────────────────────────────────────

function MobileBottomNav({
  active,
  onNav,
}: {
  active: NavItem
  onNav: (n: NavItem) => void
}) {
  const items: { id: NavItem; label: string; icon: string }[] = [
    { id: "jogos", label: "Jogos", icon: "🎮" },
    { id: "conta", label: "Conta", icon: "🏦" },
    { id: "perfil", label: "Perfil", icon: "👤" },
    { id: "ranking", label: "Ranking", icon: "🏆" },
    { id: "extrato", label: "Extrato", icon: "📋" },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-md border-t border-yellow-900/60 px-2 py-2 flex justify-around items-center shadow-2xl">
      {items.map((item) => {
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
              isActive
                ? "text-yellow-400 font-bold bg-yellow-950/30"
                : "text-gray-400 hover:text-yellow-600"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-display mt-0.5">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  user,
  onOpenAuth,
  onLogout,
  onOpenDeposit,
  isLightMode,
  onToggleLightMode,
}: {
  user: UserAuth | null
  onOpenAuth: () => void
  onLogout: () => void
  onOpenDeposit: () => void
  isLightMode: boolean
  onToggleLightMode: () => void
}) {
  const [counter, setCounter] = useState(2847320)
  useEffect(() => {
    const id = setInterval(
      () => setCounter((c) => c + Math.floor(Math.random() * 150 + 50)),
      2000,
    )
    return () => clearInterval(id)
  }, [])

  return (
    <header
      className="relative z-10 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between border-b gap-2"
      style={{
        background: isLightMode
          ? "linear-gradient(90deg,#ffffff,#f8fafc,#ffffff)"
          : "linear-gradient(90deg,#080200,#0f0500,#080200)",
        borderColor: isLightMode ? "#e2e8f0" : "#2a1000",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="font-casino text-xl sm:text-2xl neon-gold text-yellow-400 tracking-widest">
          🐯 TIGRINHO BET
        </div>
        <div
          className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full border"
          style={{ background: "#0f0000", borderColor: "#5a0000" }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-display tracking-wider">
            AO VIVO — 3.801 jogadores
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="hidden xl:block text-xs font-display">
          <span className="text-yellow-800">Prejuízo acumulado hoje: </span>
          <span className="text-red-400 font-bold">
            R${counter.toLocaleString("pt-BR")}
          </span>
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleLightMode}
          className="px-3 py-1.5 rounded-xl border text-xs font-display font-semibold transition-all shadow-sm flex items-center gap-1.5"
          style={{
            background: isLightMode ? "#ffffff" : "#120600",
            borderColor: isLightMode ? "#cbd5e1" : "#4a2200",
            color: isLightMode ? "#0f172a" : "#ffd700",
          }}
          title="Alternar entre Modo Claro e Modo Escuro"
        >
          {isLightMode ? "🌙 Modo Escuro" : "☀️ Modo Claro"}
        </button>

        {/* Deposit Button */}
        <button
          onClick={onOpenDeposit}
          className="btn-gold px-3.5 py-1.5 rounded-xl text-xs tracking-widest uppercase font-bold shadow-md"
        >
          💰 Depositar
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs font-display text-yellow-300 font-bold block truncate max-w-[100px] sm:max-w-[180px]">
                👤 {user.nome}
              </span>
              <span className="text-[10px] text-yellow-700 font-mono block">
                Matrícula: {user.matricula}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-lg border border-red-900 bg-red-950/60 text-red-300 text-xs font-display hover:bg-red-900 transition-colors"
              title="Encerrar sessão"
            >
              Sair 🚪
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-gold px-3.5 py-1.5 rounded-xl text-xs tracking-widest uppercase font-bold shadow-md"
          >
            🔑 Entrar / Cadastrar
          </button>
        )}
      </div>
    </header>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItem>("jogos")
  const [selectedGame, setSelectedGame] = useState<GameInfo | null>(null)
  const [user, setUser] = useState<UserAuth | null>(() => obterUsuarioAtual())

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWinModal, setShowWinModal] = useState(false)
  const [winDescription, setWinDescription] = useState("")

  // Theme Light Mode State
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem("cassino_light_mode") === "true"
  })

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add("light-mode")
    } else {
      document.body.classList.remove("light-mode")
    }
    localStorage.setItem("cassino_light_mode", isLightMode ? "true" : "false")
  }, [isLightMode])

  const handleLogout = () => {
    logoutUsuario()
    setUser(null)
  }

  const handleDepositSuccess = (addedCents: number) => {
    if (user) {
      const updatedUser: UserAuth = {
        ...user,
        saldo_centavos: user.saldo_centavos + addedCents,
      }
      setUser(updatedUser)
      salvarUsuarioLocal(updatedUser)
    }
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0 transition-colors">
      <GoldParticles />
      <WarningBanner />
      <LiveTicker />
      <Header
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenDeposit={() => setShowDepositModal(true)}
        isLightMode={isLightMode}
        onToggleLightMode={() => setIsLightMode((prev) => !prev)}
      />

      <div className="flex flex-1 relative z-10">
        <Sidebar active={activeNav} onNav={setActiveNav} />

        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8"
          style={{
            background: isLightMode
              ? "radial-gradient(ellipse at 20% 0%,#ffffff 0%,#f1f5f9 40%,#e2e8f0 100%)"
              : "radial-gradient(ellipse at 20% 0%,#1a0800 0%,#080300 40%,#030100 100%)",
          }}
        >
          {activeNav === "jogos" && <GamesPanel onPlay={setSelectedGame} />}
          {activeNav === "conta" && <ContaPanel />}
          {activeNav === "perfil" && <PerfilPanel />}
          {activeNav === "ranking" && <RankingPanel />}
          {activeNav === "extrato" && <ExtratoPanel />}
        </main>
      </div>

      <MobileBottomNav active={activeNav} onNav={setActiveNav} />

      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser)
          setShowAuthModal(false)
        }}
      />

      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onDeposit={handleDepositSuccess}
      />

      <WinImpactModal
        isOpen={showWinModal}
        prizeDescription={winDescription}
        onClose={() => setShowWinModal(false)}
      />
    </div>
  )
}
