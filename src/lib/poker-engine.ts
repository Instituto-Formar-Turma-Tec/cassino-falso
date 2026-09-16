// Texas Hold'em No-Limit Domain Engine
// Pure functional domain module with deterministic Web Crypto API RNG

export type Suit = "c" | "d" | "h" | "s"
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K"
  | "A"

export type Card = string // e.g. "Ah", "Td", "2c"

export const RANKS: Rank[] = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
]
export const SUITS: Suit[] = ["c", "d", "h", "s"]

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

export const RANK_VALUE: Record<string, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
}

export enum HandCategory {
  HIGH_CARD = 1,
  ONE_PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

export interface HandEvaluation {
  category: HandCategory
  name: string
  score: number // Integer representation for easy comparative sorting
  kickers: number[]
  cards: Card[] // The best 5 cards
}

export interface PlayerState {
  id: string
  name: string
  chips: number // Stack in cents or chips
  holeCards: Card[]
  folded: boolean
  isAllIn: boolean
  totalHandContribution: number
  currentRoundContribution: number
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  isBot?: boolean
}

export type BettingRound = "PRE_FLOP" | "FLOP" | "TURN" | "RIVER" | "SHOWDOWN"

export interface Pot {
  name: string
  amount: number
  eligiblePlayerIds: string[]
  winners?: { playerId: string; amount: number; handName: string }[]
}

export interface ActionLog {
  timestamp: number
  playerId: string
  playerName: string
  action: "POST_SB" | "POST_BB" | "FOLD" | "CHECK" | "CALL" | "BET" | "RAISE" | "ALL_IN"
  amount?: number
  round: BettingRound
}

export interface PokerState {
  players: PlayerState[]
  deck: Card[]
  communityCards: Card[]
  dealerIndex: number
  smallBlindIndex: number
  bigBlindIndex: number
  currentTurnIndex: number
  round: BettingRound
  smallBlindAmount: number
  bigBlindAmount: number
  currentBet: number
  minimumRaise: number // Min increment for a raise above currentBet
  lastRaiseAmount: number // Amount added in last raise
  pots: Pot[]
  actionHistory: ActionLog[]
  isHandComplete: boolean
  handWinnerMessage?: string
}

export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "all_in"

export interface ValidActions {
  canFold: boolean
  canCheck: boolean
  canCall: boolean
  callAmount: number
  canBet: boolean
  minBet: number
  maxBet: number
  canRaise: boolean
  minRaiseTo: number // Total bet target
  maxRaiseTo: number
  canAllIn: boolean
  allInAmount: number
}

// ---------- 1. BARALHO E RNG ----------

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(`${r}${s}`)
    }
  }
  return deck
}

function getRandomInt(max: number): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] % max
  }
  // Fallback for non-browser environment without Web Crypto
  return Math.floor(Math.random() * max)
}

