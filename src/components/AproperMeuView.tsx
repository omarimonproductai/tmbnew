import { useEffect, useMemo, useRef, useState } from 'react';
import { AproperMeuMap } from './AproperMeuMap';
import { FilterBar } from './FilterBar';
import { LocationBlock } from './LocationBlock';
import { ParadesAprop } from './ParadesAprop';
import { Toast } from './Toast';
import { useGeolocation } from '../hooks/useGeolocation';
import type { FilterType } from '../hooks/useLinies';
import { useParadesAprop } from '../hooks/useParadesAprop';
import { useTotesParades } from '../hooks/useTotesParades';

const TOP_N = 5;
const SHEET_MIN_HEIGHT = 80; // peek height (px)
const SHEET_DEFAULT_OPEN_RATIO = 0.55; // mid screen
const SHEET_MAX_RATIO = 0.92; // never fully cover the header
const DRAG_THRESHOLD = 4; // px before a press is treated as a drag
const RADIUS_STORAGE_KEY = 'tmb-aprop-meu-radius';
const RADIUS_MIN = 300;
const RADIUS_MAX = 2000;
const RADIUS_DEFAULT = 500;

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

export function AproperMeuView() {
  const [radius, setRadius] = useState<number>(loadStoredRadius);
  const [filtre, setFiltre] = useState<FilterType>('tots');
  // A list tap "winks" the matching map marker. The nonce lets the same
  // stop re-trigger the animation on repeated taps.
  const [winkTarget, setWinkTarget] = useState<{ id: string; nonce: number } | null>(null);
  const [sheetHeight, setSheetHeight] = useState(SHEET_MIN_HEIGHT);
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

  const { position, accuracy, status, error, refresh } = useGeolocation(true);
  const { parades, loading: loadingParades, lastFailureAt } = useTotesParades(true);
  const { paradesDins } = useParadesAprop(position, radius, parades);
  const paradesFiltrades = useMemo(
    () =>
      filtre === 'tots'
        ? paradesDins
        : paradesDins.filter((p) => p.tipus === filtre),
    [paradesDins, filtre],
  );

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (lastFailureAt) {
      setToastMsg(
        "No s'han pogut actualitzar les dades. Mostrant les últimes guardades.",
      );
    }
  }, [lastFailureAt]);

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
            accuracy={accuracy}
            status={status}
            error={error}
            onRefresh={refresh}
            radius={radius}
            onRadiusChange={setRadius}
          />
          {loadingParades && parades.length === 0 && (
            <div className="state-msg">Carregant parades de tota la xarxa…</div>
          )}
          {parades.length > 0 && (
            <>
              <FilterBar value={filtre} onChange={setFiltre} />
              <ParadesAprop
                parades={paradesFiltrades}
                topN={TOP_N}
                onSelectParada={(id) =>
                  setWinkTarget((prev) => ({ id, nonce: (prev?.nonce ?? 0) + 1 }))
                }
              />
            </>
          )}
        </div>
      </aside>
      <section className="map-area" aria-label="Mapa amb radi de cerca">
        <AproperMeuMap
          centre={position}
          radiM={radius}
          parades={paradesFiltrades}
          topN={TOP_N}
          winkTarget={winkTarget}
          bottomInset={isMobile ? sheetHeight : 0}
          onRefresh={refresh}
        />
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
