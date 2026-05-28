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
      <img
        src="/cooltra-logo.jpg"
        alt=""
        className="cooltra-map-btn__logo"
        draggable={false}
      />
      {value && count != null && (
        <span className="cooltra-map-btn__count">{count}</span>
      )}
    </button>
  );
}
