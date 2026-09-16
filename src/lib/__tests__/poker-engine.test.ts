import { describe, it, expect } from "vitest"
import {
  evaluateBest7CardHand,
  evaluate5CardHand,
  compareEvaluations,
  HandCategory,
  calculatePots,
  startNewHand,
  processPlayerAction,
  getValidActions,
  PlayerState,
  Card,
} from "../poker-engine"

describe("Texas Hold'em Hand Evaluator", () => {
  it("should evaluate Royal Flush", () => {
    const cards: Card[] = ["As", "Ks", "Qs", "Js", "Ts", "2d", "3c"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.ROYAL_FLUSH)
    expect(res.name).toBe("Royal Flush")
  })

  it("should evaluate Straight Flush", () => {
    const cards: Card[] = ["9h", "8h", "7h", "6h", "5h", "Kd", "Ac"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.STRAIGHT_FLUSH)
    expect(res.name).toBe("Straight Flush")
  })

  it("should evaluate Four of a Kind", () => {
    const cards: Card[] = ["8c", "8d", "8h", "8s", "Kc", "2d", "3h"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.FOUR_OF_A_KIND)
    expect(res.name).toBe("Quadra")
    expect(res.kickers).toEqual([8, 13])
  })

  it("should evaluate Full House", () => {
    const cards: Card[] = ["Jc", "Jd", "Jh", "4s", "4h", "2c", "9d"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.FULL_HOUSE)
    expect(res.name).toBe("Full House")
    expect(res.kickers).toEqual([11, 4])
  })

  it("should evaluate Flush", () => {
    const cards: Card[] = ["Ah", "Th", "7h", "4h", "2h", "Kc", "Qd"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.FLUSH)
    expect(res.name).toBe("Flush")
  })

  it("should evaluate Straight", () => {
    const cards: Card[] = ["Td", "9c", "8h", "7s", "6d", "2c", "3h"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.STRAIGHT)
    expect(res.name).toBe("Sequência")
    expect(res.kickers[0]).toBe(10)
  })

  it("should evaluate Ace-Low Straight (Wheel A-2-3-4-5)", () => {
    const cards: Card[] = ["As", "5d", "4c", "3h", "2d", "Kd", "Qc"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.STRAIGHT)
    expect(res.name).toBe("Sequência")
    expect(res.kickers[0]).toBe(5) // High card of A-2-3-4-5 is 5
  })

  it("should evaluate Three of a Kind", () => {
    const cards: Card[] = ["7c", "7d", "7h", "Kd", "2s", "4c", "3d"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.THREE_OF_A_KIND)
    expect(res.name).toBe("Trinca")
    expect(res.kickers).toEqual([7, 13, 4])
  })

  it("should evaluate Two Pair", () => {
    const cards: Card[] = ["Ac", "Ad", "Kh", "Ks", "5d", "2c", "3h"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.TWO_PAIR)
    expect(res.name).toBe("Dois Pares")
    expect(res.kickers).toEqual([14, 13, 5])
  })

  it("should evaluate One Pair", () => {
    const cards: Card[] = ["Qc", "Qd", "9s", "7c", "3d", "2h", "4s"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.ONE_PAIR)
    expect(res.name).toBe("Par")
    expect(res.kickers).toEqual([12, 9, 7, 4])
  })

  it("should evaluate High Card", () => {
    const cards: Card[] = ["As", "Kd", "9c", "7h", "2s", "4c", "3d"]
    const res = evaluateBest7CardHand(cards)
    expect(res.category).toBe(HandCategory.HIGH_CARD)
    expect(res.name).toBe("Carta Alta")
    expect(res.kickers).toEqual([14, 13, 9, 7, 4])
  })

  it("should break ties using kickers correctly", () => {
    // Player A has A-K pair of aces (A A K 8 5)
    // Player B has A-Q pair of aces (A A Q 8 5)
    const board: Card[] = ["Ac", "8s", "5h", "3d", "2c"]
    const handA = evaluateBest7CardHand(["As", "Kd", ...board])
    const handB = evaluateBest7CardHand(["Ad", "Qd", ...board])

    expect(handA.category).toBe(HandCategory.ONE_PAIR)
    expect(handB.category).toBe(HandCategory.ONE_PAIR)
    expect(compareEvaluations(handA, handB)).toBeGreaterThan(0)
  })
})

describe("Heads-Up & Multi-Player Position Rules", () => {
  it("should handle Heads-Up (2 players) position rules correctly", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
    ]
    const state = startNewHand({ players, smallBlindAmount: 10, bigBlindAmount: 20, dealerIndex: 0 })

    // Dealer (P1) is SB and acts first pre-flop
    expect(state.dealerIndex).toBe(0)
    expect(state.smallBlindIndex).toBe(0)
    expect(state.bigBlindIndex).toBe(1)
    expect(state.currentTurnIndex).toBe(0) // Dealer/SB acts first pre-flop in heads-up
  })

  it("should handle 3+ players position rules correctly", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
      { id: "p3", name: "Charlie", chips: 1000 },
    ]
    const state = startNewHand({ players, smallBlindAmount: 10, bigBlindAmount: 20, dealerIndex: 0 })

    // Dealer = 0 (Alice), SB = 1 (Bob), BB = 2 (Charlie), Turn = 0 (Alice - UTG in 3 players = Dealer)
    expect(state.dealerIndex).toBe(0)
    expect(state.smallBlindIndex).toBe(1)
    expect(state.bigBlindIndex).toBe(2)
    expect(state.currentTurnIndex).toBe(0)
  })

  it("should advance dealer button to next player on next hand", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
      { id: "p3", name: "Charlie", chips: 1000 },
    ]
    const hand1 = startNewHand({ players, dealerIndex: 0 })
    const hand2 = startNewHand({ players }, hand1)

    expect(hand2.dealerIndex).toBe(1) // Bob is dealer
    expect(hand2.smallBlindIndex).toBe(2) // Charlie is SB
    expect(hand2.bigBlindIndex).toBe(0) // Alice is BB
  })
})

