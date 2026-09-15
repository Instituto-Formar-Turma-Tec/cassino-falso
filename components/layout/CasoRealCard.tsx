'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { CASOS_REAIS, CasoReal } from '@/lib/real-cases';

interface CasoRealCardProps {
  onDismiss?: () => void;
}

/**
 * Card educativo: exibe um caso real selecionado aleatoriamente
 * sempre que o usuário entra em um jogo (ou a cada nova aposta).
 * Não pode ser fechado permanentemente — reforça o alerta educacional.
 */
export function CasoRealCard({ onDismiss }: CasoRealCardProps) {
  const [fechado, setFechado] = useState(false);

  // Sorteia um caso a cada montagem do componente (mudança de jogo/rodada)
  const [caso] = useState<CasoReal>(
    () => CASOS_REAIS[Math.floor(Math.random() * CASOS_REAIS.length)]
  );

  if (fechado) return null;

  return (
    <div
      className="mb-4 rounded-xl border border-red-500/40 bg-red-500/5 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      role="note"
      aria-label="Aviso sobre consequências reais do jogo"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0 text-red-400" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
            Caso real de vício em apostas
          </span>
        </div>
        <button
          onClick={() => {
            setFechado(true);
            onDismiss?.();
          }}
          className="p-0.5 rounded text-muted-foreground hover:text-red-400 transition-colors"
          aria-label="Fechar aviso"
        >
          <X size={14} />
        </button>
      </div>

      <p className="mt-2 font-sans text-xs text-red-100/90">
        <strong className="text-red-300">{caso.perfil}</strong> perdeu{' '}
        <strong className="text-red-300">{caso.perda}</strong>.
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
        {caso.consequencias}
      </p>
      <p className="mt-2 text-[9px] uppercase tracking-wider text-muted-foreground/70">
        Fonte: {caso.fonte} · O jogo é controlado e educativo; nenhum valor real está em jogo.
      </p>
    </div>
  );
}