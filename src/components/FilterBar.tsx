import type { FilterType } from '../hooks/useLinies';

interface Props {
  value: FilterType;
  onChange: (v: FilterType) => void;
}

// Independent toggles: tap Metro or Bus to flip its visibility. The combined
// state still resolves to one of 'tots' | 'metro' | 'bus' so the rest of the
// app keeps working unchanged. Both can't be off — the last enabled chip
// stays sticky.
export function FilterBar({ value, onChange }: Props) {
  const metroOn = value === 'tots' || value === 'metro';
  const busOn = value === 'tots' || value === 'bus';

  const toggleMetro = () => {
    if (metroOn) {
      // Try to turn off metro
      if (!busOn) return; // would leave both off; ignore
      onChange('bus');
    } else {
      onChange(busOn ? 'tots' : 'metro');
    }
  };

  const toggleBus = () => {
    if (busOn) {
      if (!metroOn) return;
      onChange('metro');
    } else {
      onChange(metroOn ? 'tots' : 'bus');
    }
  };

  return (
    <div className="filters" role="group" aria-label="Filtre per tipus de transport">
      <button
        type="button"
        aria-pressed={metroOn}
        className={`filter-btn${metroOn ? ' active' : ''}`}
        onClick={toggleMetro}
      >
        Metro
      </button>
      <button
        type="button"
        aria-pressed={busOn}
        className={`filter-btn${busOn ? ' active' : ''}`}
        onClick={toggleBus}
      >
        Bus
      </button>
    </div>
  );
}
