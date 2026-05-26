import { useState } from 'react';
import { AproperMeuView } from './components/AproperMeuView';
import { FavoritsView } from './components/FavoritsView';
import { LiniesView } from './components/LiniesView';
import { ModeToggle, type AppMode } from './components/ModeToggle';
import './App.css';

export default function App() {
  const [appMode, setAppMode] = useState<AppMode>('aprop-meu');
  const [requestedLineId, setRequestedLineId] = useState<string | null>(null);

  const openLine = (id: string) => {
    setRequestedLineId(id);
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
          requestedLineId={requestedLineId}
          onRequestedLineConsumed={() => setRequestedLineId(null)}
        />
      )}
      {appMode === 'aprop-meu' && <AproperMeuView />}
      {appMode === 'favorits' && <FavoritsView onOpenLine={openLine} />}
    </div>
  );
}
