import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { FgcLayer } from './FgcLayer';
import { RefreshControl } from './RefreshControl';
import { SearchInput } from './SearchInput';
import { useFgcLinies } from '../hooks/useFgcLinies';
import { useFgcLiniaDetall } from '../hooks/useFgcLiniaDetall';
import { useFgcVehicles } from '../hooks/useFgcVehicles';
import { useGeolocation } from '../hooks/useGeolocation';
import { rotateOptions } from '../utils/leafletRotate';
import { useState } from 'react';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];

export function FgcView() {
  const { liniesFiltrades, loading, error, cerca, setCerca, sort, setSort } =
    useFgcLinies();
  const [selected, setSelected] = useState<string | null>(null);
  const { detall } = useFgcLiniaDetall(selected);
  const { vehicles, refresh } = useFgcVehicles(selected, !!selected);
  const { position } = useGeolocation(true);

  const color = detall?.linia.color ?? '#1f7a3d';
  const polyline = useMemo<[number, number][]>(
    () => (detall ? detall.geometry.map(([lng, lat]) => [lat, lng]) : []),
    [detall],
  );

  return (
    <main className="app-main fgc-main">
      <aside className="fgc-panel">
        <div className="fgc-panel-head">
          <SearchInput value={cerca} onChange={setCerca} />
          <button
            type="button"
            className="fgc-sort-btn"
            onClick={() => setSort(sort === 'az' ? 'za' : 'az')}
            title="Ordena alfabèticament"
            aria-label="Ordena alfabèticament"
          >
            {sort === 'za' ? 'Z·A' : 'A·Z'}
          </button>
        </div>
        <div className="fgc-line-list">
          {loading && <div className="state-msg">Carregant línies FGC…</div>}
          {error && <div className="state-msg state-msg--error">{error}</div>}
          {liniesFiltrades.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`fgc-line-row${selected === l.codi ? ' active' : ''}`}
              onClick={() => setSelected(selected === l.codi ? null : l.codi)}
            >
              <span className="fgc-line-badge" style={{ background: l.color }}>
                {l.codi}
              </span>
              <span className="fgc-line-name">{l.nom}</span>
              <span className="fgc-line-count">{l.numParades}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="map-area" aria-label="Mapa FGC">
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
              radius={7}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1d7df2', fillOpacity: 1 }}
            >
              <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
                Tu
              </Tooltip>
            </CircleMarker>
          )}
          {polyline.length > 1 && (
            <Polyline positions={polyline} pathOptions={{ color, weight: 5, opacity: 0.9 }} />
          )}
          {detall && <FgcLayer parades={detall.parades} color={color} origin={position} />}
          {vehicles.map((v) => (
            <CircleMarker
              key={v.id}
              center={[v.lat, v.lng]}
              radius={6}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: color, fillOpacity: 1 }}
            >
              <Tooltip direction="top" className="stop-tooltip">
                <span className="tooltip-name">{v.liniaCodi} {v.destinacio ?? ''}</span>
              </Tooltip>
            </CircleMarker>
          ))}
          <FitToLine points={polyline} />
          {position && <RecenterButton userPosition={position} />}
          <InvalidateOnResize />
        </MapContainer>
        {!selected && (
          <div className="map-hint">Selecciona una línia FGC per veure les parades</div>
        )}
        {selected && (
          <div className="map-controls-stack">
            <RefreshControl onRefresh={refresh} />
          </div>
        )}
      </section>
    </main>
  );
}

// Fit to the line once it loads (and only when the line actually changes — a
// signature guard so background refreshes don't reset the user's zoom).
function FitToLine({ points }: { points: [number, number][] }) {
  const map = useMap();
  const lastSig = useRef('');
  const signature =
    points.length < 2
      ? ''
      : `${points.length}|${points[0][0]},${points[0][1]}|${points[points.length - 1][0]},${points[points.length - 1][1]}`;
  useEffect(() => {
    if (points.length < 2 || signature === lastSig.current) return;
    lastSig.current = signature;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [50, 50] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, map]);
  return null;
}

function RecenterButton({ userPosition }: { userPosition: { lat: number; lng: number } }) {
  const map = useMap();
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
