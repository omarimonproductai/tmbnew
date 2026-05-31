import { DirectionsButton } from './DirectionsButton';
import { FavStar } from './FavStar';
import { RouteHereButton } from './RouteHereButton';
import { ShareButton } from './ShareButton';
import { useFavorits } from '../hooks/useFavorits';
import { useFgcArribades } from '../hooks/useFgcArribades';
import { fgcLineColor } from '../utils/fgc';
import type { FgcParada } from '../types/fgc';

interface Props {
  parada: FgcParada;
  enabled: boolean;
  distanceM?: number | null;
}

// Shared FGC stop card — map popup (FGC mode, Aprop meu, Favorits) and list row.
export function FgcStationPopup({ parada, enabled, distanceM }: Props) {
  const { isFgcFav, toggleFgc } = useFavorits();
  const { data, loading } = useFgcArribades(parada.codi, enabled);
  const hasArrivals = !!data && data.disponible && data.arribades.length > 0;

  return (
    <div className="aprop-popup">
      <div className="aprop-popup-head">
        <span className="aprop-popup-name">{parada.nom}</span>
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
          size={20}
        />
      </div>
      <div className="aprop-popup-lines">
        {parada.liniesQueParen.map((codi) => (
          <span
            key={codi}
            className="aprop-popup-badge"
            style={{ background: fgcLineColor(codi) }}
          >
            {codi}
          </span>
        ))}
        {distanceM != null && (
          <span className="fgc-popup-dist"> · {Math.round(distanceM)} m</span>
        )}
      </div>
      {loading && !data && (
        <div className="aprop-popup-status">Consultant temps real…</div>
      )}
      {hasArrivals ? (
        <div className="aprop-popup-arrivals">
          <ul>
            {data!.arribades.slice(0, 4).map((a, idx) => (
              <li key={`${a.liniaCodi}-${idx}`}>
                {a.liniaCodi && (
                  <span
                    className="aprop-popup-inline-badge"
                    style={{ background: fgcLineColor(a.liniaCodi) }}
                  >
                    {a.liniaCodi}
                  </span>
                )}
                {a.destinacio && <span className="aprop-popup-dest"> → {a.destinacio}</span>}
                <span className="aprop-popup-time">{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        data && (
          <div className="aprop-popup-status">Sense temps real ara mateix.</div>
        )
      )}
      <div className="aprop-popup-actions">
        <RouteHereButton name={parada.nom} lat={parada.lat} lng={parada.lng} variant="block" />
        <DirectionsButton lat={parada.lat} lng={parada.lng} nom={parada.nom} variant="icon" />
        <ShareButton bicing={{ name: parada.nom, lat: parada.lat, lng: parada.lng }} variant="icon" />
      </div>
    </div>
  );
}