export function shuffleDeck(deck: Card[], fakeDeck?: Card[]): Card[] {
  if (fakeDeck && fakeDeck.length > 0) {
    return [...fakeDeck]
  }
  const result = [...deck]
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// ---------- 2. AVALIAÇÃO DE MÃOS (TEXAS HOLD'EM BEST 5 OF 7) ----------

export function evaluate5CardHand(cards: Card[]): HandEvaluation {
  if (cards.length !== 5) {
    throw new Error("Evaluation requires exactly 5 cards")
  }

  const sortedCards = [...cards].sort(
    (a, b) => RANK_VALUE[b[0]] - RANK_VALUE[a[0]],
  )
  const ranks = sortedCards.map((c) => RANK_VALUE[c[0]])
  const suits = sortedCards.map((c) => c[1])

  const isFlush = suits.every((s) => s === suits[0])

  // Check straight
  let isStraight = false
  let straightRanks = [...ranks]

  if (
    ranks[0] - ranks[1] === 1 &&
    ranks[1] - ranks[2] === 1 &&
    ranks[2] - ranks[3] === 1 &&
    ranks[3] - ranks[4] === 1
  ) {
    isStraight = true
  } else if (
    ranks[0] === 14 &&
    ranks[1] === 5 &&
    ranks[2] === 4 &&
    ranks[3] === 3 &&
    ranks[4] === 2
  ) {
    // Wheel straight: A-2-3-4-5. Ace ranks as 5 for high card of straight
    isStraight = true
    straightRanks = [5, 4, 3, 2, 1] // Ace counts as 1 for kickers comparison
  }

  // Count rank frequencies
  const counts: Record<number, number> = {}
  for (const r of ranks) {
    counts[r] = (counts[r] || 0) + 1
  }

  const groups = Object.entries(counts)
    .map(([r, count]) => ({ rank: Number(r), count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank)

  // 1. Royal Flush / Straight Flush
  if (isFlush && isStraight) {
    if (straightRanks[0] === 14 && straightRanks[1] === 13) {
      return {
        category: HandCategory.ROYAL_FLUSH,
        name: "Royal Flush",
        score: HandCategory.ROYAL_FLUSH * 1e8 + 14,
        kickers: [14],
        cards: sortedCards,
      }
    }
    return {
      category: HandCategory.STRAIGHT_FLUSH,
      name: "Straight Flush",
      score: HandCategory.STRAIGHT_FLUSH * 1e8 + straightRanks[0],
      kickers: straightRanks,
      cards: sortedCards,
    }
  }

  // 2. Four of a Kind
  if (groups[0].count === 4) {
    const quadRank = groups[0].rank
    const kicker = groups[1].rank
    return {
      category: HandCategory.FOUR_OF_A_KIND,
      name: "Quadra",
      score: HandCategory.FOUR_OF_A_KIND * 1e8 + quadRank * 1e4 + kicker,
      kickers: [quadRank, kicker],
      cards: sortedCards,
    }
  }

  // 3. Full House
  if (groups[0].count === 3 && groups[1].count === 2) {
    const tripRank = groups[0].rank
    const pairRank = groups[1].rank
    return {
      category: HandCategory.FULL_HOUSE,
      name: "Full House",
      score: HandCategory.FULL_HOUSE * 1e8 + tripRank * 1e4 + pairRank,
      kickers: [tripRank, pairRank],
      cards: sortedCards,
    }
  }

  // 4. Flush
  if (isFlush) {
    const score =
      HandCategory.FLUSH * 1e8 +
      ranks[0] * 1e6 +
      ranks[1] * 1e4 +
      ranks[2] * 100 +
      ranks[3] * 10 +
      ranks[4]
    return {
      category: HandCategory.FLUSH,
      name: "Flush",
      score,
      kickers: ranks,
      cards: sortedCards,
    }
  }

  // 5. Straight
  if (isStraight) {
    return {
      category: HandCategory.STRAIGHT,
      name: "Sequência",
      score: HandCategory.STRAIGHT * 1e8 + straightRanks[0],
      kickers: straightRanks,
      cards: sortedCards,
    }
  }

  // 6. Three of a Kind
  if (groups[0].count === 3) {
    const tripRank = groups[0].rank
    const kicker1 = groups[1].rank
    const kicker2 = groups[2].rank
    return {
      category: HandCategory.THREE_OF_A_KIND,
      name: "Trinca",
      score:
        HandCategory.THREE_OF_A_KIND * 1e8 +
        tripRank * 1e4 +
        kicker1 * 100 +
        kicker2,
      kickers: [tripRank, kicker1, kicker2],
      cards: sortedCards,
    }
  }

  // 7. Two Pair
  if (groups[0].count === 2 && groups[1].count === 2) {
    const highPair = Math.max(groups[0].rank, groups[1].rank)
    const lowPair = Math.min(groups[0].rank, groups[1].rank)
    const kicker = groups[2].rank
    return {
      category: HandCategory.TWO_PAIR,
      name: "Dois Pares",
      score:
        HandCategory.TWO_PAIR * 1e8 + highPair * 1e4 + lowPair * 100 + kicker,
      kickers: [highPair, lowPair, kicker],
      cards: sortedCards,
    }
  }

  // 8. One Pair
  if (groups[0].count === 2) {
    const pairRank = groups[0].rank
    const k1 = groups[1].rank
    const k2 = groups[2].rank
    const k3 = groups[3].rank
    return {
      category: HandCategory.ONE_PAIR,
      name: "Par",
      score:
        HandCategory.ONE_PAIR * 1e8 +
        pairRank * 1e6 +
        k1 * 1e4 +
        k2 * 100 +
        k3,
      kickers: [pairRank, k1, k2, k3],
      cards: sortedCards,
    }
  }

  // 9. High Card
  return {
    category: HandCategory.HIGH_CARD,
    name: "Carta Alta",
    score:
      HandCategory.HIGH_CARD * 1e8 +
      ranks[0] * 1e6 +
      ranks[1] * 1e4 +
      ranks[2] * 100 +
      ranks[3] * 10 +
      ranks[4],
    kickers: ranks,
    cards: sortedCards,
  }
}

// Generate all combinations of k items from array
function* getCombinations<T>(array: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield []
    return
  }
  if (array.length < k) return
  for (let i = 0; i <= array.length - k; i++) {
    for (const sub of getCombinations(array.slice(i + 1), k - 1)) {
      yield [array[i], ...sub]
    }
  }
}

export function evaluateBest7CardHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error("Evaluating hand requires at least 5 cards")
  }
  let best: HandEvaluation | null = null

  for (const combo of getCombinations(cards, 5)) {
    const evalResult = evaluate5CardHand(combo)
    if (!best || compareEvaluations(evalResult, best) > 0) {
      best = evalResult
    }
  }

  return best!
}

