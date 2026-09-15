'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useParticleEffects } from '@/hooks/useParticleEffects';
import { BottomToolbar } from '@/components/layout/BottomToolbar';

export type Snapshot = {
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

export type Leader = {
  nome: string;
  matricula: string;
  balance: number;
  rounds: number;
  lost: number;
};

export type User = { nome: string; matricula: string } | null;

type View = 'login' | 'selection' | 'game';

interface AppContextValue {
  // Estado de sessão / dados
  user: User;
  setUser: (u: User) => void;
  snapshot: Snapshot | null;
  leaders: Leader[];
  activeGame: string | null;
  view: View;
  setView: (v: View) => void;
  // Form de login
  matricula: string;
  setMatricula: (v: string) => void;
  senha: string;
  setSenha: (v: string) => void;
  nome: string;
  setNome: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  busy: boolean;
  register: boolean;
  setRegister: (v: boolean) => void;
  // Jogo
  betAmount: number;
  setBetAmount: (v: number) => void;
  animalSelected: string | null;
  setAnimalSelected: (v: string | null) => void;
  // Partículas
  winEffect: boolean;
  lossEffect: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  triggerWin: () => void;
  triggerLoss: () => void;
  // Ações
  loadDashboard: () => Promise<void>;
  handleGameSelect: (gameId: string) => void;
  handleBackToSelection: () => void;
  handlePlay: (extra?: any) => Promise<any>;
  handleRegister: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
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

  const value: AppContextValue = {
    user, setUser,
    snapshot, leaders,
    activeGame, view, setView,
    matricula, setMatricula,
    senha, setSenha,
    nome, setNome,
    message, setMessage,
    busy, register, setRegister,
    betAmount, setBetAmount,
    animalSelected, setAnimalSelected,
    winEffect, lossEffect,
    canvasRef, containerRef, triggerWin, triggerLoss,
    loadDashboard,
    handleGameSelect, handleBackToSelection,
    handlePlay, handleRegister, handleLogout,
  };

  return (
    <AppContext.Provider value={value}>
      <div className="mobile-app">
        {children}
      </div>
      {/* Barra inferior global — aparece em todas as telas */}
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
    </AppContext.Provider>
  );
}