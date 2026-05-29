export type ViewMode = 'map' | 'list';

interface Props {
  value: ViewMode;
  onChange: (m: ViewMode) => void;
}

// Single round button: shows the icon of the OTHER view. Tapping flips.
export function ViewToggle({ value, onChange }: Props) {
  const isMap = value === 'map';
  const next: ViewMode = isMap ? 'list' : 'map';
  return (
    <button
      type="button"
      className="view-toggle-btn"
      onClick={() => onChange(next)}
      aria-label={isMap ? 'Veure com a llista' : 'Veure al mapa'}
      title={isMap ? 'Veure com a llista' : 'Veure al mapa'}
    >
      {isMap ? <ListIcon /> : <MapIcon />}
    </button>
  );
}

function MapIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3 L3 6 L3 21 L9 18 L15 21 L21 18 L21 3 L15 6 Z" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      <circle cx="4.5" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
