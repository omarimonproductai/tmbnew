import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { formatDistance } from '../utils/distance';
import { BICING_STATUS_LABEL, type BicingStation } from '../types/bicing';

interface Props {
  station: BicingStation;
  distanceM?: number | null;
}

// Row used in the "Estacions Bicing a prop" list (and reused in Favorits).
export function BicingStationRow({ station, distanceM }: Props) {
  const { isBicingFav, toggleBicing } = useFavorits();
  return (
    <div className="bicing-row">
      <div className="bicing-row-badge" aria-hidden="true">B</div>
      <div className="bicing-row-info">
        <div className="bicing-row-name-row">
          <div className="bicing-row-name" title={station.name}>{station.name}</div>
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
            size={18}
          />
        </div>
        <div className="bicing-row-meta">
          {distanceM != null && (
            <>
              <span className="meta-dist">{formatDistance(distanceM)}</span>
              <span>·</span>
            </>
          )}
          <span className={`bicing-status bicing-status--${station.status}`}>
            {BICING_STATUS_LABEL[station.status]}
          </span>
        </div>
        <div className="bicing-row-pills">
          <span className="bicing-pill bicing-pill--elec" title="Bicis elèctriques">
            ⚡ {station.bikesElectric}
          </span>
          <span className="bicing-pill bicing-pill--mec" title="Bicis mecàniques">
            🚲 {station.bikesMechanical}
          </span>
          <span className="bicing-pill bicing-pill--dock" title="Ancoratges lliures">
            P {station.docksAvailable}
          </span>
        </div>
      </div>
    </div>
  );
}
