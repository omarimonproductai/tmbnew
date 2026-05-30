import { useState } from 'react';
import { Toast } from './Toast';
import { shareBicing, shareParada } from '../utils/share';
import type { ParadaAmbLinies } from '../types/tmb';

interface Props {
  // Share either a TMB stop (deep link) or a Bicing station (maps location).
  parada?: ParadaAmbLinies;
  bicing?: { name: string; lat: number; lng: number };
  variant?: 'icon' | 'block';
}

function ShareIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="M8 8l4-4 4 4" />
      <rect x="4" y="12" width="16" height="9" rx="2" />
    </svg>
  );
}

export function ShareButton({ parada, bicing, variant = 'icon' }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const label = parada?.nom ?? bicing?.name ?? '';

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = parada
      ? await shareParada(parada)
      : bicing
        ? await shareBicing(bicing)
        : 'failed';
    if (result === 'copied') setToast('Enllaç copiat al porta-retalls');
    else if (result === 'failed') setToast('No s’ha pogut compartir');
  };

  return (
    <>
      <button
        type="button"
        className={`share-btn share-btn--${variant}`}
        onClick={handleClick}
        aria-label={`Comparteix ${label}`}
        title="Comparteix"
      >
        <ShareIcon size={variant === 'block' ? 16 : 18} />
        {variant === 'block' && <span>Comparteix</span>}
      </button>
      {toast && (
        <Toast message={toast} tone="info" onDismiss={() => setToast(null)} />
      )}
    </>
  );
}
