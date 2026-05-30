import type { FilterType } from '../hooks/useLinies';

interface Props {
  value: FilterType;
  onChange: (v: FilterType) => void;
}

// Independent toggles: tap Metro or Bus to flip its visibility. The combined
// state resolves to one of 'tots' | 'metro' | 'bus' | 'cap' so the rest of the
// app keeps working unchanged. Both off ('cap') is allowed and shows nothing.
export function FilterBar({ value, onChange }: Props) {
  const metroOn = value === 'tots' || value === 'metro';
  const busOn = value === 'tots' || value === 'bus';

  const resolve = (metro: boolean, bus: boolean): FilterType => {
    if (metro && bus) return 'tots';
    if (metro) return 'metro';
    if (bus) return 'bus';
    return 'cap';
  };

  const toggleMetro = () => onChange(resolve(!metroOn, busOn));
  const toggleBus = () => onChange(resolve(metroOn, !busOn));

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
