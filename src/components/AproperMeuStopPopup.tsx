import { useEffect, useRef } from 'react';
import { DirectionsButton } from './DirectionsButton';
import { RouteHereButton } from './RouteHereButton';
import { FavStar } from './FavStar';
import { ShareButton } from './ShareButton';
import { useFavorits } from '../hooks/useFavorits';
import { useTempsReal } from '../hooks/useTempsReal';
import { getLineColor } from '../utils/lineColor';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type { LiniaResum, ParadaAmbLinies } from '../types/tmb';

interface Props {
  // Accepts any stop with lines (ParadaAprop, FavParada, …) — we only read
  // the common ParadaAmbLinies fields here.
  parada: ParadaAmbLinies;
  enabled: boolean;
  // Called when the popup's content resizes (real-time data loads grow it)
  // so the parent can re-trigger Leaflet autoPan.
  onContentResize?: () => void;
}

export function AproperMeuStopPopup({ parada, enabled, onContentResize }: Props) {
  const primary = parada.liniesQueParen[0];
  const { data, loading, error } = useTempsReal(
    primary ? parada.tipus : null,
    primary?.codi ?? null,
    parada.codi,
    enabled && !!primary,
    true,
  );
  const { isParadaFav, toggleParada } = useFavorits();

  const hasArrivals =
    !!data && data.disponible && data.arribades.length > 0;

  // Real-time arrivals load asynchronously and grow the popup vertically.
  // Tell the parent so it can re-trigger Leaflet's autoPan and keep the
  // popup fully on screen (not hidden behind the app header).
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!onContentResize || !wrapRef.current) return;
    if (typeof ResizeObserver === 'undefined') {
      onContentResize();
      return;
    }
    const ro = new ResizeObserver(() => onContentResize());
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [onContentResize]);

  return (
    <div ref={wrapRef} className="aprop-popup">
      <div className="aprop-popup-head">
        <span className="aprop-popup-name">{parada.nom}</span>
        <FavStar
          active={isParadaFav(parada.id)}
          onToggle={() =>
            toggleParada({
              id: parada.id,
              codi: parada.codi,
              nom: parada.nom,
              lat: parada.lat,
              lng: parada.lng,
              tipus: parada.tipus,
              liniesQueParen: parada.liniesQueParen,
            })
          }
          size={20}
        />
      </div>
      {!hasArrivals && (
        <div className="aprop-popup-lines">
          {parada.liniesQueParen.map((l) => (
            <span
              key={l.id}
              className="aprop-popup-badge"
              style={{ background: getLineColor(l) }}
            >
              {l.codi}
            </span>
          ))}
        </div>
      )}
      <ArribadesBlock
        loading={loading}
        error={error}
        data={data}
        liniesQueParen={parada.liniesQueParen}
      />
      <div className="aprop-popup-actions">
        <RouteHereButton
          name={parada.nom}
          lat={parada.lat}
          lng={parada.lng}
          variant="block"
        />
        <DirectionsButton
          lat={parada.lat}
          lng={parada.lng}
          nom={parada.nom}
          variant="block"
        />
        <ShareButton parada={parada} variant="block" />
      </div>
    </div>
  );
}

function ArribadesBlock({
  loading,
  error,
  data,
  liniesQueParen,
}: {
  loading: boolean;
  error: string | null;
  data: ReturnType<typeof useTempsReal>['data'];
  liniesQueParen: LiniaResum[];
}) {
  if (loading && !data) {
    return <div className="aprop-popup-status">Consultant temps real…</div>;
  }
  if (error) {
    return <div className="aprop-popup-status error">Temps real no disponible.</div>;
  }
  if (!data) return null;
  if (!data.disponible || data.arribades.length === 0) {
    return (
      <div className="aprop-popup-status">Sense vehicles propers ara mateix.</div>
    );
  }

  const colorByCodi = new Map<string, string>();
  for (const l of liniesQueParen) colorByCodi.set(l.codi, getLineColor(l));

  const groups = groupArrivalsByDestination(data.arribades.slice(0, 10));
  return (
    <div className="aprop-popup-arrivals">
      {groups.map((g) => (
        <div key={g.destinacio} className="aprop-popup-group">
          <div className="aprop-popup-dest">→ {g.destinacio || '—'}</div>
          <ul>
            {g.arribades.slice(0, 3).map((a, idx) => {
              const imminent = a.text.toLowerCase().includes('arribant');
              const color = colorByCodi.get(a.liniaCodi) ?? '#888';
              return (
                <li key={`${a.liniaCodi}-${idx}`}>
                  <span
                    className="aprop-popup-inline-badge"
                    style={{ background: color }}
                  >
                    {a.liniaCodi || '—'}
                  </span>
                  <span
                    className={`aprop-popup-time${imminent ? ' imminent' : ''}`}
                  >
                    {a.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
