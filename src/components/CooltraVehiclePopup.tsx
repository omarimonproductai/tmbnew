import type { CooltraVehicle, CooltraKind } from '../types/cooltra';

interface Props {
  vehicle: CooltraVehicle;
  kind: CooltraKind;
}

export function CooltraVehiclePopup({ vehicle, kind }: Props) {
  const { id, license_plate, range } = vehicle;
  const km = Math.round((range ?? 0) / 1000);
  const reserveHref = `https://link.cooltra.com/reserve?vehicle_id=${encodeURIComponent(id)}`;
  return (
    <div className="cooltra-popup">
      <div className="cooltra-popup__head">
        <span className="cooltra-popup__kind">
          <span
            className={`cooltra-glyph cooltra-glyph--${kind} cooltra-glyph--${kind === 'bike' ? 'green' : 'blue'}`}
          />
          {kind === 'bike' ? 'Bici' : 'Moto'} Cooltra
        </span>
        <span className="cooltra-popup__plate">{license_plate}</span>
      </div>
      <div className="cooltra-popup__meta">
        <span>Autonomia: <strong>{km} km</strong></span>
      </div>
      <a
        className="cooltra-popup__cta"
        href={reserveHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        Reserva gratis
      </a>
    </div>
  );
}
