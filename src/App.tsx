import { useEffect, useState } from 'react';
import { AproperMeuView } from './components/AproperMeuView';
import { FavoritsView } from './components/FavoritsView';
import { InstallBanner } from './components/InstallBanner';
import { LiniesView } from './components/LiniesView';
import { ModeToggle, type AppMode } from './components/ModeToggle';
import { Toast } from './components/Toast';
import { isStandalone, useIsOffline } from './hooks/useDisplayMode';
import { getLiniesSnapshot, getParadesSnapshot } from './stores/favorits';
import type { Coordinate } from './types/tmb';
import './App.css';

export interface RequestedLine {
  id: string;
  focus?: Coordinate;
}

// Installed (standalone) launches land on Favourites when the user has any,
// reinforcing the daily-habit loop; otherwise keep the default landing view.
function initialMode(): AppMode {
  const hasFavs =
    getLiniesSnapshot().length + getParadesSnapshot().length > 0;
  return isStandalone() && hasFavs ? 'favorits' : 'aprop-meu';
}

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>(initialMode);
  const [requestedLine, setRequestedLine] = useState<RequestedLine | null>(null);

  const offline = useIsOffline();
  const [offlineToast, setOfflineToast] = useState(false);
  useEffect(() => {
    if (offline) setOfflineToast(true);
  }, [offline]);

  const openLine = (id: string, focus?: Coordinate) => {
    setRequestedLine({ id, focus });
    setAppMode('linies');
  };

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
      {appMode === 'linies' && (
        <LiniesView
          requestedLine={requestedLine}
          onRequestedLineConsumed={() => setRequestedLine(null)}
        />
      )}
      {appMode === 'aprop-meu' && <AproperMeuView />}
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
