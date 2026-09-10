import { randomInt } from 'crypto';
import { supabase } from './supabase';

export const STARTING_BALANCE = 100000;
export const ANIMALS = ['Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro', 'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho'];

export function centsToBRL(cents: number) { return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

export async function snapshot(userId: string) {
  const { data, error } = await supabase.rpc('obter_snapshot', { p_user_id: userId });
  if (error || !data) throw new Error(error?.message || 'Falha ao obter snapshot.');
  return data;
}

// Resolve a aposta de forma atômica no Postgres e retorna o novo snapshot.
async function transact(userId: string, game: string, bet: number, outcome: string, multiplier: number) {
  const { data, error } = await supabase.rpc('resolver_jogada', {
    p_user_id: userId,
    p_jogo: game,
    p_aposta_centavos: bet,
    p_resultado: outcome,
    p_multiplicador: multiplier,
  });
  if (error || !data) throw new Error(error?.message || 'Falha ao resolver aposta.');
  return data;
}

// === SLOT ===
export async function playSlot(userId: string, bet: number) {
  const win = randomInt(100) < 18;
  const outcome = win ? ['7', 'BAR', '★'][randomInt(3)] : ['·', '×', '○'][randomInt(3)];
  const snapshotRes = await transact(userId, 'slot', bet, outcome, win ? 2.2 : 0);
  return { outcome, won: win, multiplier: win ? 2.2 : 0, snapshot: snapshotRes };
}

// === ANIMAL ===
export async function playAnimal(userId: string, bet: number, animal: string) {
  const won = randomInt(100) < 68;
  const snapshotRes = await transact(userId, 'bicho', bet, won ? `Acertou: ${animal}` : `Não saiu ${animal}`, won ? 1.35 : 0);
  return { animal, won, multiplier: won ? 1.35 : 0, snapshot: snapshotRes };
}

// === TABULEIRO DE DADOS ===
export async function playBoard(userId: string, bet: number) {
  const roll = randomInt(1, 7);
  const negative = randomInt(100) < 70;
  const snapshotRes = await transact(userId, 'tabuleiro', bet, `Dado ${roll}`, 0);
  return { roll, event: negative ? 'Casa de perda: a banca absorve sua aposta.' : 'Casa neutra: você observa o resultado.', multiplier: 0, snapshot: snapshotRes };
}

// === ROLETA ===
export async function playRoulette(userId: string, bet: number, betType: 'numero' | 'par' | 'impar' | 'vermelho' | 'preto', value?: number) {
  const result = randomInt(0, 37); // 0-36
  const isVermelho = result !== 0 && [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(result);
  const isPar = result !== 0 && result % 2 === 0;
  let won = false;
  let multiplier = 0;
  let outcomeText = '';

  switch (betType) {
    case 'numero':
      won = result === value!;
      multiplier = won ? 35 : 0;
      outcomeText = won ? `Número ${result} — ACERTOU!` : `Número sorteado: ${result}`;
      break;
    case 'par':
      won = isPar;
      multiplier = won ? 1 : 0;
      outcomeText = won ? `${result} é PAR — GANHOU` : `${result} é ÍMPAR — PERDEU`;
      break;
    case 'impar':
      won = !isPar && result !== 0;
      multiplier = won ? 1 : 0;
      outcomeText = won ? `${result} é ÍMPAR — GANHOU` : `${result} é PAR — PERDEU`;
      break;
    case 'vermelho':
      won = isVermelho;
      multiplier = won ? 1 : 0;
      outcomeText = won ? `${result} VERMELHO — GANHOU` : `${result} PRETO — PERDEU`;
      break;
    case 'preto':
      won = !isVermelho && result !== 0;
      multiplier = won ? 1 : 0;
      outcomeText = won ? `${result} PRETO — GANHOU` : `${result} VERMELHO — PERDEU`;
      break;
  }

  if (result === 0) {
    won = false;
    multiplier = 0;
    outcomeText = 'ZERO! A casa pega tudo.';
  }

  const snapshotRes = await transact(userId, 'roleta', bet, outcomeText, multiplier);
  return { result, won, betType, multiplier, outcomeText, snapshot: snapshotRes };
}

// === BLACKJACK ===
export async function playBlackjack(userId: string, bet: number) {
  // Simulação simplificada: casa tem 55% de vitória, empate 8%, jogador 37%
  const roll = randomInt(1, 100);
  let outcome: 'win' | 'lose' | 'push' = 'lose';
  let multiplier = 0;
  let dealerScore = randomInt(17, 22);
  let playerScore = randomInt(14, 21);
  let resultText = '';

  if (roll < 8) {
    outcome = 'push';
    multiplier = 0;
    playerScore = dealerScore;
    resultText = `Empate! Ambos com ${dealerScore} pontos. Sua aposta volta ao jogador.`;
  } else if (roll < 45) {
    outcome = 'win';
    multiplier = 1.5;
    resultText = `VOCÊ GANHOU! ${playerScore} vs ${dealerScore} da banca. Lucro: R$ ${Math.round(bet * 1.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  } else {
    outcome = 'lose';
    multiplier = 0;
    resultText = `A BANCA VENCEU! ${playerScore} vs ${dealerScore} deles. Você perdeu R$ ${bet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  }

  if (playerScore === 21 && outcome !== 'push') {
    outcome = 'win';
    multiplier = 3;
    resultText = `BLACKJACK! 21 exato! Pagamento 3x! Lucro: R$ ${Math.round(bet * 3).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
  }

  const snapshotRes = await transact(userId, 'blackjack', bet, resultText, multiplier);
  return { playerScore, dealerScore, outcome, multiplier, resultText, snapshot: snapshotRes };
}

// === PÔKER (Texas Hold'em simplificado — 5 cards, ranking) ===
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANK_VALUES: Record<string, number> = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

function createDeck(): Array<{ rank: string; suit: string; value: number }> {
  const deck: Array<{ rank: string; suit: string; value: number }> = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit, value: RANK_VALUES[rank] });
    }
  }
  return deck;
}

function shuffleDeck(deck: Array<{ rank: string; suit: string; value: number }>): Array<{ rank: string; suit: string; value: number }> {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function handRank(cards: Array<{ rank: string; suit: string; value: number }>): { rank: number; name: string; highCard: number } {
  const values = cards.map(c => c.value).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([val, count]) => ({ val: +val, count }))
    .sort((a, b) => b.count - a.count || b.val - a.val);

  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;
  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      isStraight = true;
      straightHigh = uniqueValues[0];
    }
    if (uniqueValues[0] === 14 && uniqueValues[1] === 5 && uniqueValues[2] === 4 && uniqueValues[3] === 3 && uniqueValues[4] === 2) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: 9, name: 'Royal Flush', highCard: straightHigh };
  }
  if (isFlush && isStraight) {
    return { rank: 8, name: 'Straight Flush', highCard: straightHigh };
  }
  if (groups.length === 2 && groups[0].count === 4) {
    return { rank: 7, name: 'Four of a Kind', highCard: groups[0].val };
  }
  if (groups.length === 2 && groups[0].count === 3 && groups[1].count === 2) {
    return { rank: 6, name: 'Full House', highCard: groups[0].val };
  }
  if (isFlush) {
    return { rank: 5, name: 'Flush', highCard: values[0] };
  }
  if (isStraight) {
    return { rank: 4, name: 'Straight', highCard: straightHigh };
  }
  if (groups.length === 3 && groups[0].count === 3) {
    return { rank: 3, name: 'Three of a Kind', highCard: groups[0].val };
  }
  if (groups.length === 3 && groups[0].count === 2 && groups[1].count === 2) {
    return { rank: 2, name: 'Two Pair', highCard: Math.max(groups[0].val, groups[1].val) };
  }
  if (groups.length === 4 && groups[0].count === 2) {
    return { rank: 1, name: 'Pair', highCard: groups[0].val };
  }
  return { rank: 0, name: 'High Card', highCard: values[0] };
}

export async function playPoker(userId: string, bet: number) {
  let deck = shuffleDeck(createDeck());
  const holeCards = [deck.pop()!, deck.pop()!];
  const community = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];
  const playerHand = [...holeCards, ...community];
  const dealerHand = [deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!, deck.pop()!];

  const playerRank = handRank(playerHand);
  const dealerRank = handRank(dealerHand);

  let outcome: 'win' | 'lose' | 'push' = 'lose';
  let multiplier = 0;
  let resultText = '';

  if (playerRank.rank > dealerRank.rank) {
    const payoutMultipliers: Record<number, number> = { 9: 50, 8: 25, 7: 10, 6: 5, 5: 3, 4: 2, 3: 1.5, 2: 1, 1: 0.5 };
    multiplier = payoutMultipliers[playerRank.rank] || 1;
    outcome = 'win';
    resultText = `SUA MÃO: ${playerRank.name}! A banca tem apenas ${dealerRank.name}. GANHOU! Multiplicador: ${multiplier}x`;
  } else if (playerRank.rank < dealerRank.rank) {
    outcome = 'lose';
    multiplier = 0;
    resultText = `A banca tem ${dealerRank.name}, você tem ${playerRank.name}. PERDEU.`;
  } else {
    outcome = 'push';
    multiplier = 0;
    resultText = `Empate! Ambos com ${playerRank.name}. Sua aposta volta.`;
  }

  if (playerRank.rank === 9) {
    multiplier = 50;
    resultText = `ROYAL STRAIGHT FLUSH! É IMPOSSÍVEL! Pagamento 50x!`;
  }

  const snapshotRes = await transact(userId, 'poker', bet, resultText, multiplier);
  return {
    holeCards, community, dealerHand, playerRank, dealerRank,
    won: outcome === 'win', multiplier,
    outcomeText: resultText,
    snapshot: snapshotRes
  };
}

export async function leaderboard() {
  const { data, error } = await supabase
    .from('users')
    .select('nome, matricula, saldo_centavos, rodadas_jogadas, total_perdido_centavos')
    .order('saldo_centavos', { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  // mapear para os nomes consumidos pelo frontend (balance/rounds/lost)
  return (data || []).map((u: any) => ({
    nome: u.nome,
    matricula: u.matricula,
    balance: u.saldo_centavos,
    rounds: u.rodadas_jogadas,
    lost: u.total_perdido_centavos,
  }));
}