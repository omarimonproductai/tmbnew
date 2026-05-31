import { BicingLogo } from './BicingLogo';

export type AppMode = 'route' | 'linies' | 'bicing' | 'aprop-meu' | 'favorits';

interface Props {
  value: AppMode;
  onChange: (m: AppMode) => void;
}

interface Option {
  value: AppMode;
  label: string;
  icon: JSX.Element;
}

const OPTIONS: Option[] = [
  {
    value: 'route',
    label: 'Ruta',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11l18-8-8 18-2-8z" />
      </svg>
    ),
  },
  {
    value: 'linies',
    label: 'Línies',
    // Monochrome "TMB" mark (currentColor) so it adapts like the other icons:
    // white on the red header, red on the active white pill.
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" fill="none" stroke="currentColor" strokeWidth={2} />
        <text x="12" y="15.4" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="currentColor" fontFamily="inherit" letterSpacing="-0.3">
          TMB
        </text>
      </svg>
    ),
  },
  {
    value: 'bicing',
    label: 'Bicing',
    icon: <BicingLogo size={20} />,
  },
  {
    value: 'aprop-meu',
    label: 'Aprop meu',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <line x1="12" y1="3" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    value: 'favorits',
    label: 'Favorits',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15 8.5 22 9.3 17 14.2 18.2 21 12 17.8 5.8 21 7 14.2 2 9.3 9 8.5 12 2" />
      </svg>
    ),
  },
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
          aria-label={o.label}
          className={`mode-btn${value === o.value ? ' active' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          <span className="mode-btn__label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