export function compareEvaluations(
  a: HandEvaluation,
  b: HandEvaluation,
): number {
  if (a.score !== b.score) {
    return a.score - b.score
  }
  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) {
      return a.kickers[i] - b.kickers[i]
    }
  }
  return 0
}

// ---------- 3. SIDE POTS CALCULATION ----------

export function calculatePots(players: PlayerState[]): Pot[] {
  const pots: Pot[] = []

  // Get total contribution of each player
  const contributions = players.map((p) => ({
    id: p.id,
    amount: p.totalHandContribution,
    folded: p.folded,
  }))

  const positiveContribs = contributions.filter((c) => c.amount > 0)
  if (positiveContribs.length === 0) return []

  // Unique non-zero contribution levels from all players (including folded)
  const levels = Array.from(
    new Set(positiveContribs.map((c) => c.amount)),
  ).sort((a, b) => a - b)

  let previousLevel = 0

  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]
    const levelDelta = level - previousLevel
    let potAmount = 0
    const eligiblePlayerIds: string[] = []

    for (const c of positiveContribs) {
      if (c.amount > previousLevel) {
        const contributionInLevel = Math.min(c.amount - previousLevel, levelDelta)
        potAmount += contributionInLevel
        if (!c.folded && c.amount >= level) {
          eligiblePlayerIds.push(c.id)
        }
      }
    }

    if (potAmount > 0 && eligiblePlayerIds.length > 0) {
      const potName = i === 0 ? "Pote Principal" : `Side Pot ${i}`
      pots.push({
        name: potName,
        amount: potAmount,
        eligiblePlayerIds,
      })
    } else if (potAmount > 0 && pots.length > 0) {
      // Folded players contributed extra chips above last active level -> add to latest pot
      pots[pots.length - 1].amount += potAmount
    }

    previousLevel = level
  }

  return pots
}

// ---------- 4. ESTADO E INICIALIZAÇÃO DE MÃO ----------

export interface NewGameOptions {
  players: { id: string; name: string; chips: number; isBot?: boolean }[]
  smallBlindAmount?: number
  bigBlindAmount?: number
  dealerIndex?: number
  fakeDeck?: Card[]
}

