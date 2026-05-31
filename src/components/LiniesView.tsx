import { useCallback, useEffect, useMemo, useState } from 'react';
import { CooltraKindFilters } from './CooltraKindFilters';
import { CooltraMapButton } from './CooltraMapButton';
import { FilterBar } from './FilterBar';
import { LineHeaderBanner } from './LineHeaderBanner';
import { LineList } from './LineList';
import { LineListView } from './LineListView';
import { MapView } from './MapView';
import { RefreshControl } from './RefreshControl';
import { SearchInput } from './SearchInput';
import { SortControls, type SortMode } from './SortControls';
import { VehicleVisibilityToggle } from './VehicleVisibilityToggle';
import { useCooltraKindFilters } from '../hooks/useCooltraKindFilters';
import { useCooltraVehicles } from '../hooks/useCooltraVehicles';
import { inferKind } from '../types/cooltra';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLinies } from '../hooks/useLinies';
import { useParades } from '../hooks/useParades';
import { useTotesParades } from '../hooks/useTotesParades';
import { useVehicles } from '../hooks/useVehicles';
import { findCorrespondences } from '../utils/correspondences';
import { haversine } from '../utils/distance';
import { lineMinDistance } from '../utils/lineProximity';
import { extrapolateVehiclePosition } from '../utils/route';
import { SPEED_M_S } from '../utils/transit';
import type {
  Coordinate,
  Linia,
  LiniaResum,
  Parada,
  VehiclePos,
} from '../types/tmb';

type ViewMode = 'map' | 'list';

function getIsMobile(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 640px)').matches;
}

const COOLTRA_STORAGE_KEY = 'tmb-cooltra-visible-v1';

