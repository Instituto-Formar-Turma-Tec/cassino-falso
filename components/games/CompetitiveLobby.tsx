'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Play, Lock, X, ChevronLeft, MessageSquare,
  Crown, Target, Settings, Plus, Minus, Eye, Clock
} from 'lucide-react';
import { formatBRL } from '@/lib/utils-data';
import {
  supabaseBrowser,
  criarSala,
  entrarSala,
  registrarAposta,
  iniciarPartida,
  obterEstadoSala,
  listarSalasAbertas,
  subscreverSalaCompleta,
  Sala,
  JogadorSala,
  RodadaSala,
  EstadoSala,
} from '@/lib/rooms';

type View = 'lobby' | 'criar' | 'sala' | 'jogando';

export default function CompetitiveLobby() {
  const [view, setView] = useState<View>('lobby');
  const [salas, setSalas] = useState<Sala[]>([]);
  const [loadingSalas, setLoadingSalas] = useState(true);
  const [minhaSala, setMinhaSala] = useState<EstadoSala | null>(null);
  const [minhaAposta, setMinhaAposta] = useState(1000);
  const [minhaEscolha, setMinhaEscolha] = useState('');
  const [ultimaRodada, setUltimaRodada] = useState<any>(null);
  const [mensagem, setMensagem] = useState('');
  const [busy, setBusy] = useState(false);
  const [cleanup, setCleanup] = useState<(() => void) | null>(null);

  // Criar nova sala
  const handleCriarSala = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMensagem('');
    try {
      const form = new FormData(e.currentTarget);
      const jogo = form.get('jogo') as 'roleta' | 'poker' | 'blackjack';
      const max_jogadores = parseInt(form.get('max_jogadores') as string, 10);
      const rodadas_total = parseInt(form.get('rodadas_total') as string, 10);
      const aposta_centavos = parseInt(form.get('aposta_centavos') as string, 10) * 100;

      const { codigo } = await criarSala({ jogo, max_jogadores, rodadas_total, aposta_centavos });
      setMensagem(`Sala ${codigo} criada! Compartilhe o código.`);
      setView('sala');
      await carregarSala(codigo);
    } catch (e: any) {
      setMensagem(e.message || 'Erro ao criar sala.');
    }
    setBusy(false);
  };

  // Entrar em sala existente
  const handleEntrarSala = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMensagem('');
    try {
      const form = new FormData(e.currentTarget);
      const codigo = (form.get('codigo') as string).toUpperCase().trim();
      if (!codigo) throw new Error('Digite o código da sala.');

      await entrarSala(codigo);
      await carregarSala(codigo);
      setView('sala');
      setMensagem('Entrou na sala!');
    } catch (e: any) {
      setMensagem(e.message || 'Erro ao entrar.');
    }
    setBusy(false);
  };

  // Carregar estado da sala
  const carregarSala = async (codigo: string) => {
    try {
      const estado = await obterEstadoSala(codigo);
      if (!estado) throw new Error('Sala não encontrada.');
      setMinhaSala(estado);

      // Subscrever realtime
      if (cleanup) cleanup();
      const c = subscreverSalaCompleta(
        codigo,
        (payload) => {
          if (payload.new) setMinhaSala(prev => prev ? { ...prev, sala: { ...prev.sala, ...payload.new } } : null);
        },
        (payload) => {
          setMinhaSala(prev => {
            if (!prev) return prev;
            if (payload.eventType === 'UPDATE' && payload.new) {
              return { ...prev, jogadores: prev.jogadores.map(j => j.id === payload.new.id ? { ...j, ...payload.new } : j) };
            }
            if (payload.eventType === 'INSERT' && payload.new) {
              return { ...prev, jogadores: [...prev.jogadores, payload.new] };
            }
            if (payload.eventType === 'DELETE' && payload.old) {
              return { ...prev, jogadores: prev.jogadores.filter(j => j.id !== payload.old.id) };
            }
            return prev;
          });
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setMinhaSala(prev => prev ? { ...prev, rodadas: [...prev.rodadas, payload.new] } : prev);
          }
        }
      );
      setCleanup(() => c);
    } catch (e: any) {
      setMensagem(e.message || 'Erro ao carregar sala.');
    }
  };

  // Iniciar partida (host)
  const handleIniciar = async () => {
    if (!minhaSala) return;
    setBusy(true);
    try {
      await iniciarPartida(minhaSala.sala.id);
      setMensagem('Partida iniciada!');
    } catch (e: any) {
      setMensagem(e.message || 'Erro ao iniciar.');
    }
    setBusy(false);
  };

  // Registrar aposta
  const handleApostar = async () => {
    if (!minhaSala) return;
    setBusy(true);
    try {
      await registrarAposta(minhaSala.sala.id, minhaAposta, minhaEscolha);
      setMensagem('Aposta registrada! Aguardando outros...');
    } catch (e: any) {
      setMensagem(e.message || 'Erro ao apostar.');
    }
    setBusy(false);
  };

  // Sair da sala
  const handleSair = () => {
    if (cleanup) cleanup();
    setCleanup(null);
    setMinhaSala(null);
    setView('lobby');
  };

  // Carregar salas abertas
  useEffect(() => {
    const carregar = async () => {
      setLoadingSalas(true);
      try {
        const s = await listarSalasAbertas();
        setSalas(s || []);
      } catch {
        setSalas([]);
      }
      setLoadingSalas(false);
    };
    carregar();
    const id = setInterval(carregar, 5000);
    return () => clearInterval(id);
  }, []);

  // Cleanup ao sair
  useEffect(() => {
    return () => { if (cleanup) cleanup(); };
  }, [cleanup]);

  // Render
  if (view === 'lobby') return <LobbyView salas={salas} loading={loadingSalas} onCriar={() => setView('criar')} onEntrar={() => setView('entrar')} />;
  if (view === 'criar') return <CriarSalaView onSubmit={handleCriarSala} onVoltar={() => setView('lobby')} busy={busy} />;
  if (view === 'entrar') return <EntrarSalaView onSubmit={handleEntrarSala} onVoltar={() => setView('lobby')} busy={busy} />;
  if (view === 'sala') return minhaSala ? <SalaView estado={minhaSala} onIniciar={handleIniciar} onApostar={handleApostar} onSair={handleSair} minhaAposta={minhaAposta} setMinhaAposta={setMinhaAposta} minhaEscolha={minhaEscolha} setMinhaEscolha={setMinhaEscolha} busy={busy} mensagem={mensagem} ultimaRodada={ultimaRodada} /> : <div>Carregando...</div>;
  if (view === 'jogando') return <JogandoView estado={minhaSala} onSair={handleSair} ultimaRodada={ultimaRodada} />;
  return null;
}