export function startNewHand(
  options: NewGameOptions,
  previousState?: PokerState,
): PokerState {
  const smallBlindAmount = options.smallBlindAmount ?? 10
  const bigBlindAmount = options.bigBlindAmount ?? 20
  const rawDeck = createDeck()
  const deck = shuffleDeck(rawDeck, options.fakeDeck)

  // Position calculation
  let dealerIndex = options.dealerIndex ?? 0
  if (previousState) {
    dealerIndex = (previousState.dealerIndex + 1) % options.players.length
  }

  const numPlayers = options.players.length
  const isHeadsUp = numPlayers === 2

  let smallBlindIndex: number
  let bigBlindIndex: number
  let currentTurnIndex: number

  if (isHeadsUp) {
    // Heads-up rule: Dealer is Small Blind and acts first Pre-Flop.
    smallBlindIndex = dealerIndex
    bigBlindIndex = (dealerIndex + 1) % numPlayers
    currentTurnIndex = smallBlindIndex
  } else {
    // 3+ players: Dealer -> SB -> BB -> UTG (first to act pre-flop)
    smallBlindIndex = (dealerIndex + 1) % numPlayers
    bigBlindIndex = (dealerIndex + 2) % numPlayers
    currentTurnIndex = (bigBlindIndex + 1) % numPlayers
  }

  const playersState: PlayerState[] = options.players.map((p, idx) => ({
    id: p.id,
    name: p.name,
    chips: p.chips,
    holeCards: [],
    folded: p.chips <= 0,
    isAllIn: false,
    totalHandContribution: 0,
    currentRoundContribution: 0,
    isDealer: idx === dealerIndex,
    isSmallBlind: idx === smallBlindIndex,
    isBigBlind: idx === bigBlindIndex,
    isBot: p.isBot,
  }))

  const actionHistory: ActionLog[] = []

  // Deal 2 hole cards to each player
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < numPlayers; i++) {
      if (!playersState[i].folded) {
        const card = deck.pop()!
        playersState[i].holeCards.push(card)
      }
    }
  }

  // Post blinds
  const sbPlayer = playersState[smallBlindIndex]
  const sbPaid = Math.min(sbPlayer.chips, smallBlindAmount)
  sbPlayer.chips -= sbPaid
  sbPlayer.currentRoundContribution = sbPaid
  sbPlayer.totalHandContribution = sbPaid
  if (sbPlayer.chips === 0) sbPlayer.isAllIn = true

  actionHistory.push({
    timestamp: Date.now(),
    playerId: sbPlayer.id,
    playerName: sbPlayer.name,
    action: "POST_SB",
    amount: sbPaid,
    round: "PRE_FLOP",
  })

  const bbPlayer = playersState[bigBlindIndex]
  const bbPaid = Math.min(bbPlayer.chips, bigBlindAmount)
  bbPlayer.chips -= bbPaid
  bbPlayer.currentRoundContribution = bbPaid
  bbPlayer.totalHandContribution = bbPaid
  if (bbPlayer.chips === 0) bbPlayer.isAllIn = true

  actionHistory.push({
    timestamp: Date.now(),
    playerId: bbPlayer.id,
    playerName: bbPlayer.name,
    action: "POST_BB",
    amount: bbPaid,
    round: "PRE_FLOP",
  })

  const currentBet = Math.max(sbPaid, bbPaid)
  const minimumRaise = bigBlindAmount

  const pots = calculatePots(playersState)

  return {
    players: playersState,
    deck,
    communityCards: [],
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex,
    currentTurnIndex,
    round: "PRE_FLOP",
    smallBlindAmount,
    bigBlindAmount,
    currentBet,
    minimumRaise,
    lastRaiseAmount: bigBlindAmount,
    pots,
    actionHistory,
    isHandComplete: false,
  }
}

// ---------- 5. VALIDAÇÃO DE AÇÕES ----------