function loadStoredCooltra(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(COOLTRA_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

interface LiniesViewProps {
  requestedLine?: { id: string; focus?: Coordinate } | null;
  onRequestedLineConsumed?: () => void;
}

export function LiniesView({
  requestedLine,
  onRequestedLineConsumed,
}: LiniesViewProps = {}) {
  const {
    linies,
    liniesFiltrades,
    loading,
    error,
    filtre,
    setFiltre,
    cerca,
    setCerca,
  } = useLinies();
  const [seleccio, setSeleccio] = useState<Linia | null>(null);
  // On mobile prefer the list view by default; on desktop the map.
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    getIsMobile() ? 'list' : 'map',
  );
  const [showVehicles, setShowVehicles] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('proximity');
  const [cooltraOn, setCooltraOn] = useState<boolean>(loadStoredCooltra);
  const { vehicles: cooltraVehicles } = useCooltraVehicles(cooltraOn);
  const cooltraKinds = useCooltraKindFilters();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COOLTRA_STORAGE_KEY, cooltraOn ? '1' : '0');
    } catch {
      // ignore quota / private-mode errors
    }
  }, [cooltraOn]);
  // On mobile we want the line list to be the landing UI: it greets the
  // user expanded, and the FAB only appears once they've picked a line
  // (so they have something on the map to look at).
  const [panelOpen, setPanelOpen] = useState(true);
  // When set, the map zooms onto this point (a favourite stop) instead of
  // fitting the whole line. Cleared on any manual line pick.
  const [mapFocus, setMapFocus] = useState<Coordinate | null>(null);
  // Direction (sentit) of the list view, lifted so the map-area ⇄ button can
  // cycle it. LineListView reports the available directions.
  const [listSentit, setListSentit] = useState<string>('');
  const [listSentits, setListSentits] = useState<string[]>([]);
  const handleColumnsChange = useCallback((sentits: string[]) => {
    setListSentits(sentits);
    setListSentit((prev) => (sentits.includes(prev) ? prev : sentits[0] ?? ''));
  }, []);
  const cycleSentit = () => {
    if (listSentits.length < 2) return;
    const i = listSentits.indexOf(listSentit);
    setListSentit(listSentits[(i + 1) % listSentits.length]);
  };

  // When the favourites view asks to open a specific line, select it once
  // the line catalogue is loaded, switch to the map, and zoom to the
  // favourite stop if one was passed.
  useEffect(() => {
    if (!requestedLine || linies.length === 0) return;
    const match = linies.find((l) => l.id === requestedLine.id);
    if (match) {
      setSeleccio(match);
      setPanelOpen(false);
      setViewMode('map');
      setMapFocus(requestedLine.focus ?? null);
    }
    onRequestedLineConsumed?.();
  }, [requestedLine, linies, onRequestedLineConsumed]);

  // We ask for geolocation so the map can show a 'Tu' dot — gives the
  // user a quick sense of where the selected line passes relative to
  // their position. Permission is the same one used in 'Aprop meu'.
  const { position: userPosition } = useGeolocation(true);

  const liniesOrdenades = useMemo(() => {
    const arr = [...liniesFiltrades];
    if (sortMode === 'proximity' && userPosition) {
      const dist = new Map<string, number>();
      for (const l of arr) dist.set(l.id, lineMinDistance(l, userPosition));
      arr.sort((a, b) => {
        const da = dist.get(a.id) ?? Number.POSITIVE_INFINITY;
        const db = dist.get(b.id) ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
      return arr;
    }
    arr.sort((a, b) => a.codi.localeCompare(b.codi, 'ca', { numeric: true }));
    if (sortMode === 'za') arr.reverse();
    return arr;
  }, [liniesFiltrades, sortMode, userPosition]);

  const handleSelect = (linia: Linia) => {
    setSeleccio(linia);
    setPanelOpen(false);
    setMapFocus(null);
  };

  const { parades, loading: paradesLoading, error: paradesError } = useParades(
    seleccio?.id ?? null,
  );

  const {
    data: vehiclesData,
    refresh: refreshVehicles,
  } = useVehicles({
    liniaId: seleccio?.id ?? null,
    liniaCodi: seleccio?.codi ?? null,
    enabled: !!seleccio,
  });

  // Heavy fetch — load it for the list view, and also for metro lines so
  // we can paint interchange badges on the map.
  const isMetroSeleccio = seleccio?.tipus === 'metro';
  const { parades: totesParades } = useTotesParades(
    (viewMode === 'list' && !!seleccio) || isMetroSeleccio,
  );

  // The line's stop closest to the user — drives the 'Tu hi ets' marker
  // and the initial scroll position in the list view.
  const nearestStopCodi = useMemo<string | null>(() => {
    if (!userPosition || parades.length === 0) return null;
    let bestCodi: string | null = null;
    let bestD = Infinity;
    for (const p of parades) {
      const d = haversine(userPosition, { lat: p.lat, lng: p.lng });
      if (d < bestD) {
        bestD = d;
        bestCodi = p.codi;
      }
    }
    return bestCodi;
  }, [userPosition, parades]);

  const correspondencesPerParada = useMemo(() => {
    const map = new Map<string, LiniaResum[]>();
    if (totesParades.length === 0 || !seleccio) return map;
    for (const p of parades) {
      map.set(
        p.codi,
        findCorrespondences(
          { lat: p.lat, lng: p.lng },
          totesParades,
          seleccio.id,
        ),
      );
    }
    return map;
  }, [parades, totesParades, seleccio]);

  // Restrict to metro-on-metro interchanges for the map: bus correspondences
  // would clutter central stops with 5–10 chips.
  const metroCorrespondencesPerParada = useMemo(() => {
    if (!isMetroSeleccio) return undefined;
    const out = new Map<string, LiniaResum[]>();
    for (const [codi, lines] of correspondencesPerParada) {
      const metroOnly = lines.filter((l) => l.tipus === 'metro');
      if (metroOnly.length > 0) out.set(codi, metroOnly);
    }
    return out;
  }, [correspondencesPerParada, isMetroSeleccio]);

  const vehiclesAmbPos = useMemo<VehiclePos[]>(() => {
    if (!seleccio || !vehiclesData) return [];
    const polyline = polylineFromLinia(seleccio, parades);
    if (polyline.length < 2) return [];
    const speed = SPEED_M_S[seleccio.tipus];
    const out: VehiclePos[] = [];
    for (const v of vehiclesData.vehicles) {
      const nextStop = parades.find((p) => p.codi === v.properaParadaCodi);
      if (!nextStop) continue;
      const pos = extrapolateVehiclePosition({
        polyline,
        nextStop: { lat: nextStop.lat, lng: nextStop.lng },
        minutsFinsProperaParada: v.minutsFinsProperaParada,
        speedMS: speed,
      });
      if (!pos) continue;
      // Override direccio from the destination's position: a much more robust
      // signal than the local polyline segment direction (which oscillates on
      // vertical sections of the route).
      const destStop = findDestinationStop(parades, v.destinacio);
      const direccio = destStop
        ? destStop.lng >= pos.lng
          ? 'right'
          : 'left'
        : pos.direccio;
      out.push({ ...v, ...pos, direccio });
    }
    return out;
  }, [seleccio, vehiclesData, parades]);

  const visibleCooltra = useMemo(() => {
    if (!cooltraOn) return [];
    return cooltraVehicles.filter((v) => {
      const kind = inferKind(v.model_id);
      return kind === 'scooter' ? cooltraKinds.motos : cooltraKinds.bikes;
    });
  }, [cooltraOn, cooltraVehicles, cooltraKinds.motos, cooltraKinds.bikes]);

  const liniaAmbParades: Linia | null = seleccio
    ? { ...seleccio, numParades: parades.length || seleccio.numParades }
    : null;

  return (
    <main className="app-main">
      {panelOpen && seleccio && (
        <div
          className="panel-backdrop"
          onClick={() => setPanelOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`panel${panelOpen ? ' panel--open' : ''}`}>
        <div className="filters-row">
          <FilterBar value={filtre} onChange={setFiltre} />
          <SortControls
            value={sortMode}
            onChange={setSortMode}
            proximityAvailable={!!userPosition}
          />
        </div>
        <SearchInput value={cerca} onChange={setCerca} />
        <LineList
          linies={liniesOrdenades}
          loading={loading}
          error={error}
          selectedId={seleccio?.id ?? null}
          onSelect={handleSelect}
        />
      </aside>
      <section className="map-area" aria-label="Vista de la línia">
        {seleccio && (
          <div className="line-header-wrapper">
            <LineHeaderBanner linia={seleccio} />
          </div>
        )}
        {viewMode === 'map' || !seleccio ? (
          <MapView
            linia={liniaAmbParades}
            parades={parades}
            vehicles={showVehicles ? vehiclesAmbPos : []}
            correspondencesPerParada={metroCorrespondencesPerParada}
            userPosition={userPosition}
            focusPoint={mapFocus}
            cooltraVehicles={visibleCooltra}
          />
        ) : (
          <LineListView
            linia={seleccio}
            parades={parades}
            vehicles={
              showVehicles && vehiclesData ? vehiclesData.vehicles : []
            }
            correspondencesPerParada={correspondencesPerParada}
            nearestStopCodi={nearestStopCodi}
            activeSentit={listSentit || undefined}
            onActiveSentitChange={setListSentit}
            onColumnsChange={handleColumnsChange}
          />
        )}
        {/* Top-right: vehicle data controls (both views). */}
        {seleccio && !panelOpen && (
          <div className="map-controls-stack">
            <RefreshControl onRefresh={refreshVehicles} />
            <VehicleVisibilityToggle
              value={showVehicles}
              onChange={setShowVehicles}
              tipus={seleccio.tipus}
            />
          </div>
        )}
        {/* While the line-search list is open, the only control is a close X. */}
        {seleccio && panelOpen && (
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
        {/* Bottom-right FAB stack (column-reverse → first child sits lowest). */}
        {!(seleccio && panelOpen) && (
        <div
          className={`linies-fab-stack${
            viewMode === 'map' || !seleccio ? ' linies-fab-stack--mapview' : ''
          }`}
        >
          {seleccio && viewMode === 'list' ? (
            <>
              <button
                type="button"
                className="linies-fab"
                onClick={() => setViewMode('map')}
                aria-label="Veure al mapa"
                title="Mapa"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20 3 7" /><line x1="9" y1="4" x2="9" y2="17" /><line x1="15" y1="7" x2="15" y2="20" />
                </svg>
              </button>
              {listSentits.length > 1 && (
                <button
                  type="button"
                  className="linies-fab"
                  onClick={cycleSentit}
                  aria-label="Canviar de sentit"
                  title="Canviar de sentit"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                    <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                className="linies-fab"
                onClick={() => setPanelOpen((v) => !v)}
                aria-label="Cercar línia"
                title="Cercar línia"
              >
                <SearchIcon />
              </button>
            </>
          ) : (
            <>
              {seleccio && (
                <button
                  type="button"
                  className="linies-fab"
                  onClick={() => setViewMode('list')}
                  aria-label="Veure com a llista"
                  title="Llista"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
                    <line x1="8" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="20" y2="12" /><line x1="8" y1="18" x2="20" y2="18" />
                    <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </button>
              )}
              {seleccio && (
                <button
                  type="button"
                  className="linies-fab"
                  onClick={() => setPanelOpen((v) => !v)}
                  aria-label="Cercar línia"
                  title="Cercar línia"
                >
                  <SearchIcon />
                </button>
              )}
              <CooltraMapButton value={cooltraOn} onChange={setCooltraOn} />
              {cooltraOn && (
                <CooltraKindFilters
                  motos={cooltraKinds.motos}
                  bikes={cooltraKinds.bikes}
                  onMotosChange={cooltraKinds.setMotos}
                  onBikesChange={cooltraKinds.setBikes}
                />
              )}
            </>
          )}
        </div>
        )}
        {seleccio && paradesLoading && (
          <div className="map-overlay">Carregant parades…</div>
        )}
        {seleccio && paradesError && (
          <div className="map-overlay map-overlay--error" role="alert">
            No s'han pogut carregar les parades.
          </div>
        )}
        {!seleccio && (
          <div className="map-hint">Selecciona una línia per veure les parades</div>
        )}
      </section>
    </main>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}

function findDestinationStop(parades: Parada[], destinacio: string): Parada | null {
  if (!destinacio) return null;
  const target = destinacio.toLowerCase().trim();
  let m = parades.find((p) => p.nom.toLowerCase() === target);
  if (m) return m;
  m = parades.find((p) => p.nom.toLowerCase().includes(target));
  if (m) return m;
  // Try the reverse: the destinacio contains a parada name (e.g. "Onze de
  // Setembre" matches a parada literally named "Onze de Setembre").
  m = parades.find((p) => target.includes(p.nom.toLowerCase()));
  return m ?? null;
}

function polylineFromLinia(linia: Linia, parades: Parada[]) {
  if (linia.geometry) {
    if (linia.geometry.type === 'LineString') {
      return linia.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    }
    return linia.geometry.coordinates.flat().map(([lng, lat]) => ({ lat, lng }));
  }
  return parades.map((p) => ({ lat: p.lat, lng: p.lng }));
}
