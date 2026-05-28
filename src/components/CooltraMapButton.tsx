interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  count?: number | null;
}

export function CooltraMapButton({ value, onChange, count = null }: Props) {
  return (
    <button
      type="button"
      className={`cooltra-map-btn${value ? ' active' : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      title={value ? 'Amaga la flota Cooltra' : 'Mostra la flota Cooltra'}
    >
      <ScooterIcon />
      {value && count != null && (
        <span className="cooltra-map-btn__count">{count}</span>
      )}
    </button>
  );
}

function ScooterIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5.5" cy="17.5" r="3" />
      <circle cx="18.5" cy="17.5" r="3" />
      <path d="M5.5 17.5h6l2-5h4" />
      <path d="M17.5 12.5l1-5h-3" />
      <path d="M11.5 12.5l2-4" />
    </svg>
  );
}
