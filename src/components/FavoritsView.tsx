import { useMemo } from 'react';
import { DirectionsButton } from './DirectionsButton';
import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTempsReal } from '../hooks/useTempsReal';
import { haversine, formatDistance } from '../utils/distance';
import { getLineColor } from '../utils/lineColor';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type { FavLinia, FavParada } from '../types/tmb';

interface Props {
  onOpenLine: (id: string) => void;
}

export function FavoritsView({ onOpenLine }: Props) {
  const { favLinies, favParades, toggleLinia, toggleParada } = useFavorits();
  const { position } = useGeolocation(true);

  // Nearest first when we have a location, otherwise keep the add order.
  const orderedParades = useMemo(() => {
    if (!position) return favParades;
    return [...favParades].sort(
      (a, b) =>
        haversine(position, { lat: a.lat, lng: a.lng }) -
        haversine(position, { lat: b.lat, lng: b.lng }),
    );
  }, [favParades, position]);

  const isEmpty = favLinies.length === 0 && favParades.length === 0;

  return (
    <main className="app-main favorits-view">
      <div className="favorits-scroll">
        {isEmpty && (
          <div className="favorits-empty">
            <div className="favorits-empty-star" aria-hidden="true">★</div>
            <p className="favorits-empty-title">Encara no tens favorits</p>
            <p className="favorits-empty-sub">
              Marca línies i parades amb l'estrella ★ i les tindràs aquí,
              amb el temps real a un sol toc.
            </p>
          </div>
        )}

        {favParades.length > 0 && (
          <section className="favorits-section">
            <div className="favorits-head">★ Parades guardades</div>
            {orderedParades.map((p) => (
              <FavStopItem
                key={p.id}
                parada={p}
                distanceM={
                  position
                    ? haversine(position, { lat: p.lat, lng: p.lng })
                    : null
                }
                onRemove={() => toggleParada(p)}
              />
            ))}
          </section>
        )}

        {favLinies.length > 0 && (
          <section className="favorits-section">
            <div className="favorits-head">★ Línies guardades</div>
            {favLinies.map((l) => (
              <FavLineRow
                key={l.id}
                linia={l}
                onOpen={() => onOpenLine(l.id)}
                onRemove={() => toggleLinia(l)}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}

function FavStopItem({
  parada,
  distanceM,
  onRemove,
}: {
  parada: FavParada;
  distanceM: number | null;
  onRemove: () => void;
}) {
  const primary = parada.liniesQueParen[0];
  const { data, loading } = useTempsReal(
    primary ? parada.tipus : null,
    primary?.codi ?? null,
    parada.codi,
    !!primary,
    true,
  );

  const colorByCodi = new Map<string, string>();
  for (const l of parada.liniesQueParen) colorByCodi.set(l.codi, getLineColor(l));

  const groups =
    data && data.disponible
      ? groupArrivalsByDestination(data.arribades.slice(0, 8))
      : [];

  return (
    <div className="fav-stop-item">
      <div className="fav-stop-top">
        <div className="fav-stop-titles">
          <div className="fav-stop-name">{parada.nom}</div>
          <div className="fav-stop-meta">
            {parada.tipus === 'metro' ? 'Metro' : 'Bus'}
            {distanceM != null && <> · {formatDistance(distanceM)}</>}
          </div>
        </div>
        <FavStar active onToggle={onRemove} size={20} />
      </div>
      {groups.length > 0 ? (
        <div className="fav-stop-arrivals">
          {groups.map((g) => (
            <div key={g.destinacio} className="fav-stop-group">
              <div className="fav-stop-dest">→ {g.destinacio || '—'}</div>
              <ul>
                {g.arribades.slice(0, 3).map((a, idx) => {
                  const imminent = a.text.toLowerCase().includes('arribant');
                  return (
                    <li key={`${a.liniaCodi}-${idx}`}>
                      <span
                        className="fav-stop-line"
                        style={{ background: colorByCodi.get(a.liniaCodi) ?? '#888' }}
                      >
                        {a.liniaCodi || '—'}
                      </span>
                      <span className={`fav-stop-time${imminent ? ' imminent' : ''}`}>
                        {a.text}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="fav-stop-status">
          {loading ? 'Consultant temps real…' : 'Sense vehicles propers ara mateix.'}
        </div>
      )}
      <DirectionsButton
        lat={parada.lat}
        lng={parada.lng}
        nom={parada.nom}
        variant="block"
      />
    </div>
  );
}

function FavLineRow({
  linia,
  onOpen,
  onRemove,
}: {
  linia: FavLinia;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="fav-line-row">
      <button type="button" className="fav-line-open" onClick={onOpen}>
        <span
          className="line-badge"
          style={{ background: linia.color }}
          aria-hidden="true"
        >
          {linia.codi}
        </span>
        <span className="fav-line-name">{linia.nom}</span>
      </button>
      <FavStar active onToggle={onRemove} size={20} />
    </div>
  );
}
