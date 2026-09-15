'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Coins, Heart, Zap, Target, Activity, LogOut, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { formatBRL } from '@/lib/utils-data';
import { GAMES, LIVE_MESSAGES } from '@/lib/utils-data';
import { TelaLogin } from '@/components/layout/TelaLogin';
import { GameSelection } from '@/components/layout/GameSelection';
import { BottomToolbar } from '@/components/layout/BottomToolbar';
import GameSlot from '@/components/games/GameSlot';
import GameBicho from '@/components/games/GameBicho';
import GameBoard from '@/components/games/GameBoard';
import GameRoulette from '@/components/games/GameRoulette';
import GameBlackjack from '@/components/games/GameBlackjack';
import GamePoker from '@/components/games/GamePoker';
import SurvivalChart from '@/components/charts/SurvivalChart';
import { useParticleEffects } from '@/hooks/useParticleEffects';

type Snapshot = {
  balance: number;
  totalLost: number;
  rounds: number;
  riskScore: number;
  recent: Array<{
    tipo_jogo: string;
    resultado: string;
    saldo_depois_centavos: number;
    multiplicador: number;
    aposta_centavos: number;
    criado_em: number;
  }>;
};

type Leader = {
  nome: string;
  matricula: string;
  balance: number;
  rounds: number;
  lost: number;
};

type View = 'login' | 'selection' | 'game';

