import type { CooltraVehicle, CooltraKind } from '../types/cooltra';

interface Props {
  vehicle: CooltraVehicle;
  kind: CooltraKind;
}

const ICON_COLOR = '#1098f0';

const BIKE_ICON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={ICON_COLOR}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M5.5 17.5 10 9h5l3.5 8.5" />
    <path d="M10 9l-2-3h2" />
    <path d="M15 9V6h-1" />
  </svg>
);

const SCOOTER_ICON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke={ICON_COLOR}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="5.5" cy="17.5" r="3" />
    <circle cx="18.5" cy="17.5" r="3" />
    <path d="M5.5 17.5h6l2-5h4" />
    <path d="M17.5 12.5l1-5h-3" />
    <path d="M11.5 12.5l2-4" />
  </svg>
);

export function CooltraVehiclePopup({ vehicle, kind }: Props) {
  const { id, license_plate, range } = vehicle;
  const km = Math.round((range ?? 0) / 1000);
  const reserveHref = `https://link.cooltra.com/reserve?vehicle_id=${encodeURIComponent(id)}`;
  return (
    <div className="cooltra-popup">
      <div className="cooltra-popup__head">
        <span className="cooltra-popup__kind">
          {kind === 'bike' ? BIKE_ICON : SCOOTER_ICON}
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
