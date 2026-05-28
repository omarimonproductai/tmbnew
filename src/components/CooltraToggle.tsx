interface Props {
  value: boolean;
  onChange: (v: boolean) => void;
  count?: number | null;
}

export function CooltraToggle({ value, onChange, count = null }: Props) {
  return (
    <button
      type="button"
      className={`filter-btn filter-btn--cooltra${value ? ' active' : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
      title={value ? 'Amaga la flota Cooltra' : 'Mostra la flota Cooltra'}
    >
      Cooltra
      {value && count != null && (
        <span className="filter-btn__count">{count}</span>
      )}
    </button>
  );
}