export function getValidActions(
  state: PokerState,
  playerId: string,
): ValidActions {
  const playerIndex = state.players.findIndex((p) => p.id === playerId)
  if (
    playerIndex === -1 ||
    playerIndex !== state.currentTurnIndex ||
    state.isHandComplete ||
    state.round === "SHOWDOWN"
  ) {
    return {
      canFold: false,
      canCheck: false,
      canCall: false,
      callAmount: 0,
      canBet: false,
      minBet: 0,
      maxBet: 0,
      canRaise: false,
      minRaiseTo: 0,
      maxRaiseTo: 0,
      canAllIn: false,
      allInAmount: 0,
    }
  }

  const player = state.players[playerIndex]
  if (player.folded || player.isAllIn) {
    return {
      canFold: false,
      canCheck: false,
      canCall: false,
      callAmount: 0,
      canBet: false,
      minBet: 0,
      maxBet: 0,
      canRaise: false,
      minRaiseTo: 0,
      maxRaiseTo: 0,
      canAllIn: false,
      allInAmount: 0,
    }
  }

  const amountToCall = state.currentBet - player.currentRoundContribution
  const canCheck = amountToCall === 0
  const canFold = true

  const canCall = amountToCall > 0 && player.chips > 0
  const callAmount = Math.min(amountToCall, player.chips)

  let canBet = false
  let minBet = 0
  let maxBet = 0

  let canRaise = false
  let minRaiseTo = 0
  let maxRaiseTo = 0

  if (state.currentBet === 0) {
    // Bet scenario (no current bet in round)
    if (player.chips > 0) {
      canBet = true
      minBet = Math.min(state.bigBlindAmount, player.chips)
      maxBet = player.chips
    }
  } else {
    // Raise scenario
    const minRaiseTarget = state.currentBet + state.minimumRaise
    if (player.chips + player.currentRoundContribution > state.currentBet) {
      canRaise = true
      minRaiseTo = Math.min(
        minRaiseTarget,
        player.chips + player.currentRoundContribution,
      )
      maxRaiseTo = player.chips + player.currentRoundContribution
    }
  }

  const canAllIn = player.chips > 0
  const allInAmount = player.chips

  return {
    canFold,
    canCheck,
    canCall,
    callAmount,
    canBet,
    minBet,
    maxBet,
    canRaise,
    minRaiseTo,
    maxRaiseTo,
    canAllIn,
    allInAmount,
  }
}

// ---------- 6. TRANSIÇÕES DE AÇÕES E RODADAS ----------

