import { DirectionsButton } from './DirectionsButton';
import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { useTempsReal } from '../hooks/useTempsReal';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type { FavParada, Linia, LiniaResum, Parada } from '../types/tmb';

interface Props {
  linia: Linia;
  parada: Parada;
  enabled: boolean;
  correspondences?: LiniaResum[];
}

export function StopPopup({ linia, parada, enabled, correspondences }: Props) {
  const { data, loading, error } = useTempsReal(
    linia.tipus,
    linia.codi,
    parada.codi,
    enabled,
  );
  const { isParadaFav, toggleParada } = useFavorits();

  // Match the id scheme parades-all uses so a stop favourited here shows
  // as favourited in 'Aprop meu' too (metro keyed by station group).
  const favId =
    linia.tipus === 'metro' ? `metro-${parada.id}` : `bus-${parada.codi}`;
  const favParada: FavParada = {
    id: favId,
    codi: parada.codi,
    nom: parada.nom,
    lat: parada.lat,
    lng: parada.lng,
    tipus: linia.tipus,
    liniesQueParen: [
      { id: linia.id, codi: linia.codi, tipus: linia.tipus, color: linia.color },
      ...(correspondences ?? []),
    ],
  };

  return (
    <div className="stop-popup-content">
      <div className="popup-head">
        <span className="popup-badge" style={{ background: linia.color }}>
          {linia.codi}
        </span>
        <span className="popup-title">{parada.nom}</span>
        <FavStar
          active={isParadaFav(favId)}
          onToggle={() => toggleParada(favParada)}
          size={20}
        />
      </div>
      {correspondences && correspondences.length > 0 && (
        <div className="popup-interchanges" aria-label="Correspondències">
          <span className="popup-interchanges-label">Correspondència</span>
          <span className="popup-interchanges-list">
            {correspondences.map((l) => (
              <span
                key={l.id}
                className="popup-mini-badge"
                style={{ background: l.color }}
                title={`${l.tipus === 'metro' ? 'Metro' : 'Bus'} ${l.codi}`}
              >
                {l.codi}
              </span>
            ))}
          </span>
        </div>
      )}
      <TempsRealBlock
        loading={loading}
        error={error}
        data={data}
        liniaCodi={linia.codi}
      />
      <DirectionsButton lat={parada.lat} lng={parada.lng} nom={parada.nom} variant="block" />
    </div>
  );
}

function TempsRealBlock({
  loading,
  error,
  data,
  liniaCodi,
}: {
  loading: boolean;
  error: string | null;
  data: ReturnType<typeof useTempsReal>['data'];
  liniaCodi: string;
}) {
  if (loading && !data) return <div className="popup-loading">Consultant temps real…</div>;
  if (error) return <div className="popup-error">Temps real no disponible.</div>;
  if (!data) return null;
  if (!data.disponible || data.arribades.length === 0) {
    return <div className="popup-note">Sense vehicles propers ara mateix.</div>;
  }
  const groups = groupArrivalsByDestination(data.arribades.slice(0, 8));
  return (
    <div className="popup-arrivals">
      {groups.map((g, gi) => (
        <div key={g.destinacio} className="popup-group">
          {gi > 0 && <div className="popup-group-divider" />}
          <div className="popup-group-head">→ {g.destinacio || '—'}</div>
          <ul>
            {g.arribades.map((a, idx) => {
              const isOtherLine = a.liniaCodi && a.liniaCodi !== liniaCodi;
              const imminent = isImminent(a.text);
              return (
                <li key={idx}>
                  <span className="popup-dest">
                    {isOtherLine && (
                      <span className="popup-otherline">{a.liniaCodi}</span>
                    )}
                  </span>
                  <span
                    className={`popup-time${imminent ? ' popup-time--imminent' : ''}`}
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

function isImminent(text: string): boolean {
  const t = text.toLowerCase();
  return t.includes('arribant') || t.includes('arriving');
}
