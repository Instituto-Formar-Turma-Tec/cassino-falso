'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatBRL } from '@/lib/utils-data';

interface Props {
  onPlay: () => void;
  busy: boolean;
  balance: number;
  onWin?: () => void;
  onLoss?: () => void;
}

const SYMBOLS = ['7', 'BAR', '★', '💎', '🔔', '🍒', '💰', '🎰'];
const WIN_SYMBOLS = ['7', '★', '💎'];

export default function GameSlot({ onPlay, busy, balance, onWin, onLoss }: Props) {
  const [displaySymbols, setDisplaySymbols] = useState(SYMBOLS.slice(0, 3));
  const [rolling, setRolling] = useState(false);
  const [nearMiss, setNearMiss] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleSpin = useCallback(() => {
    if (busy || balance < 10) return;
    setRolling(true);
    setNearMiss(false);
    let count = 0;
    intervalRef.current = setInterval(() => {
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      setDisplaySymbols([
        sym,
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      count++;
      if (count > 15) {
        clearInterval(intervalRef.current!);
        setRolling(false);
        setTimeout(() => onPlay(), 600);
      }
    }, 80);
  }, [busy, balance, onPlay]);

  return (
    <div className="flex flex-col items-center gap-4 py-6 w-full">
      <p className="text-xs text-muted-foreground font-mono">
        Aposta: {formatBRL(1000)} por giro
      </p>
      <div className="flex gap-3 justify-center">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`slot-display w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-black border-2 border-gold/50 flex items-center justify-center overflow-hidden ${
              nearMiss ? 'border-red-500' : ''
            }`}
          >
            <span
              className={`font-mono text-3xl sm:text-4xl font-bold ${
                nearMiss ? 'neon-red' : 'text-gold'
              } ${rolling ? 'slot-rolling' : ''}`}
            >
              {displaySymbols[i] || '?'}
            </span>
          </div>
        ))}
      </div>

      {nearMiss && (
        <p className="text-center text-red-400 text-sm font-mono animate-pulse">
          Por pouco! A banca sentiu o cheiro...
        </p>
      )}

      <button
        onClick={handleSpin}
        disabled={busy || balance < 10}
        className="bet-btn w-full max-w-xs py-4 text-lg"
      >
        {busy ? '🎰 Girando…' : '🎰 GIRAR'}
      </button>

      {/* Paytable */}
      <div className="w-full max-w-xs mt-4">
        <p className="text-center text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">Pagamentos (2.2×)</p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-[var(--surface)] border border-gold/20 rounded-lg p-2">
            <p className="font-mono text-gold">7 7 7</p>
            <p className="text-green-400">2.2×</p>
          </div>
          <div className="bg-[var(--surface)] border border-gold/20 rounded-lg p-2">
            <p className="font-mono text-gold">★ ★ ★</p>
            <p className="text-green-400">2.2×</p>
          </div>
          <div className="bg-[var(--surface)] border border-gold/20 rounded-lg p-2">
            <p className="font-mono text-gold">BAR BAR</p>
            <p className="text-green-400">2.2×</p>
          </div>
        </div>
      </div>
    </div>
  );
}