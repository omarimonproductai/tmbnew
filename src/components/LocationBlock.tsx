import { useCooldown } from '../hooks/useCooldown';
import type { Coordinate } from '../types/tmb';
import type { GeoStatus } from '../hooks/useGeolocation';

// Manual refresh re-fetches the live Bicing counts (and the GPS fix). The
// Bicing backend caches for 15s, so we gate the button with a matching
// cooldown and surface the countdown so the user knows why it's waiting.
const REFRESH_COOLDOWN_MS = 15_000;

interface Props {
  position: Coordinate | null;
  status: GeoStatus;
  error: string | null;
  onRefresh: () => void;
  radius: number;
  onRadiusChange: (r: number) => void;
}

export function LocationBlock({
  position,
  status,
  error,
  onRefresh,
  radius,
  onRadiusChange,
}: Props) {
  const cooldown = useCooldown(REFRESH_COOLDOWN_MS);
  const requesting = status === 'requesting';
  const disabled = requesting || cooldown.isActive;
  const sub = subtitleFor(status, position, error);

  const handleClick = () => {
    if (disabled) return;
    onRefresh();
    cooldown.start();
  };

  const secsLeft = Math.ceil(cooldown.remainingMs / 1000);

  return (
    <div className="location-block">
      <div className="location-row">
        <div className="geo-dot" data-status={status} />
        <div className="location-info">
          <div className="location-title">{titleFor(status)}</div>
          {sub && <div className="location-sub">{sub}</div>}
        </div>
        <button
          type="button"
          className={`geo-btn${cooldown.isActive ? ' cooldown' : ''}`}
          onClick={handleClick}
          disabled={disabled}
          title={
            cooldown.isActive
              ? `Pots tornar a actualitzar en ${secsLeft}s`
              : 'Actualitzar ubicació i dades'
          }
        >
          {requesting ? 'Buscant…' : cooldown.isActive ? `Espera ${secsLeft}s` : 'Actualitzar'}
        </button>
      </div>
      <div className="radius-row">
        <label htmlFor="radius">Radi</label>
        <input
          type="range"
          id="radius"
          min={100}
          max={1500}
          step={50}
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        />
        <span className="radius-value">{formatRadius(radius)}</span>
      </div>
    </div>
  );
}

function titleFor(s: GeoStatus) {
  switch (s) {
    case 'granted':
      return 'La meva ubicació';
    case 'requesting':
      return 'Buscant ubicació…';
    case 'denied':
      return 'Permís denegat';
    case 'unavailable':
      return 'Ubicació no disponible';
    default:
      return 'Sense ubicació';
  }
}

function subtitleFor(
  s: GeoStatus,
  position: Coordinate | null,
  error: string | null,
): string {
  // Coordinates and accuracy are intentionally not shown (not useful to the
  // user). Granted state needs no subtitle.
  if (s === 'granted' && position) return '';
  if (s === 'denied' || s === 'unavailable') return error ?? '—';
  if (s === 'requesting') return 'Esperant resposta del navegador…';
  return 'Prem "Actualitzar" per fer servir la teva posició.';
}

function formatRadius(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}
