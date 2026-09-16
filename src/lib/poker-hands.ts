// Client-side poker hand evaluator for Texas Hold'em
import { evaluateBest7CardHand, compareEvaluations, Card as EngineCard } from "./poker-engine"

type Card = string // e.g. "Ah" = Ace of hearts, "Td" = Ten of diamonds

export interface EvaluatedHandResult {
  strength: number
  kickers: number[]
  name: string
}

export function evaluateBestHand(cards: Card[]): EvaluatedHandResult {
  if (cards.length < 5) return { strength: 0, kickers: [0], name: "N/A" }
  const result = evaluateBest7CardHand(cards)
  return {
    strength: result.category,
    kickers: result.kickers,
    name: result.name,
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
  if (!c || c.length < 2) {
    return { rank: "?", suit: "?", color: "#888" }
  }
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
