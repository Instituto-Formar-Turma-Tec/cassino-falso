// ============================================================================
// CASSINO REVERSO - GAME ENGINE (SIMULADOR EDUCACIONAL DE APOSTAS)
// ============================================================================
// Este módulo encapsula a lógica dos jogos de azar.
// Requisitos pedagógicos (AGENTS.md):
// 1. RNG via Web Crypto API (crypto.getRandomValues).
// 2. Chance de vitória ~ 1/10 (10%) para demonstrar matematicamente a vantagem da casa.
// 3. Constantes nomeadas com RTP teórico.
// 4. Funções puras sem efeitos colaterais.
// ============================================================================

// Sorteia um inteiro aleatório no intervalo [0, max) usando Web Crypto API
export function randomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

// Sorteia true/false com probabilidade exata (0 a 1) usando Web Crypto API
export function sortear(chanceDeVitoria: number): boolean {
  return randomInt(1_000_000) < Math.round(chanceDeVitoria * 1_000_000);
}

export interface ResultadoJogo {
  venceu: boolean;
  multiplicador: number;
  saldoDelta: number; // em centavos (positivo em vitória, negativo em derrota)
  detalhesVisuais: Record<string, unknown>;
}

// Chance padrão de vitória solicitada: 1/10 (10%)
export const CHANCE_VITORIA_PADRAO = 0.10; // 1/10

// ---------- 1. Caça-Níquel (Slot Machine) ----------
export const SLOT_CHANCE_VITORIA = 0.10; // 1/10 (10%)
export const SLOT_MULTIPLICADOR_VITORIA = 2.5; // Paga 2.5x em vitória
// RTP teórico = 0.10 * 2.5 = 25.0%
export const SLOT_RTP_TEORICO = SLOT_CHANCE_VITORIA * SLOT_MULTIPLICADOR_VITORIA;

export const SIMBOLOS_SLOT = ["7️⃣", "💎", "🎰", "🍋", "🔔", "🍒"] as const;

export function jogarSlot(apostaEmCentavos: number): ResultadoJogo {
  const venceu = sortear(SLOT_CHANCE_VITORIA);
  const multiplicador = venceu ? SLOT_MULTIPLICADOR_VITORIA : 0;
  const saldoDelta = venceu
    ? Math.round(apostaEmCentavos * (SLOT_MULTIPLICADOR_VITORIA - 1))
    : -apostaEmCentavos;

  let rolos: string[];
  if (venceu) {
    const s = SIMBOLOS_SLOT[randomInt(SIMBOLOS_SLOT.length)];
    rolos = [s, s, s];
  } else {
    // Garante que pelo menos 1 rolo seja diferente para não formar trio em derrota
    const s1 = SIMBOLOS_SLOT[randomInt(SIMBOLOS_SLOT.length)];
    let s2 = SIMBOLOS_SLOT[randomInt(SIMBOLOS_SLOT.length)];
    let s3 = SIMBOLOS_SLOT[randomInt(SIMBOLOS_SLOT.length)];
    if (s1 === s2 && s2 === s3) {
      s3 = SIMBOLOS_SLOT[(SIMBOLOS_SLOT.indexOf(s3) + 1) % SIMBOLOS_SLOT.length];
    }
    rolos = [s1, s2, s3];
  }

  return {
    venceu,
    multiplicador,
    saldoDelta,
    detalhesVisuais: { rolos, chance: "1/10" },
  };
}

// ---------- 2. Jogo do Bicho ----------
export const BICHO_CHANCE_VITORIA = 0.10; // 1/10 (10%)
export const BICHO_MULTIPLICADOR_VITORIA = 2.0;
// RTP teórico = 0.10 * 2.0 = 20.0%
export const BICHO_RTP_TEORICO = BICHO_CHANCE_VITORIA * BICHO_MULTIPLICADOR_VITORIA;

export const ANIMAIS_BICHO = [
  "Avestruz", "Águia", "Burro", "Borboleta", "Cachorro",
  "Cabra", "Carneiro", "Camelo", "Cobra", "Coelho",
  "Cavalo", "Elefante", "Galo", "Gato", "Jacaré",
  "Leão", "Macaco", "Porco", "Pavão", "Peru",
  "Touro", "Tigre", "Urso", "Veado", "Vaca"
] as const;

export function jogarBicho(apostaEmCentavos: number, animalEscolhido?: string): ResultadoJogo {
  const escolha = animalEscolhido || ANIMAIS_BICHO[randomInt(ANIMAIS_BICHO.length)];
  const venceu = sortear(BICHO_CHANCE_VITORIA);
  const multiplicador = venceu ? BICHO_MULTIPLICADOR_VITORIA : 0;
  const saldoDelta = venceu
    ? Math.round(apostaEmCentavos * (BICHO_MULTIPLICADOR_VITORIA - 1))
    : -apostaEmCentavos;

  const animalSorteado = venceu
    ? escolha
    : ANIMAIS_BICHO.filter((a) => a !== escolha)[randomInt(ANIMAIS_BICHO.length - 1)];

  return {
    venceu,
    multiplicador,
    saldoDelta,
    detalhesVisuais: { animalEscolhido: escolha, animalSorteado, chance: "1/10" },
  };
}

