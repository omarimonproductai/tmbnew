import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { BicingFilters } from './BicingFilters';
import { BicingLayer } from './BicingLayer';
import { Toast } from './Toast';
import { useBicingFilter } from '../hooks/useBicingFilter';
import { useBicingStations } from '../hooks/useBicingStations';
import { useGeolocation } from '../hooks/useGeolocation';
import { rotateOptions } from '../utils/leafletRotate';
import { filterStations } from '../utils/bicingFilter';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];
const FILTER_STORAGE_KEY = 'tmb-bicing-filter-v1';
const DEFAULT_ZOOM = 15;

// New "Bicing" mode: the full city map of every station, filterable by bike
// type (electric / mechanical), both chips deselectable.
export function BicingView() {
  const { stations, lastFailureAt } = useBicingStations(true);
  const filters = useBicingFilter(FILTER_STORAGE_KEY);
  const { position } = useGeolocation(true);

  // In Bicing mode it's always one or the other — never 'cap' (blank map).
  const action: 'agafar' | 'retornar' =
    filters.state.action === 'retornar' ? 'retornar' : 'agafar';
  const effState = { action };
  const visible = useMemo(() => filterStations(stations, effState), [stations, action]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  useEffect(() => {
    if (lastFailureAt) {
      setToastMsg("No s'han pogut actualitzar les estacions. Mostrant les últimes guardades.");
    }
  }, [lastFailureAt]);

  return (
    <main className="app-main">
      <section className="map-area" aria-label="Mapa d'estacions Bicing">
        <MapContainer
          center={position ? [position.lat, position.lng] : FALLBACK_CENTER}
          zoom={DEFAULT_ZOOM}
          zoomSnap={0}
          className="map-container"
          scrollWheelZoom
          {...(rotateOptions() as Record<string, unknown>)}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
            maxZoom={20}
          />
          {position && (
            <CircleMarker
              center={[position.lat, position.lng]}
              radius={8}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1d7df2', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
                Tu
              </Tooltip>
            </CircleMarker>
          )}
          <BicingLayer stations={visible} filter={effState} origin={position} />
          <CenterOnUser userPosition={position} />
          <RecenterButton userPosition={position} />
          <InvalidateOnResize />
        </MapContainer>
        <div className="bicing-mode-filters">
          <BicingFilters
            state={effState}
            onToggleAgafar={() => filters.setAction('agafar')}
            onToggleRetornar={() => filters.setAction('retornar')}
            round
          />
        </div>
      </section>
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </main>
  );
}

// Centre on the user at a street-level zoom once their position arrives
// (the map opens here by default); afterwards the user pans/zooms freely.
function CenterOnUser({ userPosition }: { userPosition: { lat: number; lng: number } | null }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !userPosition) return;
    map.setView([userPosition.lat, userPosition.lng], DEFAULT_ZOOM);
    done.current = true;
  }, [userPosition, map]);
  return null;
}

function RecenterButton({ userPosition }: { userPosition: { lat: number; lng: number } | null }) {
  const map = useMap();
  if (!userPosition) return null;
  return (
    <div className="recenter-control" style={{ bottom: '16px' }}>
      <button
        type="button"
        onClick={() => map.setView([userPosition.lat, userPosition.lng], 15)}
        aria-label="Centrar el mapa a la meva ubicació"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
        </svg>
      </button>
    </div>
  );
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (typeof ResizeObserver === 'undefined') return;
    const container = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);
  return null;
}