export function processPlayerAction(
  state: PokerState,
  playerId: string,
  action: ActionType,
  raiseAmountTo?: number,
): PokerState {
  const valid = getValidActions(state, playerId)
  const playerIndex = state.players.findIndex((p) => p.id === playerId)

  if (playerIndex === -1 || playerIndex !== state.currentTurnIndex) {
    throw new Error("É a vez de outro jogador")
  }

  const nextState = JSON.parse(JSON.stringify(state)) as PokerState
  const player = nextState.players[playerIndex]
  const history = nextState.actionHistory

  switch (action) {
    case "fold": {
      if (!valid.canFold) throw new Error("Ação de Fold inválida")
      player.folded = true
      history.push({
        timestamp: Date.now(),
        playerId: player.id,
        playerName: player.name,
        action: "FOLD",
        round: nextState.round,
      })
      break
    }
    case "check": {
      if (!valid.canCheck) throw new Error("Não é possível dar Check")
      history.push({
        timestamp: Date.now(),
        playerId: player.id,
        playerName: player.name,
        action: "CHECK",
        round: nextState.round,
      })
      break
    }
    case "call": {
      if (!valid.canCall) throw new Error("Não é possível dar Call")
      const needed = valid.callAmount
      player.chips -= needed
      player.currentRoundContribution += needed
      player.totalHandContribution += needed
      if (player.chips === 0) player.isAllIn = true

      history.push({
        timestamp: Date.now(),
        playerId: player.id,
        playerName: player.name,
        action: "CALL",
        amount: needed,
        round: nextState.round,
      })
      break
    }
    case "bet": {
      if (!valid.canBet) throw new Error("Não é possível dar Bet")
      const betVal = Math.min(
        Math.max(raiseAmountTo || valid.minBet, valid.minBet),
        valid.maxBet,
      )
      player.chips -= betVal
      player.currentRoundContribution += betVal
      player.totalHandContribution += betVal
      if (player.chips === 0) player.isAllIn = true

      nextState.currentBet = betVal
      nextState.minimumRaise = betVal
      nextState.lastRaiseAmount = betVal

      history.push({
        timestamp: Date.now(),
        playerId: player.id,
        playerName: player.name,
        action: "BET",
        amount: betVal,
        round: nextState.round,
      })
      break
    }
    case "raise": {
      if (!valid.canRaise) throw new Error("Não é possível dar Raise")
      const targetBet = Math.min(
        Math.max(raiseAmountTo || valid.minRaiseTo, valid.minRaiseTo),
        valid.maxRaiseTo,
      )
      const addAmount = targetBet - player.currentRoundContribution
      player.chips -= addAmount
      player.currentRoundContribution = targetBet
      player.totalHandContribution += addAmount
      if (player.chips === 0) player.isAllIn = true

      const raiseDiff = targetBet - nextState.currentBet
      nextState.minimumRaise = Math.max(raiseDiff, nextState.minimumRaise)
      nextState.lastRaiseAmount = raiseDiff
      nextState.currentBet = targetBet

      history.push({
        timestamp: Date.now(),
        playerId: player.id,
        playerName: player.name,
        action: "RAISE",
        amount: targetBet,
        round: nextState.round,
      })
      break
    }
    case "all_in": {
      if (!valid.canAllIn) throw new Error("Não é possível dar All-In")
      const allInVal = player.chips
      const newContrib = player.currentRoundContribution + allInVal
      player.chips = 0
      player.totalHandContribution += allInVal
      player.currentRoundContribution = newContrib
      player.isAllIn = true

      if (newContrib > nextState.currentBet) {
        const raiseDiff = newContrib - nextState.currentBet
        nextState.minimumRaise = Math.max(raiseDiff, nextState.minimumRaise)
        nextState.currentBet = newContrib
      }

      history.push({
        timestamp: Date.now(),
        playerId: player.id,
        playerName: player.name,
        action: "ALL_IN",
        amount: allInVal,
        round: nextState.round,
      })
      break
    }
  }

  nextState.pots = calculatePots(nextState.players)

  // Check if hand ends immediately due to folds
  const activeUnfolded = nextState.players.filter((p) => !p.folded)
  if (activeUnfolded.length === 1) {
    return resolveWinByFold(nextState, activeUnfolded[0])
  }

  // Check if round complete
  if (isRoundComplete(nextState)) {
    return advanceBettingRound(nextState)
  }

  // Advance turn to next active player
  nextState.currentTurnIndex = getNextActivePlayerIndex(
    nextState.players,
    nextState.currentTurnIndex,
  )

  return nextState
}

export function isRoundComplete(state: PokerState): boolean {
  const activePlayers = state.players.filter((p) => !p.folded)
  // Non-all-in players must match currentBet
  const nonAllIn = activePlayers.filter((p) => !p.isAllIn)

  if (nonAllIn.length <= 1) {
    // If 0 or 1 player non-all-in, everyone else is all-in or folded.
    // Ensure that if 1 non-all-in player remains, they matched currentBet or everyone else folded
    if (nonAllIn.length === 1) {
      const p = nonAllIn[0]
      if (p.currentRoundContribution < state.currentBet && p.chips > 0) {
        return false
      }
    }
    // Check if everyone acted at least once in current round
    const actionsInRound = state.actionHistory.filter(
      (a) => a.round === state.round && a.action !== "POST_SB" && a.action !== "POST_BB",
    )
    if (actionsInRound.length < activePlayers.length) {
      // Must give turn to players who haven't acted yet
      const playersWhoActed = new Set(actionsInRound.map((a) => a.playerId))
      const pendingPlayers = activePlayers.filter(
        (p) => !p.isAllIn && !playersWhoActed.has(p.id),
      )
      if (pendingPlayers.length > 0) return false
    }
    return true
  }

  // All non-allin players must have equal contributions to currentBet
  const allEqual = nonAllIn.every(
    (p) => p.currentRoundContribution === state.currentBet,
  )

  // Each non-allin player must have acted in this round after the last bet/raise
  const lastAggressiveAction = [...state.actionHistory]
    .reverse()
    .find(
      (a) =>
        a.round === state.round &&
        (a.action === "BET" || a.action === "RAISE" || a.action === "ALL_IN"),
    )

  if (!lastAggressiveAction) {
    // Check if everyone checked or acted
    const actionsInRound = state.actionHistory.filter(
      (a) => a.round === state.round && a.action !== "POST_SB" && a.action !== "POST_BB",
    )
    const playersWhoActed = new Set(actionsInRound.map((a) => a.playerId))
    const allActed = nonAllIn.every((p) => playersWhoActed.has(p.id))
    return allEqual && allActed
  }

  // Check actions taken AFTER the last aggressive action
  const actionsAfterLastAggro = state.actionHistory.slice(
    state.actionHistory.indexOf(lastAggressiveAction) + 1,
  )
  const playersWhoResponded = new Set(
    actionsAfterLastAggro.map((a) => a.playerId),
  )

  const allResponded = nonAllIn.every(
    (p) =>
      p.id === lastAggressiveAction.playerId || playersWhoResponded.has(p.id),
  )

  return allEqual && allResponded
}

