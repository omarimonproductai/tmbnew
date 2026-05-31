import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { formatDistance } from '../utils/distance';
import { fgcLineColor } from '../utils/fgc';
import type { FgcParada } from '../types/fgc';

interface Props {
  parada: FgcParada;
  distanceM?: number | null;
  onSelect?: (id: string) => void;
  // When provided, the line badges become buttons that open that line's map
  // (used in Favorits, mirroring metro/bus badges). Omitted in Aprop meu.
  onOpenLine?: (codi: string) => void;
  rank?: number;
  topN?: number;
}

// Row used in the Aprop meu merged list (and reused in Favorits) for FGC stops.
export function FgcStationRow({ parada, distanceM, onSelect, onOpenLine, rank, topN }: Props) {
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
          {parada.liniesQueParen.map((codi) =>
            onOpenLine ? (
              <button
                key={codi}
                type="button"
                className="fgc-line-badge fgc-line-badge--sm fgc-line-badge--btn"
                style={{ background: fgcLineColor(codi) }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLine(codi);
                }}
                title={`Veure la línia ${codi} al mapa`}
              >
                {codi}
              </button>
            ) : (
              <span
                key={codi}
                className="fgc-line-badge fgc-line-badge--sm"
                style={{ background: fgcLineColor(codi) }}
              >
                {codi}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
