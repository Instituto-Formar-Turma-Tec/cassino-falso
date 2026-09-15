'use client';

import { GAMES, LIVE_MESSAGES } from '@/lib/utils-data';
import { TelaLogin } from '@/components/layout/TelaLogin';
import { GameSelection } from '@/components/layout/GameSelection';
import { useApp } from '@/components/layout/AppProvider';
import GameSlot from '@/components/games/GameSlot';
import GameBicho from '@/components/games/GameBicho';
import GameBoard from '@/components/games/GameBoard';
import GameRoulette from '@/components/games/GameRoulette';
import GameBlackjack from '@/components/games/GameBlackjack';
import GamePoker from '@/components/games/GamePoker';
import { CasoRealCard } from '@/components/layout/CasoRealCard';

export default function Home() {
  const {
    user,
    snapshot,
    activeGame,
    view,
    matricula, setMatricula,
    senha, setSenha,
    nome, setNome,
    message, setMessage,
    busy,
    register, setRegister,
    canvasRef, containerRef,
        winEffect, lossEffect,
        triggerWin, triggerLoss,
        handlePlay, handleRegister, handleLogout,
    handleGameSelect, handleBackToSelection,
  } = useApp();

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

  const renderGame = () => {
    if (!activeGame) return null;

    const commonProps = {
      onPlay: handlePlay,
      busy,
      balance: snapshot?.balance || 0,
      onWin: triggerWin,
      onLoss: triggerLoss,
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
      {/* PARTICLES CANVAS - global, no provider */}
      <div ref={containerRef} className="particle-overlay fixed inset-0 pointer-events-none z-50">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Win/Loss overlay feedback */}
      {winEffect && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <span className="text-6xl animate-win-bloom">🎉</span>
        </div>
      )}
      {lossEffect && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          <span className="text-4xl animate-loss-flash">💥</span>
        </div>
      )}

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
                        <CasoRealCard key={activeGame} />
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