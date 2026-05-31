import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { AproperMeuStopPopup } from './AproperMeuStopPopup';
import { BicingLayer } from './BicingLayer';
import { CooltraLayer } from './CooltraLayer';
import { FgcLayer } from './FgcLayer';
import { getLineColor, pickRepresentativeLine } from '../utils/lineColor';
import { rotateOptions } from '../utils/leafletRotate';
import type { BicingStation } from '../types/bicing';
import type { CooltraVehicle } from '../types/cooltra';
import type { FgcParada } from '../types/fgc';
import type { Coordinate, FavParada } from '../types/tmb';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];

interface Props {
  parades: FavParada[];
  userPosition?: Coordinate | null;
  cooltraVehicles?: CooltraVehicle[];
  bicingStations?: BicingStation[];
  fgcStations?: FgcParada[];
}

export function FavMap({
  parades,
  userPosition,
  cooltraVehicles = [],
  bicingStations = [],
  fgcStations = [],
}: Props) {
  return (
    <MapContainer
      center={FALLBACK_CENTER}
      zoom={13}
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
      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={7}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1d7df2', fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
            Tu
          </Tooltip>
        </CircleMarker>
      )}
      {cooltraVehicles.length > 0 && <CooltraLayer vehicles={cooltraVehicles} />}
      {bicingStations.length > 0 && (
        <BicingLayer
          stations={bicingStations}
          filter={{ action: 'agafar' }}
          origin={userPosition}
          showFavStar={false}
        />
      )}
      {fgcStations.length > 0 && (
        <FgcLayer parades={fgcStations} origin={userPosition} showFavStar={false} />
      )}
      {parades.map((p) => (
        <FavMarker key={p.id} parada={p} />
      ))}
      <FitToFavs
        parades={parades}
        bicingStations={bicingStations}
        fgcStations={fgcStations}
        userPosition={userPosition}
      />
      {userPosition && <FavRecenterButton userPosition={userPosition} />}
      <InvalidateOnResize />
    </MapContainer>
  );
}

function FavMarker({ parada }: { parada: FavParada }) {
  const [open, setOpen] = useState(false);
  const rep = pickRepresentativeLine(parada.liniesQueParen);
  const color = rep ? getLineColor(rep) : '#666';
  return (
    <CircleMarker
      center={[parada.lat, parada.lng]}
      radius={10}
      pathOptions={{ color: '#ffffff', weight: 2.5, fillColor: color, fillOpacity: 1 }}
      eventHandlers={{
        popupopen: () => setOpen(true),
        popupclose: () => setOpen(false),
      }}
    >
      <Tooltip direction="top" offset={[0, -4]} className="stop-tooltip">
        <span className="tooltip-name">{parada.nom}</span>
      </Tooltip>
      <Popup>
        <AproperMeuStopPopup parada={parada} enabled={open} />
      </Popup>
    </CircleMarker>
  );
}

function FavRecenterButton({ userPosition }: { userPosition: Coordinate }) {
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

function FitToFavs({
  parades,
  bicingStations,
  fgcStations = [],
  userPosition,
}: {
  parades: FavParada[];
  bicingStations: BicingStation[];
  fgcStations?: FgcParada[];
  userPosition?: Coordinate | null;
}) {
  const map = useMap();
  // Fit ONCE, the first time we have valid bounds. Re-fitting when the GPS
  // position (or async Bicing data) arrives later would zoom out to keep the
  // user's distant location in view — exactly the jump we want to avoid. The
  // recenter button stays available to jump to the user on demand.
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current) return;
    const bounds = L.latLngBounds([]);
    for (const p of parades) bounds.extend([p.lat, p.lng]);
    for (const s of bicingStations) bounds.extend([s.lat, s.lng]);
    for (const f of fgcStations) bounds.extend([f.lat, f.lng]);
    if (userPosition) bounds.extend([userPosition.lat, userPosition.lng]);
    if (bounds.isValid()) {
      fitted.current = true;
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [parades, bicingStations, fgcStations, userPosition, map]);
  return null;
}

function InvalidateOnResize() {
  const map = useMap();
  useEffect(() => {
    const handler = () => map.invalidateSize();
    window.addEventListener('resize', handler);
    const t = window.setTimeout(handler, 100);
    return () => {
      window.removeEventListener('resize', handler);
      window.clearTimeout(t);
    };
  }, [map]);
  return null;
}
