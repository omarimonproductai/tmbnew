import { useMemo, useState } from 'react';
import { DirectionsButton } from './DirectionsButton';
import { FavMap } from './FavMap';
import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTempsReal } from '../hooks/useTempsReal';
import { haversine, formatDistance } from '../utils/distance';
import { getLineColor } from '../utils/lineColor';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type { FavLinia, FavParada } from '../types/tmb';

type FavSort = 'proximity' | 'recent';
type FavView = 'list' | 'map';

interface Props {
  onOpenLine: (id: string) => void;
}

export function FavoritsView({ onOpenLine }: Props) {
  const { favLinies, favParades, toggleLinia, toggleParada } = useFavorits();
  const { position } = useGeolocation(true);
  const [sort, setSort] = useState<FavSort>('proximity');
  const [view, setView] = useState<FavView>('list');

  // Effective sort: proximity needs a location, otherwise fall back to the
  // most-recently-added order.
  const effectiveSort: FavSort = sort === 'proximity' && !position ? 'recent' : sort;

  const orderedParades = useMemo(() => {
    if (effectiveSort === 'proximity' && position) {
      return [...favParades].sort(
        (a, b) =>
          haversine(position, { lat: a.lat, lng: a.lng }) -
          haversine(position, { lat: b.lat, lng: b.lng }),
      );
    }
    // 'recent' — store keeps add order (oldest first); show newest first.
    return [...favParades].reverse();
  }, [favParades, position, effectiveSort]);

  const isEmpty = favLinies.length === 0 && favParades.length === 0;

  if (isEmpty) {
    return (
      <main className="app-main favorits-view">
        <div className="favorits-empty">
          <div className="favorits-empty-star" aria-hidden="true">★</div>
          <p className="favorits-empty-title">Encara no tens favorits</p>
          <p className="favorits-empty-sub">
            Marca línies i parades amb l'estrella ★ i les tindràs aquí,
            amb el temps real a un sol toc.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main favorits-view">
      <div className="favorits-toolbar">
        <div className="fav-sort" role="group" aria-label="Ordenació">
          <button
            type="button"
            className={effectiveSort === 'proximity' ? 'on' : ''}
            disabled={!position}
            onClick={() => setSort('proximity')}
            title={position ? 'Ordenar per proximitat' : 'Proximitat (cal geolocalització)'}
          >
            Proximitat
          </button>
          <button
            type="button"
            className={effectiveSort === 'recent' ? 'on' : ''}
            onClick={() => setSort('recent')}
            title="Ordenar pels més recents"
          >
            Recents
          </button>
        </div>
        {favParades.length > 0 && (
          <div className="fav-viewtoggle" role="group" aria-label="Vista">
            <button
              type="button"
              className={view === 'list' ? 'on' : ''}
              onClick={() => setView('list')}
              aria-label="Veure com a llista"
              title="Llista"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
                <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <button
              type="button"
              className={view === 'map' ? 'on' : ''}
              onClick={() => setView('map')}
              aria-label="Veure les parades al mapa"
              title="Mapa"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20 3 7" /><line x1="9" y1="4" x2="9" y2="17" /><line x1="15" y1="7" x2="15" y2="20" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {view === 'map' && favParades.length > 0 ? (
        <div className="favorits-map">
          <FavMap parades={orderedParades} userPosition={position} />
        </div>
      ) : (
        <div className="favorits-scroll">
          {favParades.length > 0 && (
            <section className="favorits-section">
              <div className="favorits-head">★ Parades desades</div>
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
              <div className="favorits-head">★ Línies desades</div>
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
      )}
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
        <DirectionsButton lat={parada.lat} lng={parada.lng} nom={parada.nom} />
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
