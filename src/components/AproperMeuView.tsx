import { useEffect, useMemo, useRef, useState } from 'react';
import { AproperMeuMap } from './AproperMeuMap';
import { BicingFilters } from './BicingFilters';
import { BicingStationRow } from './BicingStationRow';
import { CooltraKindFilters } from './CooltraKindFilters';
import { CooltraMapButton } from './CooltraMapButton';
import { FilterBar } from './FilterBar';
import { LocationBlock } from './LocationBlock';
import { ParadesAprop } from './ParadesAprop';
import { Toast } from './Toast';
import { useBicingFilter } from '../hooks/useBicingFilter';
import { useBicingStations } from '../hooks/useBicingStations';
import { useCooltraKindFilters } from '../hooks/useCooltraKindFilters';
import { useCooltraVehicles } from '../hooks/useCooltraVehicles';
import { useGeolocation } from '../hooks/useGeolocation';
import { inferKind } from '../types/cooltra';
import type { FilterType } from '../hooks/useLinies';
import { useParadesAprop } from '../hooks/useParadesAprop';
import { useTotesParades } from '../hooks/useTotesParades';
import { filterStations, resolveBicingFilter } from '../utils/bicingFilter';
import { haversine } from '../utils/distance';
import type { ParadaAmbLinies, ParadaAprop } from '../types/tmb';

const TOP_N = 5;
const SHEET_MIN_HEIGHT = 80; // peek height (px)
const SHEET_DEFAULT_OPEN_RATIO = 0.5; // opens enough to reveal the list
const SHEET_MAX_RATIO = 0.92; // never fully cover the header
const DRAG_THRESHOLD = 4; // px before a press is treated as a drag
const RADIUS_STORAGE_KEY = 'tmb-aprop-meu-radius';
const RADIUS_MIN = 100;
const RADIUS_MAX = 1500;
const RADIUS_DEFAULT = 300;
const COOLTRA_STORAGE_KEY = 'tmb-cooltra-visible-v1';
const FILTER_STORAGE_KEY = 'tmb-aprop-meu-filter-v1';
const BICING_FILTER_STORAGE_KEY = 'tmb-aprop-bicing-filter-v1';

function loadStoredRadius(): number {
  if (typeof window === 'undefined') return RADIUS_DEFAULT;
  try {
    const raw = window.localStorage.getItem(RADIUS_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= RADIUS_MIN && n <= RADIUS_MAX) return n;
  } catch {
    // localStorage may throw in private browsing; fall through to default.
  }
  return RADIUS_DEFAULT;
}

