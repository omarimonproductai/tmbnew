import { useEffect, useState } from 'react';
import { AproperMeuView } from './components/AproperMeuView';
import { BicingView } from './components/BicingView';
import { FavoritsView } from './components/FavoritsView';
import { FgcLogo } from './components/FgcLogo';
import { InstallBanner } from './components/InstallBanner';
import { LiniesView } from './components/LiniesView';
import { ModeToggle, type AppMode } from './components/ModeToggle';
import { RoutePlannerView } from './components/RoutePlannerView';
import { Toast } from './components/Toast';
import { isStandalone, useIsOffline } from './hooks/useDisplayMode';
import { useTotesParades } from './hooks/useTotesParades';
import { getLiniesSnapshot, getParadesSnapshot } from './stores/favorits';
import { PLANNER_OPEN_EVENT } from './utils/plannerSeed';
import type { Coordinate, ParadaAmbLinies } from './types/tmb';
import './App.css';

export interface RequestedLine {
  id: string;
  focus?: Coordinate;
}

function readParadaParam(): string | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search).get('parada');
  return p && p.trim() ? p : null;
}

// Installed (standalone) launches land on Favourites when the user has any,
// reinforcing the daily-habit loop; otherwise keep the default landing view.
// A shared ?parada= link always starts on a neutral view (the deep-link
// effect then opens the stop's line).
function initialMode(): AppMode {
  if (readParadaParam()) return 'aprop-meu';
  const hasFavs =
    getLiniesSnapshot().length + getParadesSnapshot().length > 0;
  return isStandalone() && hasFavs ? 'favorits' : 'aprop-meu';
}

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(initialMode);
  const [requestedLine, setRequestedLine] = useState<RequestedLine | null>(null);
  const [requestedParada, setRequestedParada] = useState<string | null>(readParadaParam);
  const [sharedStop, setSharedStop] = useState<ParadaAmbLinies | null>(null);

  const offline = useIsOffline();
  const [offlineToast, setOfflineToast] = useState(false);
  useEffect(() => {
    if (offline) setOfflineToast(true);
  }, [offline]);

  // Stop popups can ask the planner to take over with a pre-filled destination
  useEffect(() => {
    const handler = () => setAppMode('route');
    window.addEventListener(PLANNER_OPEN_EVENT, handler);
    return () => window.removeEventListener(PLANNER_OPEN_EVENT, handler);
  }, []);

  const openLine = (id: string, focus?: Coordinate) => {
    setRequestedLine({ id, focus });
    setAppMode('linies');
  };

  // Resolve a shared ?parada= link: find the stop and open its card (all
  // lines + real-time), then tidy the URL so a refresh won't re-trigger.
  const { parades } = useTotesParades(!!requestedParada);
  useEffect(() => {
    if (!requestedParada || parades.length === 0) return;
    const stop = parades.find((p) => p.id === requestedParada);
    if (stop) setSharedStop(stop);
    setRequestedParada(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('parada');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, [requestedParada, parades]);

  return (
    <div className="app">
      <header className="app-header">
        <img className="tmb-logo" src="/pwa-512.png" alt="Tu et Mous Bé" />
        <div className="app-title">
          <h1>Tu et Mous Bé</h1>
          <span>Barcelona · Àrea Metropolitana</span>
        </div>
        <ModeToggle value={appMode} onChange={setAppMode} />
      </header>
      {appMode === 'route' && <RoutePlannerView />}
      {appMode === 'linies' && (
        <LiniesView
          requestedLine={requestedLine}
          onRequestedLineConsumed={() => setRequestedLine(null)}
        />
      )}
      {appMode === 'fgc' && (
        <main className="app-main mode-placeholder">
          <div className="mode-placeholder__card">
            <FgcLogo size={48} />
            <p>FGC · properament</p>
          </div>
        </main>
      )}
      {appMode === 'bicing' && <BicingView />}
      {appMode === 'aprop-meu' && <AproperMeuView focusStop={sharedStop} />}
      {appMode === 'favorits' && <FavoritsView onOpenLine={openLine} />}
      <InstallBanner />
      {offlineToast && (
        <Toast
          message="Sense connexió: el temps real no s'actualitza."
          tone="error"
          onDismiss={() => setOfflineToast(false)}
        />
      )}
    </div>
  );
}
