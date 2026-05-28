interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
}

export function CooltraMapButton({ value, onChange }: Props) {
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
    </button>
  );
}
