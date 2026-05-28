import type { GeocodeResult, GeocodeCategory } from '../types/geocode';

interface Props {
  results: GeocodeResult[];
  onSelect: (r: GeocodeResult) => void;
  loading?: boolean;
  empty?: React.ReactNode;
}

function CategoryIcon({ category }: { category?: GeocodeCategory }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (category === 'transit') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    );
  }
  if (category === 'street') {
    return (
      <svg {...common}>
        <line x1="4" y1="12" x2="20" y2="12" />
        <polyline points="14 6 20 12 14 18" />
      </svg>
    );
  }
  if (category === 'place') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  // poi / house
  return (
    <svg {...common}>
      <path d="M12 21s-7-7.5-7-13a7 7 0 0114 0c0 5.5-7 13-7 13z" />
      <circle cx="12" cy="8" r="2.5" />
    </svg>
  );
}

export function GeocodeDropdown({ results, onSelect, loading = false, empty }: Props) {
  if (loading) {
    return (
      <div className="planner-dropdown">
        <div className="planner-dropdown__msg">Buscant…</div>
      </div>
    );
  }
  if (results.length === 0) {
    if (!empty) return null;
    return <div className="planner-dropdown">{empty}</div>;
  }
  return (
    <div className="planner-dropdown" role="listbox">
      {results.map((r) => (
        <button
          key={r.id}
          type="button"
          role="option"
          className="planner-drop-item"
          onClick={() => onSelect(r)}
        >
          <span className="planner-drop-icon">
            <CategoryIcon category={r.category} />
          </span>
          <span className="planner-drop-text">
            <span className="planner-drop-name">{r.name}</span>
            {r.sub && <span className="planner-drop-sub">{r.sub}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
