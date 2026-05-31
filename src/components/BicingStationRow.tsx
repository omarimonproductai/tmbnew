import { BicingLogo } from './BicingLogo';
import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { formatDistance } from '../utils/distance';
import { BICING_STATUS_LABEL, type BicingStation } from '../types/bicing';

interface Props {
  station: BicingStation;
  distanceM?: number | null;
  onSelect?: (id: string) => void;
  // Proximity position in the Aprop meu list (same orange circle as stops).
  rank?: number;
  topN?: number;
}

// Row used in the Aprop meu merged list (and reused in Favorits).
export function BicingStationRow({ station, distanceM, onSelect, rank, topN }: Props) {
  const { isBicingFav, toggleBicing } = useFavorits();
  const isTop = rank != null && topN != null ? rank <= topN : true;
  return (
    <div
      className={`bicing-row${onSelect ? ' clickable' : ''}`}
      onClick={onSelect ? () => onSelect(station.id) : undefined}
    >
      {rank != null && (
        <div className={`stop-rank${isTop ? '' : ' muted'}`}>{rank}</div>
      )}
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
          <span className="bicing-bmark" aria-hidden="true" title="Estació Bicing">
            <BicingLogo size={14} />
          </span>
          <span className="bicing-pill bicing-pill--elec" title="Bicis elèctriques">
            <span className="bicing-pill-ic" aria-hidden="true">⚡</span>
            {station.bikesElectric}
          </span>
          <span className="bicing-pill bicing-pill--mec" title="Bicis mecàniques">
            <span className="bicing-pill-ic" aria-hidden="true">🚲</span>
            {station.bikesMechanical}
          </span>
          <span className="bicing-pill bicing-pill--dock" title="Ancoratges lliures">
            <span className="bicing-pill-ic" aria-hidden="true">P</span>
            {station.docksAvailable}
          </span>
        </div>
      </div>
    </div>
  );
}
