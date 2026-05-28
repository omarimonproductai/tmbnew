import type { CooltraVehicle, CooltraKind } from '../types/cooltra';

interface Props {
  vehicle: CooltraVehicle;
  kind: CooltraKind;
}

export function CooltraVehiclePopup({ vehicle, kind }: Props) {
  const { license_plate, range, model_id, position } = vehicle;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${position.lat},${position.lon}`;
  return (
    <div className="cooltra-popup">
      <div className="cooltra-popup__head">
        <span className="cooltra-popup__kind">
          {kind === 'bike' ? '🚲 Bici' : '🛵 Moto'} Cooltra
        </span>
        <span className="cooltra-popup__plate">{license_plate}</span>
      </div>
      <div className="cooltra-popup__meta">
        <span>Autonomia: <strong>{Math.round(range)} km</strong></span>
        <span className="cooltra-popup__model">{model_id}</span>
      </div>
      <a
        className="cooltra-popup__dir"
        href={directionsHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        Com arribar-hi
      </a>
    </div>
  );
}
