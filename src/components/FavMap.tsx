import L from 'leaflet';
import { useEffect, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { AproperMeuStopPopup } from './AproperMeuStopPopup';
import { getLineColor, pickRepresentativeLine } from '../utils/lineColor';
import { rotateOptions } from '../utils/leafletRotate';
import type { Coordinate, FavParada } from '../types/tmb';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];

interface Props {
  parades: FavParada[];
  userPosition?: Coordinate | null;
}

export function FavMap({ parades, userPosition }: Props) {
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
      {parades.map((p) => (
        <FavMarker key={p.id} parada={p} />
      ))}
      <FitToFavs parades={parades} userPosition={userPosition} />
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
      radius={15}
      pathOptions={{ color: '#ffffff', weight: 3, fillColor: color, fillOpacity: 1 }}
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

function FitToFavs({
  parades,
  userPosition,
}: {
  parades: FavParada[];
  userPosition?: Coordinate | null;
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([]);
    for (const p of parades) bounds.extend([p.lat, p.lng]);
    if (userPosition) bounds.extend([userPosition.lat, userPosition.lng]);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [parades, userPosition, map]);
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
