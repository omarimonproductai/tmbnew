import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AproperMeuStopPopup } from './AproperMeuStopPopup';
import type { ParadaAmbLinies } from '../types/tmb';

interface Props {
  stop: ParadaAmbLinies;
  onClose: () => void;
}

// Landing for a shared ?parada= link: shows the stop with all its lines and
// real-time arrivals, regardless of where the recipient is.
export function SharedStopSheet({ stop, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="shared-backdrop" role="presentation" onClick={onClose}>
      <div
        className="shared-stop-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Parada ${stop.nom}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shared-stop-head">
          <span className="shared-stop-tag">Parada compartida</span>
          <button
            type="button"
            className="shared-stop-close"
            onClick={onClose}
            aria-label="Tanca"
          >
            ×
          </button>
        </div>
        <AproperMeuStopPopup parada={stop} enabled />
      </div>
    </div>,
    document.body,
  );
}
