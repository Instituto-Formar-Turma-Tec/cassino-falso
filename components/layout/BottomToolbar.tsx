'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Coins, User, Trophy, History, LogOut, Grid,
  X, Minus, Plus
} from 'lucide-react';
import { formatBRL, formatTime, GAMES } from '@/lib/utils-data';

interface BottomToolbarProps {
  snapshot: {
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
  } | null;
  leaders: Array<{
    nome: string;
    matricula: string;
    balance: number;
    rounds: number;
    lost: number;
  }>;
  user: {
    nome: string;
    matricula: string;
  } | null;
  onLogout: () => void;
  onGameSelect: (gameId: string) => void;
  activeGameId: string | null;
  betAmount: number;
  setBetAmount: (v: number) => void;
}

export function BottomToolbar({ snapshot, leaders, user, onLogout, onGameSelect, activeGameId, betAmount, setBetAmount }: BottomToolbarProps) {
  const [activeModal, setActiveModal] = useState<'account' | 'profile' | 'ranking' | 'history' | 'games' | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setShowQuitConfirm(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setActiveModal(null);
      setShowQuitConfirm(false);
    }
  };

  const openModal = (modal: 'account' | 'profile' | 'ranking' | 'history' | 'games') => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleLogout = () => {
    if (activeModal === 'profile') {
      setShowQuitConfirm(true);
    } else {
      setShowQuitConfirm(true);
    }
  };

  const confirmLogout = () => {
    setShowQuitConfirm(false);
    setActiveModal(null);
    onLogout();
  };

  // Determine user's rank
  const userRank = leaders.findIndex(l => l.matricula === user?.matricula) + 1;

  return (
    <>
      {/* Bet Amount Selector - visible when in a game */}
      {activeGameId && (
        <div className="fixed bottom-[132px] left-0 right-0 z-40 mx-auto max-w-[390px] px-3">
          <div className="bg-[var(--surface)] border border-gold/30 rounded-xl p-2 flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider pl-1">Aposta</span>
            <div className="flex-1 flex items-center justify-center gap-2">
              <button
                onClick={() => setBetAmount(Math.max(1, betAmount - 5))}
                className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center text-gold active:scale-95 transition-all"
                aria-label="Diminuir aposta"
              >
                <Minus size={16} />
              </button>
              <span className="font-mono text-lg font-bold text-gold min-w-[80px] text-center">
                {formatBRL(betAmount * 100)}
              </span>
              <button
                onClick={() => setBetAmount(betAmount + 5)}
                className="w-9 h-9 rounded-lg bg-[var(--border)]/40 flex items-center justify-center text-gold active:scale-95 transition-all"
                aria-label="Aumentar aposta"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Toolbar - Fixed at bottom */}
      <div className="bottom-toolbar fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[390px] bg-[var(--surface)] border-t border-gold/30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          <button
            onClick={() => openModal('games')}
            className={`toolbar-btn flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all ${activeGameId ? 'text-gold' : 'text-gold'}`}
            aria-label="Jogos"
          >
            <Grid size={22} className="text-gold" />
            <span className="text-[9px] font-mono font-medium text-gold">Jogos</span>
          </button>
          <button
            onClick={() => openModal('account')}
            className="toolbar-btn flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all"
            aria-label="Conta"
          >
            <Coins size={22} className="text-gold" />
            <span className="text-[9px] font-mono font-medium text-gold">Conta</span>
          </button>
          <button
            onClick={() => openModal('profile')}
            className="toolbar-btn flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all"
            aria-label="Perfil"
          >
            <User size={22} className="text-gold" />
            <span className="text-[9px] font-mono font-medium text-gold">Perfil</span>
          </button>
          <button
            onClick={() => openModal('ranking')}
            className="toolbar-btn flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all"
            aria-label="Ranking"
          >
            <Trophy size={22} className="text-gold" />
            <span className="text-[9px] font-mono font-medium text-gold">Ranking</span>
          </button>
          <button
            onClick={() => openModal('history')}
            className="toolbar-btn flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all"
            aria-label="Extrato"
          >
            <History size={22} className="text-gold" />
            <span className="text-[9px] font-mono font-medium text-gold">Extrato</span>
          </button>
        </div>
        
        {/* Logout button - separate row */}
        <div className="border-t border-gold/10 px-4 pb-3 pt-2">
          <button
            onClick={() => handleLogout()}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold text-xs transition-all hover:bg-red-500/20 hover:border-red-500/50 active:scale-[0.98]"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
        
        {/* Safe area padding */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      {/* Modals */}
      {activeModal === 'account' && (
        <Modal onClose={closeModal} title="💰 Conta" size="md">
          <div className="space-y-4">
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo Atual</p>
              <p className="text-3xl font-mono font-bold text-gold neon-text">{formatBRL(snapshot?.balance || 0)}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--surface)] border border-gold/20 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Perdido</p>
                <p className="font-mono font-bold text-red-400">{formatBRL(snapshot?.totalLost || 0)}</p>
              </div>
              <div className="bg-[var(--surface)] border border-gold/20 rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rodadas</p>
                <p className="font-mono font-bold text-gold">{snapshot?.rounds || 0}</p>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-gold/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Risco</p>
                <p className="font-mono font-bold text-gold">{snapshot?.riskScore || 0}/100</p>
              </div>
              <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${snapshot?.riskScore || 0}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Quanto mais alto, mais perto de perder tudo.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'profile' && (
        <Modal onClose={closeModal} title="👤 Perfil" size="md">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="gold-sheen w-16 h-16 rounded-full mx-auto flex items-center justify-center">
                <User size={32} className="text-gold" />
              </div>
              <h3 className="font-serif text-xl font-bold text-gold">{user?.nome}</h3>
              <p className="text-xs text-muted-foreground font-mono">Matrícula: {user?.matricula}</p>
              <p className="text-[10px] text-muted-foreground">Você está em #{userRank > 0 ? userRank : '—'} no ranking</p>
            </div>

            <div className="bg-[var(--surface)] border border-gold/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo</span>
                <span className="font-mono font-bold text-gold">{formatBRL(snapshot?.balance || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Perdido</span>
                <span className="font-mono font-bold text-red-400">{formatBRL(snapshot?.totalLost || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rodadas</span>
                <span className="font-mono font-bold text-gold">{snapshot?.rounds || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Risco</span>
                <span className="font-mono font-bold text-gold">{snapshot?.riskScore || 0}/100</span>
              </div>
            </div>

            <button
              onClick={() => setShowQuitConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-mono font-bold text-sm transition-all hover:bg-red-500/20 hover:border-red-500/50 active:scale-[0.98]"
            >
              <LogOut size={16} />
              Sair da Conta
            </button>
          </div>
        </Modal>
      )}

      {activeModal === 'ranking' && (
        <Modal onClose={closeModal} title="🏆 Ranking — Quem Perdeu Menos" size="lg">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {leaders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum jogador no ranking ainda.</p>
            ) : (
              leaders.map((leader, index) => {
                const isCurrentUser = leader.matricula === user?.matricula;
                return (
                  <div
                    key={leader.matricula}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                      isCurrentUser
                        ? 'bg-gold/10 border border-gold/30 ring-1 ring-gold/20'
                        : 'bg-[var(--surface)] border border-gold/10'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-700 text-white' :
                      'bg-[var(--border)] text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-mono font-medium truncate ${isCurrentUser ? 'text-gold' : 'text-white'}`}>
                        {leader.nome}
                        {isCurrentUser && <span className="ml-2 text-[10px] bg-gold/20 text-gold px-1 rounded">VOCÊ</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">{leader.matricula}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-gold text-sm">{formatBRL(leader.balance)}</p>
                      <p className="text-[10px] text-red-400 font-mono">{formatBRL(leader.lost)} perdido</p>
                      <p className="text-[10px] text-muted-foreground">{leader.rounds} rodadas</p>
                    </div>
                  </div>
                );
              })
          )}
          </div>
          <p className="text-center text-[10px] text-muted-foreground mt-4">
            Quem perde menos, ganha. O ranking mostra quem conseguiu preservar mais.
          </p>
        </Modal>
      )}

      {activeModal === 'history' && (
        <Modal onClose={closeModal} title="📊 Extrato de Apostas" size="lg">
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {snapshot?.recent && snapshot.recent.length > 0 ? (
              snapshot.recent.slice(0, 20).map((r, i) => {
                const prevSaldo = i > 0 ? snapshot.recent[i - 1]?.saldo_depois_centavos || 0 : 0;
                const isWin = r.saldo_depois_centavos > prevSaldo;
                const valor = r.saldo_depois_centavos - prevSaldo;
                return (
                  <div
                    key={r.criado_em}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl ${
                      isWin ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xl ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {isWin ? '↗' : '↘'}
                      </span>
                      <div>
                        <p className="font-mono text-sm text-white">{r.tipo_jogo}</p>
                        <p className="text-[10px] text-muted-foreground">{formatTime(r.criado_em)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold text-sm ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                        {isWin ? '+' : ''}{formatBRL(valor)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{r.resultado}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma aposta realizada ainda.</p>
            )}
          </div>
        </Modal>
      )}

      {/* Games Selection Modal */}
      {activeModal === 'games' && (
        <Modal onClose={closeModal} title="🎮 Selecionar Jogo" size="lg">
          <div className="grid grid-cols-2 gap-3">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  onGameSelect(g.id);
                  closeModal();
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all active:scale-95 ${
                  activeGameId === g.id
                    ? 'border-gold bg-gold/10'
                    : 'border-gold/20 bg-[var(--surface)] hover:border-gold/40'
                }`}
              >
                <span className="text-3xl">{g.icon}</span>
                <span className="font-mono text-sm font-bold text-gold">{g.title}</span>
                <span className="text-[10px] text-muted-foreground text-center">{g.desc}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Quit Confirmation Modal */}
      {showQuitConfirm && (
        <Modal onClose={() => setShowQuitConfirm(false)} title="Sair da Conta" size="sm">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja sair da sua conta?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-[var(--surface)] border border-gold/30 text-gold font-mono font-bold text-sm transition-all hover:bg-gold/10"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 border border-red-500 text-white font-mono font-bold text-sm transition-all hover:bg-red-600"
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// Modal Component
interface ModalProps {
  onClose: () => void;
  title: string;
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

function Modal({ onClose, title, size, children }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div
        className={`relative w-full ${sizeClasses[size]} bg-[var(--surface-elevated)] border border-gold/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/20">
          <h2 id="modal-title" className="font-serif text-lg font-bold text-gold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-gold hover:bg-gold/10 transition-all"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}