export default function Home() {
  const [user, setUser] = useState<{ nome: string; matricula: string } | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [view, setView] = useState<View>('login');
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [register, setRegister] = useState(false);
    const [winEffect, setWinEffect] = useState(false);
    const [lossEffect, setLossEffect] = useState(false);
    const [betAmount, setBetAmount] = useState(10);
    const [animalSelected, setAnimalSelected] = useState<string | null>(null);

  const { canvasRef, containerRef, triggerWin, triggerLoss } = useParticleEffects();

  async function loadDashboard() {
    try {
      const r = await fetch('/api/dashboard');
      if (r.ok) {
        const d = await r.json();
        setSnapshot(d.snapshot);
        setLeaders(d.leaderboard);
      }
    } catch (e) {
      console.error('Erro ao carregar dashboard:', e);
    }
  }

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user) {
          setUser(d.user);
          setView('selection');
          loadDashboard();
        }
      });
  }, []);

  const handleGameSelect = useCallback((gameId: string) => {
    setActiveGame(gameId);
    setView('game');
    setMessage('');
  }, []);

  const handleBackToSelection = useCallback(() => {
    setActiveGame(null);
    setView('selection');
    setMessage('');
  }, []);

  const handlePlay = useCallback(
        async (extra?: any) => {
          if (busy || !activeGame) return;
          setBusy(true);
          setMessage('Resolvendo no servidor…');
          try {
            const payload: any = { game: activeGame, bet_amount: betAmount };
            if (activeGame === 'animal') {
              const animal = typeof extra === 'string' ? extra : (extra?.animal ?? animalSelected);
              payload.animal = animal;
            }
            if (activeGame === 'roulette') {
              payload.betType = extra?.betType;
              payload.value = extra?.value;
            }
            const r = await fetch('/api/games', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
            });
          const d = await r.json();
          if (!r.ok) {
            setMessage(d.error || 'Erro no jogo.');
          } else {
            setSnapshot(d.snapshot);
            if (d.won) {
              triggerWin();
              setWinEffect(true);
              setTimeout(() => setWinEffect(false), 2000);
            } else {
              triggerLoss();
              setLossEffect(true);
              setTimeout(() => setLossEffect(false), 1000);
            }
            if (activeGame === 'slot')
              setMessage(d.won ? '🎉 GANHOU! Bônus na banca!' : '💀 A banca venceu. Tente de novo.');
            else if (activeGame === 'animal')
              setMessage(d.won
                  ? `🎉 SAIU O ${d.animal}! Você ganhou ${d.outcomeText || ''}.`
                  : `💀 NÃO SAIU. A banca ficou com sua aposta.`);
            else if (activeGame === 'board')
              setMessage(d.won ? '🟢 Casa neutra — você preservou.' : '🏠 A banca absorveu sua aposta.');
            else if (activeGame === 'roulette')
              setMessage(d.won ? `🎯 ${d.outcomeText} GANHOU!` : `🎯 ${d.outcomeText} PERDEU.`);
            else if (activeGame === 'blackjack') setMessage(d.won ? `🃏 ${d.resultText}` : `🃏 ${d.resultText}`);
            else if (activeGame === 'poker') setMessage(d.won ? `🂡 ${d.outcomeText}` : `🂡 ${d.outcomeText}`);
            await loadDashboard();
          }
          return d;
        } catch (e: any) {
          setMessage('Erro de conexão. Tente novamente.');
        }
        setBusy(false);
      },
      [activeGame, busy, animalSelected, betAmount, triggerWin, triggerLoss]
    );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const r = await fetch(
        register ? '/api/auth/register' : '/api/auth/login',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(
            register ? { nome, matricula, senha } : { matricula, senha }
          ),
        }
      );
      const d = await r.json();
      if (!r.ok) {
        setMessage(d.error || 'Não foi possível continuar.');
      } else {
        setUser(d.user);
        setView('selection');
        await loadDashboard();
        setMessage('');
      }
    } catch {
      setMessage('Erro de conexão.');
    }
    setBusy(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setSnapshot(null);
    setLeaders([]);
    setView('login');
  };

  // Login View
  if (view === 'login') {
    return (
      <TelaLogin
        matricula={matricula}
        setMatricula={setMatricula}
        senha={senha}
        setSenha={setSenha}
        nome={nome}
        setNome={setNome}
        busy={busy}
        register={register}
        setRegister={setRegister}
        message={message}
        handleSubmit={handleRegister}
      />
    );
  }

  // Game Selection View
  if (view === 'selection') {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        <GameSelection
          snapshot={snapshot}
          onGameSelect={handleGameSelect}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // Game View
  const game = GAMES.find((g) => g.id === activeGame) || GAMES[0];
  const winMessage =
    message.includes('GANHOU') ||
    message.includes('ACERTOU') ||
    message.includes('Saiu');

  const renderGame = () => {
    if (!activeGame) return null;

    const commonProps = {
      onPlay: handlePlay,
      busy,
      balance: snapshot?.balance || 0,
      onWin: () => triggerWin(),
      onLoss: () => triggerLoss(),
      onBack: handleBackToSelection,
    };

    switch (activeGame) {
      case 'slot':
        return <GameSlot {...commonProps} />;
      case 'animal':
        return <GameBicho {...commonProps} />;
      case 'board':
        return <GameBoard {...commonProps} />;
      case 'roulette':
        return <GameRoulette {...commonProps} />;
      case 'blackjack':
        return <GameBlackjack {...commonProps} />;
      case 'poker':
        return <GamePoker {...commonProps} />;
      default:
        return <GameSlot {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      {/* PARTICLES CANVAS */}
      <div ref={containerRef} className="particle-overlay fixed inset-0 pointer-events-none z-50">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Header - only back button and title when in game */}
      {activeGame && (
        <header className="header sticky top-0 z-40 border-b border-gold/30 bg-card/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleBackToSelection}
              className="flex items-center gap-2 text-gold hover:text-gold/70 transition-colors p-2"
              aria-label="Voltar para seleção de jogos"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left text-gold" aria-hidden="true">
                <path d="M15 18l-6-6 6-6"></path>
              </svg>
              <span className="font-mono text-sm font-bold tracking-wider text-gold neon-text">
                {game.title}
              </span>
            </button>
            <div className="w-20" />
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-[140px]">
        <div className="px-4 py-4">
          {activeGame ? (
            <div className="game-container">
              {renderGame()}
            </div>
          ) : (
            <GameSelection
              snapshot={snapshot}
              onGameSelect={handleGameSelect}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>

      {/* Bottom Toolbar */}
            <BottomToolbar
              snapshot={snapshot}
              leaders={leaders}
              user={user}
              onLogout={handleLogout}
              onGameSelect={handleGameSelect}
              activeGameId={activeGame}
              betAmount={betAmount}
              setBetAmount={setBetAmount}
            />

      {/* LIVE TICKER - positioned above toolbar */}
      <div className="live-ticker fixed bottom-[140px] left-0 right-0 z-40 mx-auto max-w-[390px] border-t border-gold/30 bg-card/95 backdrop-blur-md">
        <div className="overflow-hidden px-4 py-2">
          <div className="mb-1 flex items-center gap-2 text-xs font-mono text-gold">
            <span className="led-red inline-block size-2 rounded-full" />
            AO VIVO
          </div>
          <div className="overflow-hidden whitespace-nowrap">
            <div className="ticker inline-block">
              {[...LIVE_MESSAGES, ...LIVE_MESSAGES].map((m, i) => (
                <span key={i} className="inline-block mr-8 text-xs text-muted-foreground">
                  <span className="text-gold font-bold">
                    {m.emoji} {m.user}
                  </span>{' '}
                  {m.game}:{' '}
                  <span
                    className={
                      m.action.includes('GANHOU') ? 'text-green-400' : 'text-red-400'
                    }
                  >
                    {m.action}
                  </span>{' '}
                  <span className="opacity-50 text-xs">{m.time}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}