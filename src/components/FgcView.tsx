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
import { CooltraKindFilters } from './CooltraKindFilters';
import { CooltraLayer } from './CooltraLayer';
import { CooltraMapButton } from './CooltraMapButton';
import { FgcLayer } from './FgcLayer';
import { FgcLineListView } from './FgcLineListView';
import { RefreshControl } from './RefreshControl';
import { SearchInput } from './SearchInput';
import { SortControls, type SortMode } from './SortControls';
import { VehicleVisibilityToggle } from './VehicleVisibilityToggle';
import { useCooltraKindFilters } from '../hooks/useCooltraKindFilters';
import { useCooltraVehicles } from '../hooks/useCooltraVehicles';
import { useFgcLinies } from '../hooks/useFgcLinies';
import { useFgcLiniaDetall } from '../hooks/useFgcLiniaDetall';
import { useFgcStations } from '../hooks/useFgcStations';
import { useFgcVehicles } from '../hooks/useFgcVehicles';
import { useGeolocation } from '../hooks/useGeolocation';
import { inferKind } from '../types/cooltra';
import { fgcLineColor } from '../utils/fgc';
import { haversine } from '../utils/distance';
import { rotateOptions } from '../utils/leafletRotate';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];
const COOLTRA_STORAGE_KEY = 'tmb-cooltra-visible-v1';
type ViewMode = 'map' | 'list';

function loadStoredCooltra(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(COOLTRA_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function FgcView() {
  const { linies, loading, error, cerca, setCerca } = useFgcLinies();
  const [sort, setSort] = useState<SortMode>('proximity');
  const [selected, setSelected] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [panelOpen, setPanelOpen] = useState(true);
  const [showVehicles, setShowVehicles] = useState(true);
  const [cooltraOn, setCooltraOn] = useState<boolean>(loadStoredCooltra);

  const { detall } = useFgcLiniaDetall(selected);
  // Trains only for the selected line — the default FGC view stays a clean map.
  const { vehicles, refresh } = useFgcVehicles(selected, !!selected && showVehicles);
  const { stations } = useFgcStations(true);
  const { position } = useGeolocation(true);
  const { vehicles: cooltraVehicles } = useCooltraVehicles(cooltraOn);
  const cooltraKinds = useCooltraKindFilters();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COOLTRA_STORAGE_KEY, cooltraOn ? '1' : '0');
    } catch {
      // ignore
    }
  }, [cooltraOn]);

  const visibleCooltra = useMemo(() => {
    if (!cooltraOn) return [];
    return cooltraVehicles.filter((v) => {
      const kind = inferKind(v.model_id);
      return kind === 'scooter' ? cooltraKinds.motos : cooltraKinds.bikes;
    });
  }, [cooltraOn, cooltraVehicles, cooltraKinds.motos, cooltraKinds.bikes]);

  // Proximity sort: min distance from the user to each line's closest stop.
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
        return (lineDist.get(a.codi) ?? Infinity) - (lineDist.get(b.codi) ?? Infinity);
      }
      return sort === 'za' ? cmp(b.codi, a.codi) : cmp(a.codi, b.codi);
    });
  }, [linies, cerca, sort, position, lineDist]);

  const color = detall?.linia.color ?? '#1f7a3d';
  const polyline = useMemo<[number, number][]>(
    () => (detall ? detall.geometry.map(([lng, lat]) => [lat, lng]) : []),
    [detall],
  );

  const handleSelect = (codi: string) => {
    setSelected(codi);
    setPanelOpen(false);
    setViewMode('map');
  };

  return (
    <main className="app-main">
      {panelOpen && (
        <div className="panel-backdrop" onClick={() => setPanelOpen(false)} aria-hidden="true" />
      )}
      <aside className={`panel${panelOpen ? ' panel--open' : ''}`}>
        <div className="filters-row">
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
              onClick={() => handleSelect(l.codi)}
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
        {detall && (
          <div className="line-header-wrapper">
            <span className="line-header-banner">
              <span className="line-badge" style={{ background: detall.linia.color }}>
                {detall.linia.codi}
              </span>
              <span className="line-header-name">{detall.linia.nom}</span>
            </span>
          </div>
        )}

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
              <FgcLayer parades={detall.parades} color={color} origin={position} />
            )}
            {showVehicles &&
              vehicles.map((v) => (
                <CircleMarker
                  key={v.id}
                  center={[v.lat, v.lng]}
                  radius={6}
                  pathOptions={{
                    color: '#ffffff',
                    weight: 2,
                    fillColor: fgcLineColor(v.liniaCodi),
                    fillOpacity: 1,
                  }}
                >
                  <Tooltip direction="top" className="stop-tooltip">
                    <span className="tooltip-name">
                      {v.liniaCodi}
                      {v.destinacio ? ` → ${v.destinacio}` : ''}
                    </span>
                  </Tooltip>
                </CircleMarker>
              ))}
            {visibleCooltra.length > 0 && <CooltraLayer vehicles={visibleCooltra} />}
            <FitToLine points={polyline} />
            {position && <RecenterButton userPosition={position} />}
            <InvalidateOnResize />
          </MapContainer>
        ) : (
          <FgcLineListView detall={detall} />
        )}

        {!selected && !panelOpen && (
          <div className="map-hint">Selecciona una línia FGC per veure les parades</div>
        )}

        {/* Top-right: refresh + vehicle visibility (line selected, map, panel closed). */}
        {detall && viewMode === 'map' && !panelOpen && (
          <div className="map-controls-stack">
            <RefreshControl onRefresh={refresh} />
            <VehicleVisibilityToggle value={showVehicles} onChange={setShowVehicles} tipus="metro" />
          </div>
        )}

        {/* While the line list is open over the map, the only control is a close X. */}
        {selected && panelOpen && (
          <button
            type="button"
            className="linies-fab linies-fab--close"
            onClick={() => setPanelOpen(false)}
            aria-label="Tancar la llista de línies"
            title="Tancar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        )}

        {/* Bottom-right FAB stack (map/list · lupa · Cooltra) only when the
            panel is closed — the lupa is redundant while the list is open. */}
        {!panelOpen && (
          <div
            className={`linies-fab-stack${viewMode === 'map' ? ' linies-fab-stack--mapview' : ''}`}
          >
            {detall && (
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
            )}
            <button
              type="button"
              className="linies-fab"
              onClick={() => setPanelOpen(true)}
              aria-label="Cercar / triar línia"
              title="Línies"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            {/* Cooltra only makes sense over the map, not the stop list. */}
            {viewMode === 'map' && (
              <CooltraMapButton value={cooltraOn} onChange={setCooltraOn} />
            )}
            {viewMode === 'map' && cooltraOn && (
              <CooltraKindFilters
                motos={cooltraKinds.motos}
                bikes={cooltraKinds.bikes}
                onMotosChange={cooltraKinds.setMotos}
                onBikesChange={cooltraKinds.setBikes}
              />
            )}
          </div>
        )}
      </section>
    </main>
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
