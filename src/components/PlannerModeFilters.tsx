interface Props {
  metro: boolean;
  bus: boolean;
  onMetroChange: (v: boolean) => void;
  onBusChange: (v: boolean) => void;
}

export function PlannerModeFilters({ metro, bus, onMetroChange, onBusChange }: Props) {
  return (
    <div className="planner-modes" role="group" aria-label="Modes de transport">
      <button
        type="button"
        className={`planner-mode-pill${metro ? ' active' : ''}`}
        onClick={() => onMetroChange(!metro)}
        aria-pressed={metro}
      >
        <svg width="14" height="9" viewBox="0 0 36 22" fill="none" aria-hidden="true">
          <path
            d="M2 4 Q2 2 4 2 L28 2 Q34 2 34 9 Q34 16 28 16 L4 16 Q2 16 2 14 Z"
            fill="currentColor"
          />
        </svg>
        Metro
      </button>
      <button
        type="button"
        className={`planner-mode-pill${bus ? ' active' : ''}`}
        onClick={() => onBusChange(!bus)}
        aria-pressed={bus}
      >
        <svg width="14" height="9" viewBox="0 0 36 22" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="32" height="14" rx="3" fill="currentColor" />
        </svg>
        Bus
      </button>
    </div>
  );
}