export function getNextActivePlayerIndex(
  players: PlayerState[],
  fromIndex: number,
): number {
  const count = players.length
  let curr = (fromIndex + 1) % count
  for (let i = 0; i < count; i++) {
    if (!players[curr].folded && !players[curr].isAllIn) {
      return curr
    }
    curr = (curr + 1) % count
  }
  return fromIndex
}

// ---------- 7. AVANÇO DE RODADAS E SHOWDOWN ----------

export function advanceBettingRound(state: PokerState): PokerState {
  const nextState = JSON.parse(JSON.stringify(state)) as PokerState

  // Reset current round contributions
  for (const p of nextState.players) {
    p.currentRoundContribution = 0
  }
  nextState.currentBet = 0
  nextState.minimumRaise = nextState.bigBlindAmount
  nextState.lastRaiseAmount = 0

  const activePlayers = nextState.players.filter((p) => !p.folded)
  const nonAllIn = activePlayers.filter((p) => !p.isAllIn)

  // Determine next round name & community cards
  switch (nextState.round) {
    case "PRE_FLOP": {
      nextState.round = "FLOP"
      // Deal 3 flop cards
      nextState.communityCards.push(
        nextState.deck.pop()!,
        nextState.deck.pop()!,
        nextState.deck.pop()!,
      )
      break
    }
    case "FLOP": {
      nextState.round = "TURN"
      // Deal 1 turn card
      nextState.communityCards.push(nextState.deck.pop()!)
      break
    }
    case "TURN": {
      nextState.round = "RIVER"
      // Deal 1 river card
      nextState.communityCards.push(nextState.deck.pop()!)
      break
    }
    case "RIVER": {
      nextState.round = "SHOWDOWN"
      return resolveShowdown(nextState)
    }
  }

  // If 0 or 1 non-all-in player remains active, automatically reveal remaining community cards and go to Showdown
  if (nonAllIn.length <= 1) {
    while (nextState.communityCards.length < 5) {
      nextState.communityCards.push(nextState.deck.pop()!)
    }
    nextState.round = "SHOWDOWN"
    return resolveShowdown(nextState)
  }

  // Set turn to first active non-allin player left of Dealer button
  nextState.currentTurnIndex = getFirstActivePlayerLeftOfDealer(
    nextState.players,
    nextState.dealerIndex,
  )

  return nextState
}

function getFirstActivePlayerLeftOfDealer(
  players: PlayerState[],
  dealerIndex: number,
): number {
  const count = players.length
  let curr = (dealerIndex + 1) % count
  for (let i = 0; i < count; i++) {
    if (!players[curr].folded && !players[curr].isAllIn) {
      return curr
    }
    curr = (curr + 1) % count
  }
  return dealerIndex
}

// ---------- 8. RESOLUÇÃO DE VITÓRIA E SHOWDOWN ----------

function resolveWinByFold(state: PokerState, winner: PlayerState): PokerState {
  const totalPot = state.pots.reduce((sum, p) => sum + p.amount, 0)
  winner.chips += totalPot
  state.isHandComplete = true
  state.round = "SHOWDOWN"
  state.handWinnerMessage = `${winner.name} venceu R$${(totalPot / 100).toFixed(2)} (todos deram Fold)`
  return state
}

