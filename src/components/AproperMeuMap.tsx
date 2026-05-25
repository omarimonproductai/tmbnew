import L from 'leaflet';
import { useEffect, useRef } from 'react';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { DirectionsButton } from './DirectionsButton';
import { getLineColor, pickRepresentativeLine } from '../utils/lineColor';
import type { Coordinate, ParadaAprop } from '../types/tmb';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];

interface Props {
  centre: Coordinate | null;
  radiM: number;
  parades: ParadaAprop[];
  topN: number;
  bottomInset?: number;
}

export function AproperMeuMap({ centre, radiM, parades, topN, bottomInset = 0 }: Props) {
  return (
    <MapContainer
      center={centre ? [centre.lat, centre.lng] : FALLBACK_CENTER}
      zoom={15}
      className="map-container"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />
      {centre && (
        <>
          <Circle
            center={[centre.lat, centre.lng]}
            radius={radiM}
            pathOptions={{
              color: '#1d7df2',
              fillColor: '#1d7df2',
              fillOpacity: 0.08,
              weight: 2,
              dashArray: '6 5',
            }}
          />
          <CircleMarker
            center={[centre.lat, centre.lng]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              weight: 3,
              fillColor: '#1d7df2',
              fillOpacity: 1,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
              Tu
            </Tooltip>
          </CircleMarker>
          <MapFollowsUser centre={centre} radiM={radiM} bottomInset={bottomInset} />
          <RecenterButton centre={centre} radiM={radiM} bottomInset={bottomInset} />
        </>
      )}
      {parades.map((p, idx) => {
        const rank = idx + 1;
        const isTop = rank <= topN;
        const rep = pickRepresentativeLine(p.liniesQueParen);
        const color = rep ? getLineColor(rep) : '#666';
        return (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={isTop ? 10 : 5}
            pathOptions={{
              color: '#ffffff',
              weight: isTop ? 3 : 1.5,
              fillColor: color,
              fillOpacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -4]} className="stop-tooltip">
              {isTop && <span className="rank-mini">{rank}</span>}
              <span className="tooltip-name">{p.nom}</span>
            </Tooltip>
            <Popup>
              <div className="aprop-popup">
                <div className="aprop-popup-name">{p.nom}</div>
                <div className="aprop-popup-lines">
                  {p.liniesQueParen.map((l) => (
                    <span
                      key={l.id}
                      className="aprop-popup-badge"
                      style={{ background: getLineColor(l) }}
                    >
                      {l.codi}
                    </span>
                  ))}
                </div>
                <DirectionsButton lat={p.lat} lng={p.lng} nom={p.nom} variant="block" />
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
      <InvalidateOnResize />
    </MapContainer>
  );
}

// When the user or radius change, refit the bounds inside the visible area
// (the strip above the bottom sheet). When only the sheet moves, keep zoom
// stable and just slide the centre so the 'Tu' dot stays in the visible
// vertical middle.
function MapFollowsUser({
  centre,
  radiM,
  bottomInset,
}: {
  centre: Coordinate;
  radiM: number;
  bottomInset: number;
}) {
  const map = useMap();
  const lastFitRef = useRef<{ lat: number; lng: number; radiM: number } | null>(null);
  useEffect(() => {
    const needsFit =
      !lastFitRef.current ||
      lastFitRef.current.lat !== centre.lat ||
      lastFitRef.current.lng !== centre.lng ||
      lastFitRef.current.radiM !== radiM;

    if (needsFit) {
      const bounds = L.latLng(centre.lat, centre.lng).toBounds(radiM * 2);
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 40 + bottomInset],
      });
      lastFitRef.current = { lat: centre.lat, lng: centre.lng, radiM };
    } else {
      const zoom = map.getZoom();
      const userPx = map.project([centre.lat, centre.lng], zoom);
      const newCenterPx = userPx.add([0, bottomInset / 2]);
      const newCenter = map.unproject(newCenterPx, zoom);
      map.setView(newCenter, zoom, { animate: false });
    }
  }, [centre.lat, centre.lng, radiM, bottomInset, map]);
  return null;
}

function RecenterButton({
  centre,
  radiM,
  bottomInset,
}: {
  centre: Coordinate;
  radiM: number;
  bottomInset: number;
}) {
  const map = useMap();
  const recenter = () => {
    const bounds = L.latLng(centre.lat, centre.lng).toBounds(radiM * 2);
    map.fitBounds(bounds, {
      paddingTopLeft: [40, 40],
      paddingBottomRight: [40, 40 + bottomInset],
    });
  };
  return (
    <div
      className="recenter-control"
      style={{ bottom: `${bottomInset + 16}px` }}
    >
      <button
        type="button"
        onClick={recenter}
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
