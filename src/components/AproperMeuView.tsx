import { useState } from 'react';
import { AproperMeuMap } from './AproperMeuMap';
import { LocationBlock } from './LocationBlock';
import { ParadesAprop } from './ParadesAprop';
import { useGeolocation } from '../hooks/useGeolocation';
import { useParadesAprop } from '../hooks/useParadesAprop';
import { useTotesParades } from '../hooks/useTotesParades';

const TOP_N = 5;

export function AproperMeuView() {
  const [radius, setRadius] = useState(500);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { position, accuracy, status, error, refresh } = useGeolocation(true);
  const { parades, loading: loadingParades, error: paradesError } = useTotesParades(true);
  const { paradesDins } = useParadesAprop(position, radius, parades);

  return (
    <main className="app-main">
      <aside
        className={`panel panel--bottom-sheet${sheetOpen ? ' panel--open' : ''}`}
      >
        <button
          type="button"
          className="sheet-handle"
          onClick={() => setSheetOpen((v) => !v)}
          aria-expanded={sheetOpen}
          aria-label={sheetOpen ? 'Tancar llista de parades' : 'Obrir llista de parades'}
        >
          <span className="sheet-grip" aria-hidden="true" />
          <span className="sheet-label">
            {position
              ? `${paradesDins.length} parades a prop · ${radius} m`
              : 'Esperant ubicació'}
          </span>
          <span className="sheet-caret" aria-hidden="true">
            {sheetOpen ? '▾' : '▴'}
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
          {loadingParades && (
            <div className="state-msg">Carregant parades de tota la xarxa…</div>
          )}
          {paradesError && (
            <div className="state-msg state-msg--error" role="alert">
              No s'han pogut carregar les parades. {paradesError}
            </div>
          )}
          {!loadingParades && !paradesError && (
            <ParadesAprop parades={paradesDins} topN={TOP_N} />
          )}
        </div>
      </aside>
      <section className="map-area" aria-label="Mapa amb radi de cerca">
        <AproperMeuMap
          centre={position}
          radiM={radius}
          parades={paradesDins}
          topN={TOP_N}
        />
        {!position && status !== 'requesting' && (
          <div className="map-hint">
            {status === 'denied'
              ? 'Activa la geolocalització per veure el radi'
              : 'Esperant ubicació…'}
          </div>
        )}
      </section>
    </main>
  );
}