// ---------- 3. Dados (Craps / Dice) ----------
export const DADOS_CHANCE_VITORIA = 0.10; // 1/10 (10%)
export const DADOS_MULTIPLICADOR_VITORIA = 2.0;
export const DADOS_RTP_TEORICO = DADOS_CHANCE_VITORIA * DADOS_MULTIPLICADOR_VITORIA; // 20%

export function jogarDados(apostaEmCentavos: number): ResultadoJogo {
  const venceu = sortear(DADOS_CHANCE_VITORIA);
  const multiplicador = venceu ? DADOS_MULTIPLICADOR_VITORIA : 0;
  const saldoDelta = venceu
    ? Math.round(apostaEmCentavos * (DADOS_MULTIPLICADOR_VITORIA - 1))
    : -apostaEmCentavos;

  let dado1: number, dado2: number;
  if (venceu) {
    // Vitória se soma for 7 ou 11
    dado1 = 3;
    dado2 = 4;
  } else {
    // Derrota: soma != 7 e != 11
    dado1 = randomInt(6) + 1;
    dado2 = randomInt(6) + 1;
    if (dado1 + dado2 === 7 || dado1 + dado2 === 11) {
      dado2 = (dado2 % 6) + 1;
    }
  }

  return {
    venceu,
    multiplicador,
    saldoDelta,
    detalhesVisuais: { dado1, dado2, soma: dado1 + dado2, chance: "1/10" },
  };
}

// ---------- 4. Roleta (Roulette) ----------
export const ROLETA_CHANCE_VITORIA = 0.10; // 1/10 (10%)
export const ROLETA_MULTIPLICADOR_VITORIA = 2.0;
export const ROLETA_RTP_TEORICO = ROLETA_CHANCE_VITORIA * ROLETA_MULTIPLICADOR_VITORIA; // 20%

export function jogarRoleta(apostaEmCentavos: number, apostaCor: "red" | "black" = "red"): ResultadoJogo {
  const venceu = sortear(ROLETA_CHANCE_VITORIA);
  const multiplicador = venceu ? ROLETA_MULTIPLICADOR_VITORIA : 0;
  const saldoDelta = venceu
    ? Math.round(apostaEmCentavos * (ROLETA_MULTIPLICADOR_VITORIA - 1))
    : -apostaEmCentavos;

  const numeroSorteado = venceu ? (apostaCor === "red" ? 1 : 2) : (apostaCor === "red" ? 2 : 1);
  const corSorteada = venceu ? apostaCor : (apostaCor === "red" ? "black" : "red");

  return {
    venceu,
    multiplicador,
    saldoDelta,
    detalhesVisuais: { numeroSorteado, corSorteada, apostaCor, chance: "1/10" },
  };
}

// ---------- 5. Blackjack ----------
export const BLACKJACK_CHANCE_VITORIA = 0.10; // 1/10 (10%)
export const BLACKJACK_MULTIPLICADOR_VITORIA = 2.0;
export const BLACKJACK_RTP_TEORICO = BLACKJACK_CHANCE_VITORIA * BLACKJACK_MULTIPLICADOR_VITORIA; // 20%

export function jogarBlackjack(apostaEmCentavos: number): ResultadoJogo {
  const venceu = sortear(BLACKJACK_CHANCE_VITORIA);
  const multiplicador = venceu ? BLACKJACK_MULTIPLICADOR_VITORIA : 0;
  const saldoDelta = venceu
    ? Math.round(apostaEmCentavos * (BLACKJACK_MULTIPLICADOR_VITORIA - 1))
    : -apostaEmCentavos;

  return {
    venceu,
    multiplicador,
    saldoDelta,
    detalhesVisuais: { chance: "1/10" },
  };
}

// ---------- 6. Pôquer (Poker) ----------
export const POKER_CHANCE_VITORIA = 0.10; // 1/10 (10%)
export const POKER_MULTIPLICADOR_VITORIA = 2.0;
export const POKER_RTP_TEORICO = POKER_CHANCE_VITORIA * POKER_MULTIPLICADOR_VITORIA; // 20%

export function jogarPokerSimples(apostaEmCentavos: number): ResultadoJogo {
  const venceu = sortear(POKER_CHANCE_VITORIA);
  const multiplicador = venceu ? POKER_MULTIPLICADOR_VITORIA : 0;
  const saldoDelta = venceu
    ? Math.round(apostaEmCentavos * (POKER_MULTIPLICADOR_VITORIA - 1))
    : -apostaEmCentavos;

  return {
    venceu,
    multiplicador,
    saldoDelta,
    detalhesVisuais: { chance: "1/10" },
  };
}

// ---------- Simulação Teórica vs Prática para Dashboard ----------
export function calcularRTPSimulado(
  jogarFn: (aposta: number) => ResultadoJogo,
  numRodadas: number,
  apostaEmCentavos = 1000
): number {
  let totalApostado = 0;
  let totalRetornado = 0;

  for (let i = 0; i < numRodadas; i++) {
    const resultado = jogarFn(apostaEmCentavos);
    totalApostado += apostaEmCentavos;
    totalRetornado += apostaEmCentavos + resultado.saldoDelta;
  }

  return totalApostado > 0 ? totalRetornado / totalApostado : 0;
}
