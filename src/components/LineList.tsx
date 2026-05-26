import type { Linia } from '../types/tmb';

const TYPE_LABEL: Record<Linia['tipus'], string> = {
  metro: 'Metro',
  bus: 'Bus',
};

function TypeIcon({ tipus }: { tipus: Linia['tipus'] }) {
  if (tipus === 'metro') {
    // Subway carriage silhouette: front view with two windows + nose.
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="line-type-icon">
        <path d="M12 2c-4 0-7 1-7 5v8a3 3 0 0 0 3 3l-1 2v.5h2L10.5 18h3l1.5 2.5h2V20l-1-2a3 3 0 0 0 3-3V7c0-4-3-5-7-5zm-4.5 5.5h9V11h-9V7.5zM9 15.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm6 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
      </svg>
    );
  }
  // Bus front view: body + windscreen + wheels.
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="line-type-icon">
      <path d="M5 4c-1 0-1.5.5-1.5 1.5v11A1.5 1.5 0 0 0 5 18v1.5a.75.75 0 0 0 1.5 0V18h11v1.5a.75.75 0 0 0 1.5 0V18a1.5 1.5 0 0 0 1.5-1.5v-11C20.5 4.5 20 4 19 4H5zm.5 3h13v4.5h-13V7zm1.75 8a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm9.5 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}

interface Props {
  linies: Linia[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (linia: Linia) => void;
}

export function LineList({ linies, selectedId, loading, error, onSelect }: Props) {
  if (loading) {
    return (
      <div className="state-msg" aria-live="polite">
        Carregant línies…
      </div>
    );
  }
  if (error) {
    return (
      <div className="state-msg state-msg--error" role="alert">
        No s'han pogut carregar les línies. {error}
      </div>
    );
  }
  if (linies.length === 0) {
    return <div className="state-msg">Cap línia coincideix amb la cerca.</div>;
  }
  return (
    <div className="line-list" role="list">
      {linies.map((l) => {
        const active = l.id === selectedId;
        return (
          <button
            key={l.id}
            type="button"
            role="listitem"
            className={`line-item${active ? ' active' : ''}`}
            onClick={() => onSelect(l)}
            aria-current={active}
          >
            <span
              className={`line-type-glyph line-type-glyph--${l.tipus}`}
              title={TYPE_LABEL[l.tipus]}
              aria-label={TYPE_LABEL[l.tipus]}
            >
              <TypeIcon tipus={l.tipus} />
            </span>
            <span
              className="line-badge"
              style={{ background: l.color }}
              aria-hidden="true"
            >
              {l.codi}
            </span>
            <span className="line-info">
              <span className="line-name" title={l.nom}>
                {l.nom}
              </span>
            </span>
            {typeof l.numParades === 'number' && (
              <span className="line-count">{l.numParades} par.</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
