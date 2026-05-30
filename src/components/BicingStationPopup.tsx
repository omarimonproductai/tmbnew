import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { formatDistance } from '../utils/distance';
import { BICING_STATUS_LABEL, type BicingStation } from '../types/bicing';

interface Props {
  station: BicingStation;
  distanceM?: number | null;
}

// Shared station detail card — used in the map popup (Aprop meu, Bicing mode,
// Favorits) and mirrored by BicingStationRow in the list.
export function BicingStationPopup({ station, distanceM }: Props) {
  const { isBicingFav, toggleBicing } = useFavorits();
  return (
    <div className="bicing-popup">
      <div className="bicing-popup-head">
        <span className="bicing-popup-name">{station.name}</span>
        <FavStar
          active={isBicingFav(station.id)}
          onToggle={() =>
            toggleBicing({
              id: station.id,
              name: station.name,
              lat: station.lat,
              lng: station.lng,
            })
          }
          size={20}
        />
      </div>
      <div className="bicing-popup-meta">
        <span className={`bicing-status bicing-status--${station.status}`}>
          {BICING_STATUS_LABEL[station.status]}
        </span>
        {distanceM != null && <span> · {formatDistance(distanceM)}</span>}
      </div>
      <BicingStats station={station} />
      <div className="bicing-cap">Capacitat total {station.capacity}</div>
    </div>
  );
}

export function BicingStats({ station }: { station: BicingStation }) {
  return (
    <div className="bicing-stats">
      <div className="bicing-stat bicing-stat--elec">
        <span className="bicing-stat__n">{station.bikesElectric}</span>
        <span className="bicing-stat__l">elèctriques</span>
      </div>
      <div className="bicing-stat bicing-stat--mec">
        <span className="bicing-stat__n">{station.bikesMechanical}</span>
        <span className="bicing-stat__l">mecàniques</span>
      </div>
      <div className="bicing-stat bicing-stat--dock">
        <span className="bicing-stat__n">{station.docksAvailable}</span>
        <span className="bicing-stat__l">ancoratges</span>
      </div>
    </div>
  );
}
