import type { CooltraVehicle, CooltraKind } from '../types/cooltra';

interface Props {
  vehicle: CooltraVehicle;
  kind: CooltraKind;
}

const ICON_STROKE: Record<CooltraKind, string> = {
  bike: '#00c853',
  scooter: '#3080e0',
};

const BIKE_ICON = (color: string) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="5.5" cy="17" r="3" />
    <circle cx="18.5" cy="17" r="3" />
    <path d="M5.5 17 8 13.5l3 3.5" />
    <path d="M11 17l3.5-6" />
    <path d="M14.5 11l4 6" />
    <rect x="14" y="8" width="5" height="3" rx="0.4" />
    <path d="M16 8V6.5" />
  </svg>
);

const SCOOTER_ICON = (color: string) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="5" cy="17.5" r="2.5" />
    <circle cx="19" cy="17.5" r="2.5" />
    <path d="M5 17.5h4l3-3 3 1.5h4" />
    <path d="M12 14.5l-2.5-4h-2" />
    <path d="M16 10h3l-1.5 3" />
  </svg>
);

export function CooltraVehiclePopup({ vehicle, kind }: Props) {
  const { id, license_plate, range } = vehicle;
  const km = Math.round((range ?? 0) / 1000);
  const reserveHref = `https://link.cooltra.com/reserve?vehicle_id=${encodeURIComponent(id)}`;
  const stroke = ICON_STROKE[kind];
  return (
    <div className="cooltra-popup">
      <div className="cooltra-popup__head">
        <span className="cooltra-popup__kind">
          {kind === 'bike' ? BIKE_ICON(stroke) : SCOOTER_ICON(stroke)}
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
