import { openDirections } from '../utils/directions';

interface Props {
  lat: number;
  lng: number;
  nom?: string;
  variant?: 'inline' | 'block';
}

export function DirectionsButton({ lat, lng, nom, variant = 'inline' }: Props) {
  return (
    <button
      type="button"
      className={`directions-btn directions-btn--${variant}`}
      onClick={(e) => {
        e.stopPropagation();
        openDirections({ lat, lng, nom });
      }}
      aria-label={nom ? `Indicacions cap a ${nom}` : 'Indicacions'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
      <span>Indicacions</span>
    </button>
  );
}
