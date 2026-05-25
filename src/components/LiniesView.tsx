import { useMemo, useState } from 'react';
import { FilterBar } from './FilterBar';
import { LineHeaderBanner } from './LineHeaderBanner';
import { LineList } from './LineList';
import { LineListView } from './LineListView';
import { MapView } from './MapView';
import { RefreshControl } from './RefreshControl';
import { SearchInput } from './SearchInput';
import { VehicleVisibilityToggle } from './VehicleVisibilityToggle';
import { ViewToggle, type ViewMode } from './ViewToggle';
import { useLinies } from '../hooks/useLinies';
import { useParades } from '../hooks/useParades';
import { useTotesParades } from '../hooks/useTotesParades';
import { useVehicles } from '../hooks/useVehicles';
import { findCorrespondences } from '../utils/correspondences';
import { extrapolateVehiclePosition } from '../utils/route';
import { SPEED_M_S } from '../utils/transit';
import type {
  Linia,
  LiniaResum,
  Parada,
  VehiclePos,
} from '../types/tmb';

export function LiniesView() {
  const {
    liniesFiltrades,
    loading,
    error,
    filtre,
    setFiltre,
    cerca,
    setCerca,
  } = useLinies();
  const [seleccio, setSeleccio] = useState<Linia | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showVehicles, setShowVehicles] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  const handleSelect = (linia: Linia) => {
    setSeleccio(linia);
    setPanelOpen(false);
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
      <aside className={`panel${panelOpen ? ' panel--open' : ''}`}>
        <FilterBar value={filtre} onChange={setFiltre} />
        <SearchInput value={cerca} onChange={setCerca} />
        <LineList
          linies={liniesFiltrades}
          loading={loading}
          error={error}
          selectedId={seleccio?.id ?? null}
          onSelect={handleSelect}
        />
      </aside>
      <section className="map-area" aria-label="Vista de la línia">
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
          />
        ) : (
          <LineListView
            linia={seleccio}
            parades={parades}
            vehicles={
              showVehicles && vehiclesData ? vehiclesData.vehicles : []
            }
            correspondencesPerParada={correspondencesPerParada}
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