export function resolveShowdown(state: PokerState): PokerState {
  const nextState = JSON.parse(JSON.stringify(state)) as PokerState
  nextState.pots = calculatePots(nextState.players)

  const winnerSummary: string[] = []

  // Evaluate hands for all non-folded players
  const playerEvals: Record<string, HandEvaluation> = {}
  for (const p of nextState.players) {
    if (!p.folded) {
      playerEvals[p.id] = evaluateBest7CardHand([
        ...p.holeCards,
        ...nextState.communityCards,
      ])
    }
  }

  // Process each pot independently (Main Pot, Side Pot 1, Side Pot 2...)
  for (const pot of nextState.pots) {
    const eligibleIds = pot.eligiblePlayerIds.filter(
      (id) => playerEvals[id] !== undefined,
    )
    if (eligibleIds.length === 0) continue

    // Find best evaluation score among eligible players
    let bestScoreEval: HandEvaluation | null = null
    for (const id of eligibleIds) {
      const ev = playerEvals[id]
      if (!bestScoreEval || compareEvaluations(ev, bestScoreEval) > 0) {
        bestScoreEval = ev
      }
    }

    // Winners of this pot
    const winners = eligibleIds.filter(
      (id) => compareEvaluations(playerEvals[id], bestScoreEval!) === 0,
    )

    const splitShare = Math.floor(pot.amount / winners.length)
    let remainder = pot.amount % winners.length

    // Deterministic odd chip allocation starting left of Dealer button
    const winnersOrdered = [...winners].sort((a, b) => {
      const idxA = nextState.players.findIndex((p) => p.id === a)
      const idxB = nextState.players.findIndex((p) => p.id === b)
      const distA =
        (idxA - nextState.dealerIndex + nextState.players.length) %
        nextState.players.length
      const distB =
        (idxB - nextState.dealerIndex + nextState.players.length) %
        nextState.players.length
      return distA - distB
    })

    pot.winners = []

    for (const winnerId of winnersOrdered) {
      const extra = remainder > 0 ? 1 : 0
      if (remainder > 0) remainder--

      const award = splitShare + extra
      const p = nextState.players.find((pl) => pl.id === winnerId)!
      p.chips += award

      const ev = playerEvals[winnerId]
      pot.winners.push({
        playerId: winnerId,
        amount: award,
        handName: ev.name,
      })

      winnerSummary.push(
        `${p.name} ganhou R$${(award / 100).toFixed(2)} no ${pot.name} com ${ev.name}`,
      )
    }
  }

  nextState.isHandComplete = true
  nextState.handWinnerMessage = winnerSummary.join(" | ")
  return nextState
}

// ---------- 9. BOT LOGIC (PARA MODAL LOCAL) ----------

export function getBotAction(
  state: PokerState,
  botId: string,
): { action: ActionType; amount?: number } {
  const valid = getValidActions(state, botId)
  if (!valid.canCheck && !valid.canCall && !valid.canBet && !valid.canRaise) {
    return { action: "fold" }
  }

  const bot = state.players.find((p) => p.id === botId)!
  const handEval =
    bot.holeCards.length === 2 && state.communityCards.length >= 3
      ? evaluateBest7CardHand([...bot.holeCards, ...state.communityCards])
      : null

  // Simple heuristic bot for classroom educational simulation
  if (handEval && handEval.category >= HandCategory.TWO_PAIR) {
    if (valid.canRaise) {
      return { action: "raise", amount: valid.minRaiseTo }
    }
    if (valid.canBet) {
      return { action: "bet", amount: valid.minBet }
    }
  }

  if (valid.canCheck) {
    return { action: "check" }
  }

  if (valid.canCall) {
    // Call if small bet, otherwise 50% chance fold/call
    if (valid.callAmount <= state.bigBlindAmount * 2) {
      return { action: "call" }
    }
    return Math.random() > 0.5 ? { action: "call" } : { action: "fold" }
  }

  return { action: "fold" }
}
