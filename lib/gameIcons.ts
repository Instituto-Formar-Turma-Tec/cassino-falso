'use client';

/* ============================================================
   gameIcons — módulo central dos ícones/animações dos jogos.
   Todos os jogos mapeiam aqui para a mídia (Lottie/vídeo) ou
   emoji fallback. Consumido por GameSelection (cards) e por
   qualquer outra tela que precise exibir o ícone do jogo.
   ============================================================ */

import diceRollJson from '@/public/games/Dice Roll.json';
import moneyCounterJson from '@/public/games/Money counter.json';
import pokerChipJson from '@/public/games/Poker Chip.json';

export type GameAnimationData =
  | { type: 'lottie'; data: object; title?: string }
  | { type: 'video'; src: string; title?: string }
  | { type: 'emoji'; emoji: string; title?: string };

// Constrói a src do vídeo de forma idêntica à usada originalmente
const slotVideoSrc = `/games/m%C3%A1quina%20ca%C3%A7a-n%C3%ADqueis.mp4`;

export const GAME_ANIMATIONS: Record<string, GameAnimationData> = {
  slot: { type: 'video', src: slotVideoSrc, title: 'Caça-Níquel' },
  board: { type: 'lottie', data: diceRollJson, title: 'Dados' },
  poker: { type: 'lottie', data: pokerChipJson, title: 'Pôquer' },
  animal: { type: 'lottie', data: moneyCounterJson, title: 'Jogo do Bicho' },
  roulette: { type: 'emoji', emoji: '🎠', title: 'Roleta' },
  blackjack: { type: 'emoji', emoji: '🃏', title: 'Blackjack' },
};

export function getGameAnimation(gameId: string): GameAnimationData {
  return GAME_ANIMATIONS[gameId] ?? { type: 'emoji', emoji: '🎮', title: gameId };
}