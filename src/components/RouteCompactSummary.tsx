import type { GeocodeResult } from '../types/geocode';

interface Props {
  origin: GeocodeResult | null;
  destination: GeocodeResult | null;
  onEdit: () => void;
}

export function RouteCompactSummary({ origin, destination, onEdit }: Props) {
  return (
    <button
      type="button"
      className="planner-compact-summary"
      onClick={onEdit}
      aria-label="Edita els punts de la ruta"
    >
      <span className="planner-compact-icons">
        <span className="planner-dot planner-dot--origin" />
        <span className="planner-compact-line" />
        <span className="planner-dot planner-dot--dest" />
      </span>
      <span className="planner-compact-text">
        <span className="planner-compact-name">{origin?.name ?? '—'}</span>
        <span className="planner-compact-name">{destination?.name ?? '—'}</span>
      </span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    </button>
  );
}
