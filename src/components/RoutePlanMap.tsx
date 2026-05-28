import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { CooltraLayer } from './CooltraLayer';
import { rotateOptions } from '../utils/leafletRotate';
import { decodePolyline } from '../utils/polyline';
import type { CooltraVehicle } from '../types/cooltra';
import type { GeocodeResult } from '../types/geocode';
import type { Itinerary, Leg, LegMode } from '../types/planner';

const FALLBACK_CENTER: [number, number] = [41.387, 2.168];

interface Props {
  origin: GeocodeResult | null;
  destination: GeocodeResult | null;
  itinerary: Itinerary;
  cooltraVehiclesNearDest: CooltraVehicle[];
}

const FALLBACK_COLOR: Record<LegMode, string> = {
  WALK: '#888888',
  BUS: '#E84E0F',
  METRO: '#FF3300',
  SUBWAY: '#FF3300',
  TRAM: '#1d7df2',
  RAIL: '#444444',
};

function legColor(leg: Leg): string {
  if (leg.routeColor) {
    return leg.routeColor.startsWith('#') ? leg.routeColor : `#${leg.routeColor}`;
  }
  return FALLBACK_COLOR[leg.mode] ?? '#666666';
}

function destinationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'planner-dest-pin',
    html: '<span class="planner-dest-pin__bubble" aria-hidden="true"></span>',
    iconSize: [22, 28],
    iconAnchor: [11, 26],
    popupAnchor: [0, -22],
  });
}

function legGeometryPoints(leg: Leg): [number, number][] {
  if (leg.legGeometry) {
    const decoded = decodePolyline(leg.legGeometry);
    if (decoded.length > 0) return decoded;
  }
  // Fallback to straight line endpoint → endpoint if no encoded geometry
  return [
    [leg.from.lat, leg.from.lng],
    [leg.to.lat, leg.to.lng],
  ];
}

function formatTime(epochMs: number): string {
  if (!epochMs) return '';
  const d = new Date(epochMs);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function modeLabel(mode: LegMode): string {
  switch (mode) {
    case 'METRO':
    case 'SUBWAY':
      return 'Metro';
    case 'BUS':
      return 'Bus';
    case 'TRAM':
      return 'Tram';
    case 'RAIL':
      return 'Tren';
    default:
      return 'A peu';
  }
}

export function RoutePlanMap({
  origin,
  destination,
  itinerary,
  cooltraVehiclesNearDest,
}: Props) {
  const center: [number, number] = origin
    ? [origin.lat, origin.lng]
    : destination
      ? [destination.lat, destination.lng]
      : FALLBACK_CENTER;

  const allPoints = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    for (const leg of itinerary.legs) {
      const segment = legGeometryPoints(leg);
      pts.push(...segment);
    }
    return pts;
  }, [itinerary]);

  const transitLegs = itinerary.legs.filter((l) => l.mode !== 'WALK');

  return (
    <MapContainer
      center={center}
      zoom={14}
      className="map-container"
      scrollWheelZoom
      {...(rotateOptions('bottomleft') as Record<string, unknown>)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />

      {/* Cooltra last-mile around destination */}
      {cooltraVehiclesNearDest.length > 0 && (
        <CooltraLayer vehicles={cooltraVehiclesNearDest} />
      )}

      {/* Leg polylines */}
      {itinerary.legs.map((leg, idx) => {
        const points = legGeometryPoints(leg);
        const isWalk = leg.mode === 'WALK';
        return (
          <Polyline
            key={`leg-${idx}`}
            positions={points}
            pathOptions={{
              color: legColor(leg),
              weight: isWalk ? 4 : 6,
              opacity: isWalk ? 0.7 : 0.95,
              dashArray: isWalk ? '4 8' : undefined,
              lineCap: 'round',
            }}
          />
        );
      })}

      {/* Origin */}
      {origin && (
        <CircleMarker
          center={[origin.lat, origin.lng]}
          radius={8}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1d7df2', fillOpacity: 1 }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="user-tooltip">
            Sortida
          </Tooltip>
        </CircleMarker>
      )}

      {/* Boarding / alighting / transfer markers between transit legs */}
      {transitLegs.map((leg, i) => {
        const prevLeg = i > 0 ? transitLegs[i - 1] : null;
        const isTransfer = !!prevLeg;
        return (
          <CircleMarker
            key={`board-${i}`}
            center={[leg.from.lat, leg.from.lng]}
            radius={isTransfer ? 9 : 8}
            pathOptions={{
              color: '#ffffff',
              weight: 2.5,
              fillColor: legColor(leg),
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="leg-popup">
                <div className="leg-popup__head">
                  {isTransfer ? 'Transbord' : `Puja al ${modeLabel(leg.mode)}`}
                </div>
                {leg.routeShortName && (
                  <div className="leg-popup__route">
                    <span
                      className="leg-popup__badge"
                      style={{ background: legColor(leg) }}
                    >
                      {leg.routeShortName}
                    </span>
                    {leg.headsign && <span> cap a {leg.headsign}</span>}
                  </div>
                )}
                <div className="leg-popup__time">
                  Sortida {formatTime(leg.startTime)}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Alighting at last transit leg */}
      {transitLegs.length > 0 && (() => {
        const last = transitLegs[transitLegs.length - 1];
        return (
          <CircleMarker
            key="alight"
            center={[last.to.lat, last.to.lng]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              weight: 2.5,
              fillColor: legColor(last),
              fillOpacity: 1,
            }}
          >
            <Popup>
              <div className="leg-popup">
                <div className="leg-popup__head">Baixa</div>
                <div className="leg-popup__where">{last.to.name}</div>
                <div className="leg-popup__time">{formatTime(last.endTime)}</div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })()}

      {/* Destination pin */}
      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon()}>
          <Popup>
            <div className="leg-popup">
              <div className="leg-popup__head">Arribada</div>
              <div className="leg-popup__where">{destination.name}</div>
              <div className="leg-popup__time">{formatTime(itinerary.endTime)}</div>
            </div>
          </Popup>
        </Marker>
      )}

      <SummaryChip itinerary={itinerary} />
      <RecenterButton points={allPoints} />
      <FitToRoute points={allPoints} />
      <InvalidateOnResize />
    </MapContainer>
  );
}

function SummaryChip({ itinerary }: { itinerary: Itinerary }) {
  const [open, setOpen] = useState(false);
  const minutes = Math.round(itinerary.duration / 60);
  const walkM = Math.round(itinerary.walkDistance);
  const arrival = formatTime(itinerary.endTime);
  return (
    <button
      type="button"
      className={`planner-summary-chip${open ? ' open' : ''}`}
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-label={open ? 'Amaga els detalls de la ruta' : 'Mostra els detalls de la ruta'}
    >
      <span className="planner-summary-duration">{minutes}′</span>
      {open && (
        <span className="planner-summary-meta">
          <span className="planner-summary-arrival">Arribada {arrival}</span>
          <span className="planner-summary-line">
            <span>{itinerary.transfers} transbord{itinerary.transfers === 1 ? '' : 's'}</span>
            <span> · {walkM}m a peu</span>
          </span>
        </span>
      )}
      <svg
        className="planner-summary-chev"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {open ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
      </svg>
    </button>
  );
}

function RecenterButton({ points }: { points: [number, number][] }) {
  const map = useMap();
  if (points.length < 2) return null;
  const recenter = () => {
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40] });
  };
  return (
    <div className="planner-recenter-btn">
      <button
        type="button"
        onClick={recenter}
        aria-label="Centrar al trajecte"
        title="Centrar al trajecte"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

function FitToRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
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
