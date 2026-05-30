import type { Coordinate } from '../types/tmb';
import type { GeoStatus } from '../hooks/useGeolocation';

interface Props {
  position: Coordinate | null;
  status: GeoStatus;
  error: string | null;
  radius: number;
  onRadiusChange: (r: number) => void;
}

// The location auto-updates (GPS polls every ~10s) so there's no manual
// refresh button — it wasn't doing anything the user couldn't already see.
export function LocationBlock({ position, status, error, radius, onRadiusChange }: Props) {
  const sub = subtitleFor(status, position, error);
  return (
    <div className="location-block">
      <div className="location-row">
        <div className="geo-dot" data-status={status} />
        <div className="location-info">
          <div className="location-title">{titleFor(status)}</div>
          {sub && <div className="location-sub">{sub}</div>}
        </div>
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
  // Coordinates and accuracy are intentionally not shown (not useful).
  if (s === 'granted' && position) return '';
  if (s === 'denied' || s === 'unavailable') return error ?? '—';
  if (s === 'requesting') return 'Esperant resposta del navegador…';
  return 'Esperant ubicació…';
}

function formatRadius(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}
