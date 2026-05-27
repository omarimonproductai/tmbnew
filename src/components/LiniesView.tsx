import { useEffect, useMemo, useState } from 'react';
import { FilterBar } from './FilterBar';
import { LineHeaderBanner } from './LineHeaderBanner';
import { LineList } from './LineList';
import { LineListView } from './LineListView';
import { MapView } from './MapView';
import { RefreshControl } from './RefreshControl';
import { SearchInput } from './SearchInput';
import { SortControls, type SortMode } from './SortControls';
import { VehicleVisibilityToggle } from './VehicleVisibilityToggle';
import { ViewToggle, type ViewMode } from './ViewToggle';
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

function getIsMobile(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(max-width: 640px)').matches;
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
  // On mobile we want the line list to be the landing UI: it greets the
  // user expanded, and the FAB only appears once they've picked a line
  // (so they have something on the map to look at).
  const [panelOpen, setPanelOpen] = useState(true);
  // When set, the map zooms onto this point (a favourite stop) instead of
  // fitting the whole line. Cleared on any manual line pick.
  const [mapFocus, setMapFocus] = useState<Coordinate | null>(null);

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
          <button
            type="button"
            className={`panel-toggle-mobile${panelOpen ? ' active' : ''}`}
            onClick={() => setPanelOpen((v) => !v)}
            aria-label={panelOpen ? 'Tancar cerca de línies' : 'Obrir cerca de línies'}
            aria-expanded={panelOpen}
          >
          {panelOpen ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="16" y1="16" x2="21" y2="21" />
            </svg>
          )}
          </button>
        )}
        {seleccio && (
          <div className="line-header-wrapper">
            <LineHeaderBanner linia={seleccio} />
          </div>
        )}
        {seleccio && (
          <div className="view-toggle-wrapper">
            <ViewToggle value={viewMode} onChange={setViewMode} />
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
          />
        )}
        {seleccio && (
          <div className="map-controls-stack">
            <RefreshControl onRefresh={refreshVehicles} />
            <VehicleVisibilityToggle
              value={showVehicles}
              onChange={setShowVehicles}
              tipus={seleccio.tipus}
            />
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
