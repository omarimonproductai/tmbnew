export type AppMode = 'linies' | 'aprop-meu' | 'favorits';

interface Props {
  value: AppMode;
  onChange: (m: AppMode) => void;
}

const OPTIONS: { value: AppMode; label: string }[] = [
  { value: 'linies', label: 'Línies' },
  { value: 'aprop-meu', label: 'Aprop meu' },
];

export function ModeToggle({ value, onChange }: Props) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="Mode de visualització">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
      <button
        type="button"
        role="tab"
        aria-selected={value === 'favorits'}
        aria-label="Favorits"
        className={`mode-fav${value === 'favorits' ? ' active' : ''}`}
        onClick={() => onChange('favorits')}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={value === 'favorits' ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={value === 'favorits' ? 0 : 2}
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.96 6.1 20.5l1.1-6.47-4.7-4.58 6.5-.95z" />
        </svg>
      </button>
    </div>
  );
}
