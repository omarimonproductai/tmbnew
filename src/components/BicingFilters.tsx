import { BicingLogo } from './BicingLogo';
import type { BicingFilterState } from '../types/bicing';

interface Props {
  state: BicingFilterState;
  onToggleAgafar: () => void;
  onToggleRetornar: () => void;
  // 'round' (Bicing mode): circular, arrow-only — no "b" logo (already in
  // Bicing context). Default 'pill' (Aprop meu): logo + arrow, to stand apart
  // from the Metro/Bus chips.
  round?: boolean;
}

// Box + horizontal arrow leaving it (take a bike out).
function AgafarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// Box + horizontal arrow entering it (return a bike).
function RetornarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
  );
}

export function BicingFilters({ state, onToggleAgafar, onToggleRetornar, round }: Props) {
  const cls = round ? 'bicing-round-chip' : 'bicing-chip';
  return (
    <div className="bicing-chips" role="group" aria-label="Filtre Bicing">
      <button
        type="button"
        className={`${cls}${state.action === 'agafar' ? ' active' : ''}`}
        aria-pressed={state.action === 'agafar'}
        aria-label="Bicing: estacions amb bicis per agafar"
        onClick={onToggleAgafar}
        title="Estacions amb bicis per agafar"
      >
        {!round && <BicingLogo size={16} className="bicing-chip__logo" />}
        <AgafarIcon />
      </button>
      <button
        type="button"
        className={`${cls}${state.action === 'retornar' ? ' active' : ''}`}
        aria-pressed={state.action === 'retornar'}
        aria-label="Bicing: estacions amb ancoratges per retornar"
        onClick={onToggleRetornar}
        title="Estacions amb ancoratges per retornar"
      >
        {!round && <BicingLogo size={16} className="bicing-chip__logo" />}
        <RetornarIcon />
      </button>
    </div>
  );
}
