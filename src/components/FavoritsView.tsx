import { useEffect, useMemo, useState } from 'react';
import { BicingStationRow } from './BicingStationRow';
import { CooltraKindFilters } from './CooltraKindFilters';
import { CooltraMapButton } from './CooltraMapButton';
import { DirectionsButton } from './DirectionsButton';
import { FavMap } from './FavMap';
import { FavStar } from './FavStar';
import { useBicingStations } from '../hooks/useBicingStations';
import { useCooltraKindFilters } from '../hooks/useCooltraKindFilters';
import { useCooltraVehicles } from '../hooks/useCooltraVehicles';
import { inferKind } from '../types/cooltra';
import { useFavorits } from '../hooks/useFavorits';
import { useGeolocation } from '../hooks/useGeolocation';
import { useTempsReal } from '../hooks/useTempsReal';
import { haversine, formatDistance } from '../utils/distance';
import { getLineColor } from '../utils/lineColor';
import { groupArrivalsByDestination } from '../utils/groupArrivals';
import type { BicingStation, FavBicing } from '../types/bicing';
import type { Coordinate, FavLinia, FavParada } from '../types/tmb';

// Saved stops and Bicing stations share one list (mixed, no separate section).
type FavListItem =
  | { kind: 'parada'; parada: FavParada; lat: number; lng: number }
  | { kind: 'bicing'; station: BicingStation; lat: number; lng: number };

function stationFromFav(fav: FavBicing, live?: BicingStation): BicingStation {
  return (
    live ?? {
      id: fav.id,
      name: fav.name,
      lat: fav.lat,
      lng: fav.lng,
      capacity: 0,
      bikesElectric: 0,
      bikesMechanical: 0,
      docksAvailable: 0,
      status: 'operativa',
      lastReported: 0,
    }
  );
}

type FavSort = 'proximity' | 'recent';
type FavView = 'list' | 'map';
type OpenLine = (id: string, focus?: Coordinate) => void;

const SORT_STORAGE_KEY = 'tmb-fav-sort';
const COOLTRA_STORAGE_KEY = 'tmb-cooltra-visible-v1';

function loadStoredSort(): FavSort {
  if (typeof window === 'undefined') return 'proximity';
  try {
    const raw = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (raw === 'proximity' || raw === 'recent') return raw;
  } catch {
    // ignore
  }
  return 'proximity';
}

