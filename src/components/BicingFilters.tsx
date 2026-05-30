import { BICING_TYPE_LABEL, type BicingFilterState } from '../types/bicing';

interface Props {
  state: BicingFilterState;
  onToggleAgafar: () => void;
  onToggleRetornar: () => void;
  onSetType: (t: 'electric' | 'mecanic') => void;
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

export function BicingFilters({ state, onToggleAgafar, onToggleRetornar, onSetType }: Props) {
  return (
    <div className="bicing-chips" role="group" aria-label="Filtre Bicing">
      <button
        type="button"
        className={`bicing-chip${state.action === 'agafar' ? ' active' : ''}`}
        aria-pressed={state.action === 'agafar'}
        onClick={onToggleAgafar}
        title="Estacions amb bicis per agafar"
      >
        <AgafarIcon />
        <span className="bicing-chip__t">Agafar</span>
      </button>
      <button
        type="button"
        className={`bicing-chip${state.action === 'retornar' ? ' active' : ''}`}
        aria-pressed={state.action === 'retornar'}
        onClick={onToggleRetornar}
        title="Estacions amb ancoratges per retornar"
      >
        <RetornarIcon />
        <span className="bicing-chip__t">Retornar</span>
      </button>

      {state.action === 'retornar' && (
        <>
          <button
            type="button"
            className={`bicing-type-chip bicing-type-chip--elec${state.type === 'electric' ? ' active' : ''}`}
            aria-pressed={state.type === 'electric'}
            onClick={() => onSetType('electric')}
            title={`Retornar bici ${BICING_TYPE_LABEL.electric}`}
          >
            ⚡
          </button>
          <button
            type="button"
            className={`bicing-type-chip bicing-type-chip--mec${state.type === 'mecanic' ? ' active' : ''}`}
            aria-pressed={state.type === 'mecanic'}
            onClick={() => onSetType('mecanic')}
            title={`Retornar bici ${BICING_TYPE_LABEL.mecanic}`}
          >
            🚲
          </button>
        </>
      )}
    </div>
  );
}
