import { seedPlannerDestination } from '../utils/plannerSeed';

interface Props {
  name: string;
  lat: number;
  lng: number;
  variant?: 'block' | 'icon';
}

export function RouteHereButton({ name, lat, lng, variant = 'block' }: Props) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    seedPlannerDestination({ name, lat, lng });
  };
  return (
    <button
      type="button"
      className={`route-here-btn route-here-btn--${variant}`}
      onClick={handleClick}
      aria-label={`Planificar ruta fins a ${name}`}
      title="Ruta fins aquí"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11l18-8-8 18-2-8z" />
      </svg>
      {variant === 'block' && <span>Ruta fins aquí</span>}
    </button>
  );
}