function loadStoredCooltra(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(COOLTRA_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface Props {
  onOpenLine: OpenLine;
}

export function FavoritsView({ onOpenLine }: Props) {
  const { favLinies, favParades, favBicing, toggleLinia, toggleParada } = useFavorits();
  const { position } = useGeolocation(true);
  const { stations: bicingStations } = useBicingStations(favBicing.length > 0);
  const liveBicingById = useMemo(() => {
    const m = new Map<string, BicingStation>();
    for (const s of bicingStations) m.set(s.id, s);
    return m;
  }, [bicingStations]);
  const [sort, setSort] = useState<FavSort>(loadStoredSort);
  const [view, setView] = useState<FavView>('list');
  const [cooltraOn, setCooltraOn] = useState<boolean>(loadStoredCooltra);
  const { vehicles: cooltraVehicles } = useCooltraVehicles(cooltraOn);
  const cooltraKinds = useCooltraKindFilters();
  const visibleCooltra = useMemo(() => {
    if (!cooltraOn) return [];
    return cooltraVehicles.filter((v) => {
      const kind = inferKind(v.model_id);
      return kind === 'scooter' ? cooltraKinds.motos : cooltraKinds.bikes;
    });
  }, [cooltraOn, cooltraVehicles, cooltraKinds.motos, cooltraKinds.bikes]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COOLTRA_STORAGE_KEY, cooltraOn ? '1' : '0');
    } catch {
      // ignore
    }
  }, [cooltraOn]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SORT_STORAGE_KEY, sort);
    } catch {
      // quota / private mode — ignore
    }
  }, [sort]);

  // Effective sort: proximity needs a location, otherwise fall back to the
  // most-recently-added order.
  const effectiveSort: FavSort = sort === 'proximity' && !position ? 'recent' : sort;

  // Saved stops and Bicing stations mixed into one ordered list.
  const orderedItems = useMemo<FavListItem[]>(() => {
    const items: FavListItem[] = [
      ...favParades.map(
        (p): FavListItem => ({ kind: 'parada', parada: p, lat: p.lat, lng: p.lng }),
      ),
      ...favBicing.map(
        (b): FavListItem => ({
          kind: 'bicing',
          station: stationFromFav(b, liveBicingById.get(b.id)),
          lat: b.lat,
          lng: b.lng,
        }),
      ),
    ];
    if (effectiveSort === 'proximity' && position) {
      return items.sort(
        (a, b) =>
          haversine(position, { lat: a.lat, lng: a.lng }) -
          haversine(position, { lat: b.lat, lng: b.lng }),
      );
    }
    // 'recent' — store keeps add order (oldest first); show newest first.
    return items.reverse();
  }, [favParades, favBicing, liveBicingById, position, effectiveSort]);

  // Live Bicing stations for the favourites map (fall back to stored position).
  const favBicingStations = useMemo<BicingStation[]>(
    () => favBicing.map((b) => stationFromFav(b, liveBicingById.get(b.id))),
    [favBicing, liveBicingById],
  );

  const hasMappable = favParades.length > 0 || favBicing.length > 0;
  const isEmpty = favLinies.length === 0 && favParades.length === 0 && favBicing.length === 0;

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
      <div className={`favorits-toolbar${view === 'map' ? ' favorits-toolbar--hidden' : ''}`}>
        <div className="sort-controls" role="group" aria-label="Ordenació">
          <button
            type="button"
            className={`sort-btn${effectiveSort === 'proximity' ? ' active' : ''}`}
            disabled={!position}
            onClick={() => setSort('proximity')}
            aria-pressed={effectiveSort === 'proximity'}
            title={position ? 'Ordenar per proximitat' : 'Proximitat (cal geolocalització)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
            </svg>
          </button>
          <button
            type="button"
            className={`sort-btn${effectiveSort === 'recent' ? ' active' : ''}`}
            onClick={() => setSort('recent')}
            aria-pressed={effectiveSort === 'recent'}
            title="Ordenar pels més recents"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </button>
        </div>
        {hasMappable && (
          <div className="sort-controls" role="group" aria-label="Vista">
            <button
              type="button"
              className={`sort-btn${view === 'list' ? ' active' : ''}`}
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              aria-label="Veure com a llista"
              title="Llista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
                <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" />
                <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
              </svg>
            </button>
            <button
              type="button"
              className={`sort-btn${view === 'map' ? ' active' : ''}`}
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              aria-label="Veure les parades al mapa"
              title="Mapa"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20 3 7" /><line x1="9" y1="4" x2="9" y2="17" /><line x1="15" y1="7" x2="15" y2="20" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {view === 'map' && hasMappable ? (
        <div className="favorits-map">
          <FavMap
            parades={favParades}
            bicingStations={favBicingStations}
            userPosition={position}
            cooltraVehicles={visibleCooltra}
          />
          <button
            type="button"
            className="fav-map-listbtn"
            onClick={() => setView('list')}
            aria-label="Veure com a llista"
            title="Llista"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
              <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" />
              <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
          </button>
          <div className="cooltra-map-control cooltra-map-control--fav">
            <CooltraMapButton
              value={cooltraOn}
              onChange={setCooltraOn}
            />
            {cooltraOn && (
              <CooltraKindFilters
                motos={cooltraKinds.motos}
                bikes={cooltraKinds.bikes}
                onMotosChange={cooltraKinds.setMotos}
                onBikesChange={cooltraKinds.setBikes}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="favorits-scroll">
          {orderedItems.length > 0 && (
            <section className="favorits-section">
              <div className="favorits-head">★ Parades i estacions desades</div>
              {orderedItems.map((item) => {
                const distanceM = position
                  ? haversine(position, { lat: item.lat, lng: item.lng })
                  : null;
                if (item.kind === 'parada') {
                  return (
                    <FavStopItem
                      key={`p-${item.parada.id}`}
                      parada={item.parada}
                      distanceM={distanceM}
                      onRemove={() => toggleParada(item.parada)}
                      onOpenLine={onOpenLine}
                    />
                  );
                }
                return (
                  <BicingStationRow
                    key={`b-${item.station.id}`}
                    station={item.station}
                    distanceM={distanceM}
                  />
                );
              })}
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
  onOpenLine,
}: {
  parada: FavParada;
  distanceM: number | null;
  onRemove: () => void;
  onOpenLine: OpenLine;
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
  const idByCodi = new Map<string, string>();
  for (const l of parada.liniesQueParen) {
    colorByCodi.set(l.codi, getLineColor(l));
    idByCodi.set(l.codi, l.id);
  }
  const focus: Coordinate = { lat: parada.lat, lng: parada.lng };

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
                  const lineId = idByCodi.get(a.liniaCodi);
                  const color = colorByCodi.get(a.liniaCodi) ?? '#888';
                  return (
                    <li key={`${a.liniaCodi}-${idx}`}>
                      {lineId ? (
                        <button
                          type="button"
                          className="fav-stop-line fav-stop-line--btn"
                          style={{ background: color }}
                          onClick={() => onOpenLine(lineId, focus)}
                          title={`Veure la línia ${a.liniaCodi} al mapa`}
                        >
                          {a.liniaCodi || '—'}
                        </button>
                      ) : (
                        <span className="fav-stop-line" style={{ background: color }}>
                          {a.liniaCodi || '—'}
                        </span>
                      )}
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
        <div className="fav-stop-noarr">
          <div className="fav-stop-lines">
            {parada.liniesQueParen.map((l) => (
              <button
                key={l.id}
                type="button"
                className="fav-stop-line fav-stop-line--btn"
                style={{ background: getLineColor(l) }}
                onClick={() => onOpenLine(l.id, focus)}
                title={`Veure la línia ${l.codi} al mapa`}
              >
                {l.codi}
              </button>
            ))}
          </div>
          <div className="fav-stop-status">
            {loading ? 'Consultant temps real…' : 'Sense vehicles propers ara mateix.'}
          </div>
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
