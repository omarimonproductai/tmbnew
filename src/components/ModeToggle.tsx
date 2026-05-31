import { BicingLogo } from './BicingLogo';
import { FgcLogo } from './FgcLogo';

export type AppMode = 'route' | 'linies' | 'fgc' | 'bicing' | 'aprop-meu' | 'favorits';

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
    value: 'fgc',
    label: 'FGC',
    icon: <FgcLogo size={18} />,
  },
  {
    value: 'bicing',
    label: 'Bicing',
    icon: <BicingLogo size={20} />,
  },
  {
    value: 'linies',
    label: 'Línies',
    // Monochrome "TMB" mark (currentColor) so it adapts like the other icons:
    // white on the red header, red on the active white pill.
    icon: (
      <svg width="30" height="19" viewBox="0 0 30 19" aria-hidden="true">
        <rect x="1" y="1" width="28" height="17" rx="4.5" fill="none" stroke="currentColor" strokeWidth={1.8} />
        <text x="15" y="14" textAnchor="middle" fontSize="11" fontWeight="900" fill="currentColor" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="-0.5">
          TMB
        </text>
      </svg>
    ),
  },
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
