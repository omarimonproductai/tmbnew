import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { BicingFilters } from './BicingFilters';
import { BicingLayer } from './BicingLayer';
import { Toast } from './Toast';
import { useBicingFilter } from '../hooks/useBicingFilter';
import { useBicingStations } from '../hooks/useBicingStations';
import { useGeolocation } from '../hooks/useGeolocation';
import { rotateOptions } from '../utils/leafletRotate';
import { filterStations, resolveBicingFilter } from '../utils/bicingFilter';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];
const FILTER_STORAGE_KEY = 'tmb-bicing-filter-v1';

// New "Bicing" mode: the full city map of every station, filterable by bike
// type (electric / mechanical), both chips deselectable.
export function BicingView() {
  const { stations, lastFailureAt } = useBicingStations(true);
  const filters = useBicingFilter(FILTER_STORAGE_KEY);
  const { position } = useGeolocation(true);

  const filter = resolveBicingFilter(filters.electric, filters.mecanic);
  const visible = useMemo(() => filterStations(stations, filter), [stations, filter]);

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
          zoom={13}
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
          <BicingLayer stations={visible} origin={position} />
          <FitToStations stations={visible} userPosition={position} />
          <RecenterButton userPosition={position} />
          <InvalidateOnResize />
        </MapContainer>
        <div className="bicing-mode-filters">
          <BicingFilters
            electric={filters.electric}
            mecanic={filters.mecanic}
            onElectricChange={filters.setElectric}
            onMecanicChange={filters.setMecanic}
          />
        </div>
      </section>
      {toastMsg && <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />}
    </main>
  );
}

// Fit once to the visible stations (and the user) on first paint; afterwards
// let the user pan/zoom freely.
function FitToStations({
  stations,
  userPosition,
}: {
  stations: { lat: number; lng: number }[];
  userPosition: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const done = useMemo(() => ({ v: false }), []);
  useEffect(() => {
    if (done.v || stations.length === 0) return;
    const bounds = L.latLngBounds([]);
    for (const s of stations) bounds.extend([s.lat, s.lng]);
    if (userPosition) bounds.extend([userPosition.lat, userPosition.lng]);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      done.v = true;
    }
  }, [stations, userPosition, map, done]);
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
