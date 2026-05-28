interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  count?: number | null;
}

export function CooltraToggle({ value, onChange, count = null }: Props) {
  return (
    <button
      type="button"
      className={`cooltra-toggle${value ? ' on' : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      title={value ? 'Amaga la flota Cooltra' : 'Mostra la flota Cooltra'}
    >
      <span className="cooltra-toggle__emoji" aria-hidden="true">🛵</span>
      <span className="cooltra-toggle__label">Cooltra</span>
      {value && count != null && (
        <span className="cooltra-toggle__count">{count}</span>
      )}
    </button>
  );
}
