export type SortMode = 'proximity' | 'az' | 'za';

interface Props {
  value: SortMode;
  onChange: (m: SortMode) => void;
  proximityAvailable: boolean;
}

export function SortControls({ value, onChange, proximityAvailable }: Props) {
  const onProximityClick = () => {
    if (!proximityAvailable) return;
    onChange('proximity');
  };
  const onAlphaClick = () => {
    if (value === 'proximity') onChange('az');
    else if (value === 'az') onChange('za');
    else onChange('az');
  };

  const proximityActive = value === 'proximity';
  const alphaActive = value !== 'proximity';

  return (
    <div className="sort-controls" role="group" aria-label="Ordenació">
      <button
        type="button"
        className={`sort-btn${proximityActive ? ' active' : ''}`}
        onClick={onProximityClick}
        disabled={!proximityAvailable}
        aria-pressed={proximityActive}
        title={
          proximityAvailable
            ? 'Ordenar per proximitat'
            : 'Proximitat (cal geolocalització)'
        }
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="10" r="3" />
          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
        </svg>
      </button>
      <button
        type="button"
        className={`sort-btn${alphaActive ? ' active' : ''}`}
        onClick={onAlphaClick}
        aria-pressed={alphaActive}
        title={
          value === 'za'
            ? 'Ordenat Z → A (toca per canviar)'
            : value === 'az'
              ? 'Ordenat A → Z (toca per canviar)'
              : 'Ordenar alfabèticament'
        }
      >
        <span className="sort-alpha-letters" aria-hidden="true">
          {value === 'za' ? 'Z·A' : 'A·Z'}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`sort-alpha-arrow${value === 'za' ? ' up' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