function loadStoredCooltra(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(COOLTRA_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function loadStoredFilter(): FilterType {
  if (typeof window === 'undefined') return 'tots';
  try {
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (raw === 'tots' || raw === 'cap' || raw === 'metro' || raw === 'bus') return raw;
  } catch {
    // ignore
  }
  return 'tots';
}

function getViewportHeight(): number {
  if (typeof window === 'undefined') return 600;
  return window.visualViewport?.height ?? window.innerHeight;
}

function getIsMobile(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(max-width: 640px)').matches;
}

// Start the bottom sheet open (showing the list) on mobile so users see
// there are stops to browse without having to drag it up first.
function initialSheetHeight(): number {
  if (!getIsMobile()) return SHEET_MIN_HEIGHT;
  return Math.round(getViewportHeight() * SHEET_DEFAULT_OPEN_RATIO);
}

export function AproperMeuView({
  focusStop = null,
}: {
  focusStop?: ParadaAmbLinies | null;
} = {}) {
  const [radius, setRadius] = useState<number>(loadStoredRadius);
  const [filtre, setFiltre] = useState<FilterType>(loadStoredFilter);
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
  // A list tap "winks" the matching map marker. The nonce lets the same
  // stop re-trigger the animation on repeated taps.
  const [winkTarget, setWinkTarget] = useState<{ id: string; nonce: number } | null>(null);
  const [sheetHeight, setSheetHeight] = useState(initialSheetHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Expose the live sheet height to the CSS so map overlays (the zoom
  // controls) can sit above the sheet as it grows.
  useEffect(() => {
    if (!isMobile) return;
    const root = document.documentElement;
    root.style.setProperty('--sheet-height', `${sheetHeight}px`);
    return () => {
      root.style.removeProperty('--sheet-height');
    };
  }, [sheetHeight, isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(RADIUS_STORAGE_KEY, String(radius));
    } catch {
      // ignore quota / private-mode errors
    }
  }, [radius]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COOLTRA_STORAGE_KEY, cooltraOn ? '1' : '0');
    } catch {
      // ignore quota / private-mode errors
    }
  }, [cooltraOn]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(FILTER_STORAGE_KEY, filtre);
    } catch {
      // ignore
    }
  }, [filtre]);
  const dragRef = useRef<{
    startY: number;
    startHeight: number;
    moved: boolean;
  } | null>(null);
  // Remembers the last height the user explicitly dragged the sheet to so a
  // tap restores it instead of always snapping to the default open ratio.
  const lastOpenHeightRef = useRef<number>(0);

  // Keep the sheet within the viewport when the device rotates.
  useEffect(() => {
    const handler = () => {
      const max = Math.round(getViewportHeight() * SHEET_MAX_RATIO);
      setSheetHeight((h) => Math.min(h, max));
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const { position, status, error, refresh } = useGeolocation(true);
  const { parades, loading: loadingParades, lastFailureAt } = useTotesParades(true);
  const { paradesDins } = useParadesAprop(position, radius, parades);
  const paradesFiltrades = useMemo(
    () =>
      filtre === 'tots'
        ? paradesDins
        : paradesDins.filter((p) => p.tipus === filtre),
    [paradesDins, filtre],
  );

  // Bicing: own layer + own list section (kept out of the "X parades a prop"
  // count). Filtered by the two chips (availability) and by the radius.
  const { stations: bicingStations, lastFailureAt: bicingFailureAt, refresh: refreshBicing } =
    useBicingStations(true);
  // The manual "Actualitzar" button refreshes the GPS fix and the live Bicing
  // counts together (TMB stops are static; real-time arrivals load per stop).
  const handleRefresh = () => {
    refresh();
    refreshBicing();
  };
  const bicingFilters = useBicingFilter(BICING_FILTER_STORAGE_KEY);
  const bicingFilter = resolveBicingFilter(bicingFilters.electric, bicingFilters.mecanic);
  const bicingNear = useMemo(() => {
    if (!position) return [];
    return filterStations(bicingStations, bicingFilter)
      .map((s) => ({ station: s, distanceM: haversine(position, { lat: s.lat, lng: s.lng }) }))
      .filter((x) => x.distanceM <= radius)
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [bicingStations, bicingFilter, position, radius]);
  const bicingMapStations = useMemo(() => bicingNear.map((x) => x.station), [bicingNear]);

  // A shared ?parada= link focuses a stop on the map; make sure its marker
  // is present even if it falls outside the radius or the active filter.
  const mapParades = useMemo<ParadaAprop[]>(() => {
    if (!focusStop || paradesFiltrades.some((p) => p.id === focusStop.id)) {
      return paradesFiltrades;
    }
    const distanciaM = position
      ? haversine(position, { lat: focusStop.lat, lng: focusStop.lng })
      : 0;
    return [{ ...focusStop, distanciaM }, ...paradesFiltrades];
  }, [paradesFiltrades, focusStop, position]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (lastFailureAt) {
      setToastMsg(
        "No s'han pogut actualitzar les dades. Mostrant les últimes guardades.",
      );
    }
  }, [lastFailureAt]);
  useEffect(() => {
    if (bicingFailureAt) {
      setToastMsg(
        "No s'han pogut actualitzar les estacions Bicing. Mostrant les últimes guardades.",
      );
    }
  }, [bicingFailureAt]);

  const isOpen = sheetHeight > SHEET_MIN_HEIGHT + 20;

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = {
      startY: e.clientY,
      startHeight: sheetHeight,
      moved: false,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dy) > DRAG_THRESHOLD) dragRef.current.moved = true;
    const max = Math.round(getViewportHeight() * SHEET_MAX_RATIO);
    const next = Math.max(
      SHEET_MIN_HEIGHT,
      Math.min(max, dragRef.current.startHeight - dy),
    );
    setSheetHeight(next);
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    if (!dragRef.current.moved) {
      const collapsed = sheetHeight <= SHEET_MIN_HEIGHT + 20;
      const defaultOpen = Math.round(getViewportHeight() * SHEET_DEFAULT_OPEN_RATIO);
      const target = collapsed
        ? lastOpenHeightRef.current > SHEET_MIN_HEIGHT + 40
          ? lastOpenHeightRef.current
          : defaultOpen
        : SHEET_MIN_HEIGHT;
      setSheetHeight(target);
    } else if (sheetHeight > SHEET_MIN_HEIGHT + 40) {
      lastOpenHeightRef.current = sheetHeight;
    }
    dragRef.current = null;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <main className="app-main">
      <aside
        className={`panel panel--bottom-sheet${isOpen ? ' panel--open' : ''}`}
        style={
          isMobile
            ? {
                height: `${sheetHeight}px`,
                transition: isDragging ? 'none' : undefined,
              }
            : undefined
        }
      >
        <button
          type="button"
          className="sheet-handle"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Tancar llista de parades' : 'Obrir llista de parades'}
        >
          <span className="sheet-grip" aria-hidden="true" />
          <span className="sheet-label">
            {position
              ? `${paradesFiltrades.length} parades a prop · ${radius} m`
              : 'Esperant ubicació'}
            <svg
              className={`sheet-chevron${isOpen ? ' open' : ''}`}
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>
        <div className="sheet-body">
          <LocationBlock
            position={position}
            status={status}
            error={error}
            onRefresh={handleRefresh}
            radius={radius}
            onRadiusChange={setRadius}
          />
          {loadingParades && parades.length === 0 && (
            <div className="state-msg">Carregant parades de tota la xarxa…</div>
          )}
          {(parades.length > 0 || bicingStations.length > 0) && (
            <div className="aprop-filters-row">
              {parades.length > 0 && <FilterBar value={filtre} onChange={setFiltre} />}
              {bicingStations.length > 0 && (
                <BicingFilters
                  electric={bicingFilters.electric}
                  mecanic={bicingFilters.mecanic}
                  onElectricChange={bicingFilters.setElectric}
                  onMecanicChange={bicingFilters.setMecanic}
                />
              )}
            </div>
          )}
          {parades.length > 0 && (
            <ParadesAprop
              parades={paradesFiltrades}
              topN={TOP_N}
              onSelectParada={(id) =>
                setWinkTarget((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }))
              }
            />
          )}
          {bicingNear.length > 0 && (
            <div className="bicing-near-section">
              <div className="section-title">
                Estacions Bicing a prop{' '}
                <span className="section-count">· {bicingNear.length}</span>
              </div>
              {bicingNear.map(({ station, distanceM }) => (
                <BicingStationRow key={station.id} station={station} distanceM={distanceM} />
              ))}
            </div>
          )}
        </div>
      </aside>
      <section className="map-area" aria-label="Mapa amb radi de cerca">
        <AproperMeuMap
          centre={position}
          radiM={radius}
          parades={mapParades}
          topN={TOP_N}
          winkTarget={winkTarget}
          focusStopId={focusStop?.id ?? null}
          bottomInset={isMobile ? sheetHeight : 0}
          onRefresh={refresh}
          cooltraVehicles={visibleCooltra}
          bicingStations={bicingMapStations}
        />
        <div className="cooltra-map-control">
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
        {!position && status !== 'requesting' && (
          <div className="map-hint">
            {status === 'denied'
              ? 'Activa la geolocalització per veure el radi'
              : 'Esperant ubicació…'}
          </div>
        )}
      </section>
      {toastMsg && (
        <Toast
          message={toastMsg}
          onDismiss={() => setToastMsg(null)}
        />
      )}
    </main>
  );
}
