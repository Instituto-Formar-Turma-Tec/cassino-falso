'use client';

import { useState } from 'react';
import { ArrowRight, Coins, Heart, Zap, Target, Shield } from 'lucide-react';
import { formatBRL } from '@/lib/utils-data';
import { GAMES } from '@/lib/utils-data';
import { GameAnimation } from '@/components/layout/GameAnimation';
import { getGameAnimation } from '@/lib/gameIcons';

interface GameSelectionProps {
  snapshot: {
    balance: number;
    totalLost: number;
    rounds: number;
    riskScore: number;
  } | null;
  onGameSelect: (gameId: string) => void;
  onLogout: () => void;
}

export function GameSelection({ snapshot, onGameSelect, onLogout }: GameSelectionProps) {
  const [pressedGame, setPressedGame] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gold/30 bg-card/95 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="gold-sheen grid size-9 place-items-center rounded-lg overflow-hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check text-gold" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
            <span className="font-mono text-sm font-bold tracking-wider text-gold neon-text">
              CASSINO REVERSO
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-red-400 text-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" x2="9" y1="12" y2="12"></line>
            </svg>
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="stat-card bg-[var(--surface)] border border-gold/30 rounded-xl p-4">
            <Coins className="mx-auto mb-1" size={18} color="var(--gold)" />
            <p className="stat-label text-xs text-muted-foreground text-center">Saldo</p>
            <p className="stat-value text-lg font-mono font-bold text-gold text-center">{formatBRL(snapshot?.balance || 0)}</p>
          </div>
          <div className="stat-card bg-[var(--surface)] border border-gold/30 rounded-xl p-4">
            <Heart className="mx-auto mb-1" size={18} color="var(--red)" />
            <p className="stat-label text-xs text-muted-foreground text-center">Perdido</p>
            <p className="stat-value text-lg font-mono font-bold text-red-400 text-center">{formatBRL(snapshot?.totalLost || 0)}</p>
          </div>
          <div className="stat-card bg-[var(--surface)] border border-gold/30 rounded-xl p-4">
            <Zap className="mx-auto mb-1" size={18} color="var(--gold)" />
            <p className="stat-label text-xs text-muted-foreground text-center">Rodadas</p>
            <p className="stat-value text-lg font-mono font-bold text-center">{snapshot?.rounds || 0}</p>
          </div>
          <div className="stat-card bg-[var(--surface)] border border-gold/30 rounded-xl p-4">
            <Target className="mx-auto mb-1" size={18} color="var(--gold)" />
            <p className="stat-label text-xs text-muted-foreground text-center">Risco</p>
            <p className="stat-value text-lg font-mono font-bold text-center">{snapshot?.riskScore || 0}/100</p>
          </div>
        </div>

        {/* Banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm">
          <Shield size={18} className="shrink-0 text-gold" />
          <span>
            <strong className="text-gold">A casa sempre lucra.</strong>{' '}
            Sua missão: sobreviver o máximo possível.
          </span>
        </div>

        {/* Hero */}
        <div className="mb-6 text-center">
          <p className="eyebrow text-xs font-mono text-gold uppercase tracking-wider">Selecione um jogo</p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-balance neon-text">
            Quem perde menos, ganha.
          </h1>
          <p className="mt-1 text-muted-foreground text-sm max-w-xs mx-auto">
            Escolha seu jogo. A aposta é por rodada. O saldo é sua pontuação.
          </p>
        </div>

        {/* Jogos Grid */}
        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => onGameSelect(game.id)}
              onMouseDown={() => setPressedGame(game.id)}
              onMouseUp={() => setPressedGame(null)}
              onMouseLeave={() => setPressedGame(null)}
              onTouchStart={() => setPressedGame(game.id)}
              onTouchEnd={() => setPressedGame(null)}
              className={`game-selection-card relative group bg-[var(--surface)] border border-gold/30 rounded-2xl p-4 overflow-hidden transition-all ${
                pressedGame === game.id ? 'scale-95 border-gold' : ''
              }`}
            >
              {/* Edge indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-green-500 opacity-60" />
              
              <div className="relative z-10">
                <div className="mb-3 flex items-center justify-center">
                  <GameAnimation
                    animation={getGameAnimation(game.id)}
                    size={80}
                  />
                </div>
                <h3 className="font-serif text-lg font-bold text-gold mt-2 text-center">{game.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 text-center">{game.desc}</p>
                
                {/* Edge visual indicator */}
                <div className="mb-3">
                  <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                    <span className="text-red-400">Casa</span>
                    <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500" />
                    </div>
                    <span className="text-green-400">Você</span>
                  </div>
                </div>

                <div className="gold-sheen w-full py-3 rounded-lg font-mono font-bold text-white text-sm flex items-center justify-center gap-2">
                  <ArrowRight size={14} />
                  JOGAR
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Server status */}
        <div className="mt-8 flex self-start items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity text-emerald" aria-hidden="true">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <span className="font-mono text-xs text-emerald">SERVIDOR ONLINE</span>
        </div>
      </main>
    </div>
  );
}