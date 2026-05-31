import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { FgcLayer } from './FgcLayer';
import { RefreshControl } from './RefreshControl';
import { SearchInput } from './SearchInput';
import { SortControls, type SortMode } from './SortControls';
import { FavStar } from './FavStar';
import { useFavorits } from '../hooks/useFavorits';
import { useFgcLinies } from '../hooks/useFgcLinies';
import { useFgcLiniaDetall } from '../hooks/useFgcLiniaDetall';
import { useFgcStations } from '../hooks/useFgcStations';
import { useFgcVehicles } from '../hooks/useFgcVehicles';
import { useGeolocation } from '../hooks/useGeolocation';
import { haversine } from '../utils/distance';
import { rotateOptions } from '../utils/leafletRotate';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];
type ViewMode = 'map' | 'list';

export function FgcView() {
  const { linies, loading, error, cerca, setCerca } = useFgcLinies();
  const [sort, setSort] = useState<SortMode>('az');
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [wink, setWink] = useState<{ id: string; nonce: number } | null>(null);
  const { detall } = useFgcLiniaDetall(selected);
  const { vehicles, refresh } = useFgcVehicles(selected, !!selected);
  const { stations } = useFgcStations(true);
  const { position } = useGeolocation(true);

  // Min distance from the user to each line (closest stop) for proximity sort.
  const lineDist = useMemo(() => {
    const m = new Map<string, number>();
    if (!position) return m;
    for (const s of stations) {
      const d = haversine(position, { lat: s.lat, lng: s.lng });
      for (const codi of s.liniesQueParen) {
        const prev = m.get(codi);
        if (prev == null || d < prev) m.set(codi, d);
      }
    }
    return m;
  }, [stations, position]);

  const liniesOrdenades = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    const arr = linies.filter(
      (l) => !q || l.codi.toLowerCase().includes(q) || l.nom.toLowerCase().includes(q),
    );
    const cmp = (a: string, b: string) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    return [...arr].sort((a, b) => {
      if (sort === 'proximity' && position) {
        return (
          (lineDist.get(a.codi) ?? Infinity) - (lineDist.get(b.codi) ?? Infinity)
        );
      }
      return sort === 'za' ? cmp(b.codi, a.codi) : cmp(a.codi, b.codi);
    });
  }, [linies, cerca, sort, position, lineDist]);

  const color = detall?.linia.color ?? '#1f7a3d';
  const polyline = useMemo<[number, number][]>(
    () => (detall ? detall.geometry.map(([lng, lat]) => [lat, lng]) : []),
    [detall],
  );

  return (
    <main className="app-main fgc-main">
      <aside className="fgc-panel">
        <div className="fgc-panel-head">
          <SearchInput value={cerca} onChange={setCerca} />
          <SortControls value={sort} onChange={setSort} proximityAvailable={!!position} />
        </div>
        <div className="fgc-line-list">
          {loading && <div className="state-msg">Carregant línies FGC…</div>}
          {error && <div className="state-msg state-msg--error">{error}</div>}
          {liniesOrdenades.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`fgc-line-row${selected === l.codi ? ' active' : ''}`}
              onClick={() => setSelected(selected === l.codi ? null : l.codi)}
            >
              <span className="fgc-line-badge" style={{ background: l.color }}>
                {l.codi}
              </span>
              <span className="fgc-line-name">{l.nom}</span>
              <span className="fgc-line-count">{l.numParades}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="map-area" aria-label="Mapa FGC">
        {viewMode === 'map' || !detall ? (
          <MapContainer
            center={position ? [position.lat, position.lng] : FALLBACK_CENTER}
            zoom={13}
            zoomSnap={0}
            className="map-container"
            scrollWheelZoom
            {...(rotateOptions() as Record<string, unknown>)}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains={['a', 'b', 'c', 'd']}
              maxZoom={20}
            />
            {position && (
              <CircleMarker
                center={[position.lat, position.lng]}
                radius={7}
                pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1d7df2', fillOpacity: 1 }}
              >
                <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
                  Tu
                </Tooltip>
              </CircleMarker>
            )}
            {polyline.length > 1 && (
              <Polyline positions={polyline} pathOptions={{ color, weight: 5, opacity: 0.9 }} />
            )}
            {detall && (
              <FgcLayer parades={detall.parades} color={color} origin={position} winkTarget={wink} />
            )}
            {vehicles.map((v) => (
              <CircleMarker
                key={v.id}
                center={[v.lat, v.lng]}
                radius={6}
                pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }}
              >
                <Tooltip direction="top" className="stop-tooltip">
                  <span className="tooltip-name">{v.liniaCodi} {v.destinacio ?? ''}</span>
                </Tooltip>
              </CircleMarker>
            ))}
            <FitToLine points={polyline} />
            {position && <RecenterButton userPosition={position} />}
            <InvalidateOnResize />
          </MapContainer>
        ) : (
          <FgcLineStops
            detall={detall}
            vehicleCount={vehicles.length}
            onSelectStop={(id) => {
              setWink({ id, nonce: (wink?.nonce ?? 0) + 1 });
              setViewMode('map');
            }}
          />
        )}

        {!selected && (
          <div className="map-hint">Selecciona una línia FGC per veure les parades</div>
        )}

        {detall && (
          <>
            <div className="linies-fab-stack linies-fab-stack--mapview">
              <button
                type="button"
                className="linies-fab"
                onClick={() => setViewMode((v) => (v === 'map' ? 'list' : 'map'))}
                aria-label={viewMode === 'map' ? 'Veure com a llista' : 'Veure al mapa'}
                title={viewMode === 'map' ? 'Llista' : 'Mapa'}
              >
                {viewMode === 'map' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
                    <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" />
                    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20 3 7" /><line x1="9" y1="4" x2="9" y2="17" /><line x1="15" y1="7" x2="15" y2="20" />
                  </svg>
                )}
              </button>
            </div>
            {viewMode === 'map' && (
              <div className="map-controls-stack">
                <RefreshControl onRefresh={refresh} />
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

// Stop list for the selected line (mirrors TMB's LineListView): ordered stops
// with terminals marked, the line badge, favourite star, and tap-to-locate.
function FgcLineStops({
  detall,
  vehicleCount,
  onSelectStop,
}: {
  detall: NonNullable<ReturnType<typeof useFgcLiniaDetall>['detall']>;
  vehicleCount: number;
  onSelectStop: (id: string) => void;
}) {
  const { isFgcFav, toggleFgc } = useFavorits();
  const last = detall.parades.length - 1;
  return (
    <div className="line-list-view fgc-stop-list-view">
      <div className="fgc-stoplist-head">
        <span className="fgc-line-badge" style={{ background: detall.linia.color }}>
          {detall.linia.codi}
        </span>
        <span className="fgc-stoplist-title">{detall.linia.nom}</span>
        {vehicleCount > 0 && (
          <span className="fgc-stoplist-live">{vehicleCount} en circulació</span>
        )}
      </div>
      <ol className="fgc-stoplist">
        {detall.parades.map((p, idx) => {
          const terminal = idx === 0 || idx === last;
          return (
            <li
              key={p.id}
              className={`fgc-stoplist-row${terminal ? ' terminal' : ''}`}
              onClick={() => onSelectStop(p.id)}
            >
              <span className="fgc-stoplist-dot" style={{ borderColor: detall.linia.color }} />
              <span className="fgc-stoplist-name">{p.nom}</span>
              <span className="fgc-stoplist-lines">
                {p.liniesQueParen.map((codi) => (
                  <span key={codi} className="fgc-stoplist-linebadge">{codi}</span>
                ))}
              </span>
              <FavStar
                active={isFgcFav(p.id)}
                onToggle={() => toggleFgc({ ...p })}
                size={18}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FitToLine({ points }: { points: [number, number][] }) {
  const map = useMap();
  const lastSig = useRef('');
  const signature =
    points.length < 2
      ? ''
      : `${points.length}|${points[0][0]},${points[0][1]}|${points[points.length - 1][0]},${points[points.length - 1][1]}`;
  useEffect(() => {
    if (points.length < 2 || signature === lastSig.current) return;
    lastSig.current = signature;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [50, 50] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, map]);
  return null;
}

function RecenterButton({ userPosition }: { userPosition: { lat: number; lng: number } }) {
  const map = useMap();
  return (
    <div className="recenter-control" style={{ bottom: '16px' }}>
      <button
        type="button"
        onClick={() => map.setView([userPosition.lat, userPosition.lng], 15)}
        aria-label="Centrar el mapa a la meva ubicació"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
        </svg>
      </button>
    </div>
  );
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (typeof ResizeObserver === 'undefined') return;
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  return null;
}
