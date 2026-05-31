import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { formatDistance } from '../utils/distance';
import { fgcLineColor } from '../utils/fgc';
import type { FgcParada } from '../types/fgc';

interface Props {
  parada: FgcParada;
  distanceM?: number | null;
  onSelect?: (id: string) => void;
  rank?: number;
  topN?: number;
}

// Row used in the Aprop meu merged list (and reused in Favorits) for FGC stops.
export function FgcStationRow({ parada, distanceM, onSelect, rank, topN }: Props) {
  const { isFgcFav, toggleFgc } = useFavorits();
  const isTop = rank != null && topN != null ? rank <= topN : true;
  return (
    <div
      className={`bicing-row${onSelect ? ' clickable' : ''}`}
      onClick={onSelect ? () => onSelect(parada.id) : undefined}
    >
      {rank != null && (
        <div className={`stop-rank${isTop ? '' : ' muted'}`}>{rank}</div>
      )}
      <div className="bicing-row-info">
        <div className="bicing-row-name-row">
          <div className="bicing-row-name" title={parada.nom}>{parada.nom}</div>
          <FavStar
            active={isFgcFav(parada.id)}
            onToggle={() =>
              toggleFgc({
                id: parada.id,
                codi: parada.codi,
                nom: parada.nom,
                lat: parada.lat,
                lng: parada.lng,
                liniesQueParen: parada.liniesQueParen,
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
          <span className="fgc-row-tag">FGC</span>
        </div>
        <div className="bicing-row-pills">
          {parada.liniesQueParen.map((codi) => (
            <span
              key={codi}
              className="fgc-line-badge fgc-line-badge--sm"
              style={{ background: fgcLineColor(codi) }}
            >
              {codi}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
