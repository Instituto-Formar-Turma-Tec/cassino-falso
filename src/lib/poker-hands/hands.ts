// Minimal poker hand evaluator for Texas Hold'em (5 from 7 cards)
import { evaluateBest7CardHand, compareEvaluations, HandCategory } from "../poker-engine"

type Card = string // e.g. "Ah"

export enum HandRank {
  HIGH_CARD = 1,
  ONE_PAIR = 2,
  TWO_PAIR = 3,
  THREE_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_KIND = 8,
  STRAIGHT_FLUSH = 9,
}

export interface EvalResult {
  rank: HandRank
  kickers: number[]
  name: string
}

export function getHandName(r: HandRank): string {
  const names: Record<number, string> = {
    [HandRank.HIGH_CARD]: "Carta Alta",
    [HandRank.ONE_PAIR]: "Par",
    [HandRank.TWO_PAIR]: "Dois Pares",
    [HandRank.THREE_KIND]: "Trinca",
    [HandRank.STRAIGHT]: "Sequência",
    [HandRank.FLUSH]: "Flush",
    [HandRank.FULL_HOUSE]: "Full House",
    [HandRank.FOUR_KIND]: "Quadra",
    [HandRank.STRAIGHT_FLUSH]: "Straight Flush",
  }
  return names[r] || "N/A"
}

export function bestHand(seven: Card[]): EvalResult {
  if (seven.length < 5) return { rank: HandRank.HIGH_CARD, kickers: [], name: "" }
  const res = evaluateBest7CardHand(seven)
  return {
    rank: res.category as unknown as HandRank,
    kickers: res.kickers,
    name: res.name,
  }
}

export function determineWinner(
  players: { user_id: string; cards: Card[]; folded: boolean; paid: number }[],
  community: Card[],
): string {
  const active = players.filter((p) => !p.folded)
  if (active.length === 0) return ""
  if (active.length === 1) return active[0].user_id

  let bestUser = ""
  let bestEval: any = null

  for (const p of active) {
    const seven = [...p.cards, ...community]
    const h = evaluateBest7CardHand(seven)
    if (!bestEval || compareEvaluations(h, bestEval) > 0) {
      bestEval = h
      bestUser = p.user_id
    }
  }
  return bestUser
}

export function cardDisplay(
  c: Card,
): { rank: string; suit: string; color: string } {
  if (!c || c.length < 2) return { rank: "?", suit: "?", color: "#888" }
  const rank = c[0]
  const suitChar = c[1]
  const suitMap: Record<string, string> = { c: "♣", d: "♦", h: "♥", s: "♠" }
  const color = suitChar === "h" || suitChar === "d" ? "#cc0000" : "#ffffff"
  return {
    rank: rank === "T" ? "10" : rank,
    suit: suitMap[suitChar] || suitChar,
    color,
  }
}
