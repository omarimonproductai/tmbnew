import { DirectionsButton } from './DirectionsButton';
import { useTempsReal } from '../hooks/useTempsReal';
import { getLineColor } from '../utils/lineColor';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type { ParadaAprop } from '../types/tmb';

interface Props {
  parada: ParadaAprop;
  enabled: boolean;
}

// Popup body for a stop in 'Aprop meu'. Shows the lines that serve the
// stop and, when the popup is open, the live arrivals grouped by
// destination. One temps-real subrequest per stop (all=1 fetches the
// arrivals for every line at this stop in a single call).
export function AproperMeuStopPopup({ parada, enabled }: Props) {
  const primary = parada.liniesQueParen[0];
  const { data, loading, error } = useTempsReal(
    primary ? parada.tipus : null,
    primary?.codi ?? null,
    parada.codi,
    enabled && !!primary,
    true,
  );

  return (
    <div className="aprop-popup">
      <div className="aprop-popup-name">{parada.nom}</div>
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
      <ArribadesBlock loading={loading} error={error} data={data} />
      <DirectionsButton
        lat={parada.lat}
        lng={parada.lng}
        nom={parada.nom}
        variant="block"
      />
    </div>
  );
}

function ArribadesBlock({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: string | null;
  data: ReturnType<typeof useTempsReal>['data'];
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

  const groups = groupArrivalsByDestination(data.arribades.slice(0, 10));
  return (
    <div className="aprop-popup-arrivals">
      {groups.map((g) => (
        <div key={g.destinacio} className="aprop-popup-group">
          <div className="aprop-popup-dest">→ {g.destinacio || '—'}</div>
          <ul>
            {g.arribades.slice(0, 3).map((a, idx) => {
              const imminent = a.text.toLowerCase().includes('arribant');
              return (
                <li key={`${a.liniaCodi}-${idx}`}>
                  <span className="aprop-popup-line">{a.liniaCodi || '—'}</span>
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