describe("Blinds & Forced All-In", () => {
  it("should force Small Blind and Big Blind posting", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
    ]
    const state = startNewHand({ players, smallBlindAmount: 10, bigBlindAmount: 20, dealerIndex: 0 })

    expect(state.players[0].chips).toBe(990)
    expect(state.players[0].totalHandContribution).toBe(10)
    expect(state.players[1].chips).toBe(980)
    expect(state.players[1].totalHandContribution).toBe(20)
    expect(state.currentBet).toBe(20)
  })

  it("should handle forced All-In if player has less than blind amount", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 5 }, // Only 5 chips for 10 SB
      { id: "p2", name: "Bob", chips: 1000 },
    ]
    const state = startNewHand({ players, smallBlindAmount: 10, bigBlindAmount: 20, dealerIndex: 0 })

    expect(state.players[0].chips).toBe(0)
    expect(state.players[0].isAllIn).toBe(true)
    expect(state.players[0].totalHandContribution).toBe(5)
  })
})

describe("Side Pots Calculation", () => {
  it("should calculate Main Pot and Side Pots correctly for multiple All-In levels", () => {
    const players: PlayerState[] = [
      {
        id: "p1",
        name: "Alice",
        chips: 0,
        holeCards: [],
        folded: false,
        isAllIn: true,
        totalHandContribution: 100,
        currentRoundContribution: 100,
        isDealer: true,
        isSmallBlind: false,
        isBigBlind: false,
      },
      {
        id: "p2",
        name: "Bob",
        chips: 0,
        holeCards: [],
        folded: false,
        isAllIn: true,
        totalHandContribution: 300,
        currentRoundContribution: 300,
        isDealer: false,
        isSmallBlind: true,
        isBigBlind: false,
      },
      {
        id: "p3",
        name: "Charlie",
        chips: 0,
        holeCards: [],
        folded: false,
        isAllIn: true,
        totalHandContribution: 500,
        currentRoundContribution: 500,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: true,
      },
    ]

    const pots = calculatePots(players)

    expect(pots.length).toBe(3)
    // Main Pot: 100 * 3 = 300, eligible: p1, p2, p3
    expect(pots[0].name).toBe("Pote Principal")
    expect(pots[0].amount).toBe(300)
    expect(pots[0].eligiblePlayerIds).toEqual(["p1", "p2", "p3"])

    // Side Pot 1: (300 - 100) * 2 = 400, eligible: p2, p3
    expect(pots[1].name).toBe("Side Pot 1")
    expect(pots[1].amount).toBe(400)
    expect(pots[1].eligiblePlayerIds).toEqual(["p2", "p3"])

    // Side Pot 2: (500 - 300) * 1 = 200, eligible: p3
    expect(pots[2].name).toBe("Side Pot 2")
    expect(pots[2].amount).toBe(200)
    expect(pots[2].eligiblePlayerIds).toEqual(["p3"])
  })
})

describe("Betting Round Workflow & Action Validation", () => {
  it("should process Fold action and end hand if only 1 player remains", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
    ]
    let state = startNewHand({ players, smallBlindAmount: 10, bigBlindAmount: 20, dealerIndex: 0 })

    // P1 (Dealer/SB) folds
    state = processPlayerAction(state, "p1", "fold")

    expect(state.isHandComplete).toBe(true)
    expect(state.players[1].chips).toBe(1010) // Bob wins 10 SB + 20 BB = 30 pot, net +10
    expect(state.handWinnerMessage).toContain("Bob venceu")
  })

  it("should process Call action and advance round when equalized", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
    ]
    let state = startNewHand({ players, smallBlindAmount: 10, bigBlindAmount: 20, dealerIndex: 0 })

    // P1 (SB=10) calls 10 more to match BB=20
    state = processPlayerAction(state, "p1", "call")
    expect(state.players[0].totalHandContribution).toBe(20)

    // P2 (BB=20) checks
    state = processPlayerAction(state, "p2", "check")

    // Flop should be revealed!
    expect(state.round).toBe("FLOP")
    expect(state.communityCards.length).toBe(3)
  })

  it("should enforce minimum raise rule", () => {
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
    ]
    const state = startNewHand({ players, smallBlindAmount: 10, bigBlindAmount: 20, dealerIndex: 0 })
    const valid = getValidActions(state, "p1")

    expect(valid.canRaise).toBe(true)
    expect(valid.minRaiseTo).toBe(40) // Current bet 20 + min raise 20 = 40
  })

  it("should allow deterministic fake deck for exact testing", () => {
    // Inject deterministic cards
    // 2 cards for P1, 2 cards for P2, 5 community cards
    // Deal order with pop(): P1 gets card 1, P2 gets card 2, P1 gets card 3, P2 gets card 4
    const fakeDeck: Card[] = [
      "2c", "3c", "4c", "5c", "6c", // Flop, Turn, River
      "Kd", // P2 card 2
      "Ah", // P1 card 2
      "Kh", // P2 card 1
      "As", // P1 card 1
    ]
    const players = [
      { id: "p1", name: "Alice", chips: 1000 },
      { id: "p2", name: "Bob", chips: 1000 },
    ]
    const state = startNewHand({ players, fakeDeck, dealerIndex: 0 })

    expect(state.players[0].holeCards).toEqual(["As", "Ah"])
    expect(state.players[1].holeCards).toEqual(["Kh", "Kd"])
  })
})
