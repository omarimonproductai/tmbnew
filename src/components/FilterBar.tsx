import type { ReactNode } from 'react';
import type { FilterType } from '../hooks/useLinies';

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'tots', label: 'Tots' },
  { value: 'metro', label: 'Metro' },
  { value: 'bus', label: 'Bus' },
];

interface Props {
  value: FilterType;
  onChange: (v: FilterType) => void;
  extra?: ReactNode;
}

export function FilterBar({ value, onChange, extra }: Props) {
  return (
    <div className="filters" role="tablist" aria-label="Filtre per tipus de transport">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          role="tab"
          aria-selected={value === f.value}
          className={`filter-btn${value === f.value ? ' active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
      {extra}
    </div>
  );
}
