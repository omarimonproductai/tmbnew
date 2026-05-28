import type { CooltraVehicle, CooltraKind } from '../types/cooltra';

interface Props {
  vehicle: CooltraVehicle;
  kind: CooltraKind;
}

export function CooltraVehiclePopup({ vehicle, kind }: Props) {
  const { id, license_plate, range, position } = vehicle;
  const [lng, lat] = position;
  const km = Math.round((range ?? 0) / 1000);
  const reserveHref = `https://link.cooltra.com/reserve?vehicle_id=${encodeURIComponent(id)}`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return (
    <div className="cooltra-popup">
      <div className="cooltra-popup__head">
        <span className="cooltra-popup__kind">
          {kind === 'bike' ? '🚲 Bici' : '🛵 Moto'} Cooltra
        </span>
        <span className="cooltra-popup__plate">{license_plate}</span>
      </div>
      <div className="cooltra-popup__meta">
        <span>Autonomia: <strong>{km} km</strong></span>
      </div>
      {kind === 'scooter' ? (
        <a
          className="cooltra-popup__cta cooltra-popup__cta--reserve"
          href={reserveHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Reserva gratis
        </a>
      ) : (
        <a
          className="cooltra-popup__cta cooltra-popup__cta--directions"
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          Com arribar-hi
        </a>
      )}
    </div>
  );
}