// ===== Sub-components =====

function LobbyView({ salas, loading, onCriar, onEntrar }: { salas: Sala[]; loading: boolean; onCriar: () => void; onEntrar: () => void }) {
  return (
    <div className="competitive-lobby">
      <div className="lobby-header">
        <h2><Target size={20} className="mr-2" /> Modo Competitivo</h2>
        <p className="text-sm text-muted-foreground">Salas de 2–6 jogadores • Mesma rodada, mesmo resultado • Quem perde menos, ganha</p>
      </div>

      <div className="lobby-actions">
        <button className="btn-primary" onClick={onCriar}><Plus size={16} /> Criar Sala</button>
        <button className="btn-secondary" onClick={onEntrar}><Eye size={16} /> Entrar na Sala</button>
      </div>

      <div className="salas-list">
        {loading ? (
          <p className="text-center text-muted-foreground">Carregando salas...</p>
        ) : salas.length === 0 ? (
          <p className="text-center text-muted-foreground">Nenhuma sala aberta. Crie a sua!</p>
        ) : (
          salas.map(sala => (
            <div key={sala.id} className="sala-card">
              <div className="sala-info">
                <span className="sala-codigo">{sala.id}</span>
                <span className="sala-jogo">{sala.jogo.toUpperCase()}</span>
                <span className="sala-jogadores"><Users size={14} /> {sala.jogadores_atuais}/{sala.max_jogadores}</span>
                <span className="sala-aposta">Aposta: {formatBRL(sala.aposta_centavos)}</span>
                <span className="sala-rodadas"><Target size={14} /> {sala.rodadas_total} rodadas</span>
              </div>
              <button className="btn-join" onClick={() => { /* implementar entrar direto */ }}>
                <MessageSquare size={14} /> Entrar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CriarSalaView({ onSubmit, onVoltar, busy }: { onSubmit: (e: React.FormEvent) => void; onVoltar: () => void; busy: boolean }) {
  return (
    <form onSubmit={onSubmit} className="competitive-form">
      <button type="button" className="btn-back" onClick={onVoltar}><ChevronLeft size={16} /> Voltar</button>
      <h3>Criar Nova Sala</h3>

      <label>
        <span>Jogo</span>
        <select name="jogo" required>
          <option value="roleta">🎡 Roleta</option>
          <option value="poker">🂡 Poker</option>
          <option value="blackjack">🃏 Blackjack</option>
        </select>
      </label>

      <label>
        <span>Máx. Jogadores</span>
        <select name="max_jogadores" required>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6" selected>6</option>
        </select>
      </label>

      <label>
        <span>Rodadas Totais</span>
        <select name="rodadas_total" required>
          <option value="3">3</option>
          <option value="5" selected>5</option>
          <option value="7">7</option>
          <option value="10">10</option>
        </select>
      </label>

      <label>
        <span>Aposta por Rodada (R$)</span>
        <input type="number" name="aposta_centavos" min="1" max="100" defaultValue="10" required />
      </label>

      <button type="submit" className="btn-primary" disabled={busy} style={{width:'100%'}}>
        {busy ? 'Criando...' : 'Criar Sala'}
      </button>
    </form>
  );
}

function EntrarSalaView({ onSubmit, onVoltar, busy }: { onSubmit: (e: React.FormEvent) => void; onVoltar: () => void; busy: boolean }) {
  return (
    <form onSubmit={onSubmit} className="competitive-form">
      <button type="button" className="btn-back" onClick={onVoltar}><ChevronLeft size={16} /> Voltar</button>
      <h3>Entrar na Sala</h3>
      <label>
        <span>Código da Sala</span>
        <input name="codigo" placeholder="Ex: AB12CD" maxLength={6} required style={{textTransform:'uppercase'}} />
      </label>
      <button type="submit" className="btn-primary" disabled={busy} style={{width:'100%'}}>
        {busy ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

function SalaView({
  estado, onIniciar, onApostar, onSair, minhaAposta, setMinhaAposta, minhaEscolha, setMinhaEscolha, busy, mensagem, ultimaRodada
}: any) {
  const { sala, jogadores } = estado;
  const souHost = jogadores[0]?.user_id === (typeof window !== 'undefined' ? localStorage.getItem('userId') : '');
  const jogoIniciado = sala.status === 'jogando' || sala.status === 'encerrada';
  const minhaVez = jogadores.find((j: JogadorSala) => j.user_id === localStorage.getItem('userId'));
  const jaApostei = minhaVez?.aposta_atual !== null;

  if (jogoIniciado) return <JogandoView estado={estado} onSair={onSair} ultimaRodada={ultimaRodada} />;

  return (
    <div className="competitive-sala">
      <div className="sala-header">
        <h3>Sala <span className="sala-codigo">{sala.id}</span> — {sala.jogo.toUpperCase()}</h3>
        <button className="btn-leave" onClick={onSair}><X size={16} /> Sair</button>
      </div>

      <div className="sala-config">
        <span><Target size={14} /> {sala.rodadas_total} rodadas</span>
        <span><Settings size={14} /> Aposta: {formatBRL(sala.aposta_centavos)}</span>
        <span><Users size={14} /> {jogadores.length}/{sala.max_jogadores}</span>
        <span><Clock size={14} /> Status: {sala.status}</span>
      </div>

      <div className="jogadores-list">
        <h4>Jogadores ({jogadores.length}/{sala.max_jogadores})</h4>
        {jogadores.map((j: JogadorSala) => (
          <div key={j.id} className="jogador-row">
            <span>{j.nome} <span className="matricula">({j.matricula})</span></span>
            <span className="saldo">{formatBRL(j.saldo_centavos)}</span>
            {j.user_id === jogadores[0]?.user_id && <Lock size={14} className="host-badge" title="Host" />}
          </div>
        ))}
      </div>

      {souHost && jogadores.length >= 2 && !jogoIniciado && (
        <button className="btn-primary" onClick={onIniciar} disabled={busy} style={{width:'100%',marginTop:'1rem'}}>
          {busy ? 'Iniciando...' : 'Iniciar Partida'}
        </button>
      )}

      {!souHost && !jogoIniciado && (
        <div className="aposta-area">
          <h4>Sua Aposta</h4>
          <input type="number" value={minhaAposta} onChange={e=>setMinhaAposta(Math.max(100,Math.min(sala.aposta_centavos,parseInt(e.target.value)||0)))} min="100" max={sala.aposta_centavos} />
          <label>
            <span>Escolha</span>
            <input value={minhaEscolha} onChange={e=>setMinhaEscolha(e.target.value)} placeholder={sala.jogo==='roleta'?'Ex: vermelho, preto, 5' : sala.jogo==='poker'?'Ex: raise, fold' : 'Ex: hit, stand'} />
          </label>
          <button className="btn-primary" onClick={onApostar} disabled={busy || jaApostei} style={{width:'100%'}}>
            {jaApostei ? 'Aposta registrada ✓' : 'Registrar Aposta'}
          </button>
        </div>
      )}

      {mensagem && <p className="mensagem">{mensagem}</p>}
    </div>
  );
}

function JogandoView({ estado, onSair, ultimaRodada }: any) {
  const { sala, jogadores, rodadas } = estado;
  const ultima = rodadas[rodadas.length - 1];
  const souVencedor = jogadores.find((j: JogadorSala) => j.venceu === true && j.user_id === localStorage.getItem('userId'));

  return (
    <div className="competitive-jogando">
      <div className="jogando-header">
        <h3>Rodada {sala.rodadas_atuais}/{sala.rodadas_total} — {sala.id}</h3>
        <button className="btn-leave" onClick={onSair}><X size={16} /> Sair</button>
      </div>

      <div className="ranking-live">
        {jogadores.sort((a: JogadorSala, b: JogadorSala) => b.saldo_centavos - a.saldo_centavos).map((j: JogadorSala, i: number) => (
          <div key={j.id} className={`rank-row ${j.venceu === true ? 'vencedor' : ''} ${j.user_id === localStorage.getItem('userId') ? 'eu' : ''}`}>
            <span className="pos">{i + 1}</span>
            <span className="nome">{j.nome}</span>
            <span className="saldo">{formatBRL(j.saldo_centavos)}</span>
            {j.aposta_atual !== null && <span className="apostou"><Target size={12} /> Apostou</span>}
          </div>
        ))}
      </div>

      {ultima && (
        <div className="ultima-rodada">
          <h4>Última rodada</h4>
          <p><strong>Resultado:</strong> {ultima.resultado}</p>
          <p><strong>Multiplicador:</strong> ×{ultima.multiplicador}</p>
        </div>
      )}

      {sala.status === 'encerrada' && souVencedor && (
        <div className="vitoria">
          <Crown size={32} className="text-gold" />
          <h3>VOCÊ VENCEU A PARTIDA!</h3>
        </div>
      )}

      {sala.status === 'encerrada' && !souVencedor && (
        <div className="derrota">
          <p>Partida encerrada. O vencedor foi {jogadores.find((j: JogadorSala) => j.venceu)?.nome}.</p>
        </div>
      )}
    </div>
  );
}