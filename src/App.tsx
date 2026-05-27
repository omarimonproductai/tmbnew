import { useState } from 'react';
import { AproperMeuView } from './components/AproperMeuView';
import { FavoritsView } from './components/FavoritsView';
import { LiniesView } from './components/LiniesView';
import { ModeToggle, type AppMode } from './components/ModeToggle';
import type { Coordinate } from './types/tmb';
import './App.css';

export interface RequestedLine {
  id: string;
  focus?: Coordinate;
}

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('aprop-meu');
  const [requestedLine, setRequestedLine] = useState<RequestedLine | null>(null);

  const openLine = (id: string, focus?: Coordinate) => {
    setRequestedLine({ id, focus });
    setAppMode('linies');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="tmb-logo">TMB</div>
        <div className="app-title">
          <h1>Línies de Transport</h1>
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
    </div>
  );
}
