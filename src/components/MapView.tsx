import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { CooltraLayer } from './CooltraLayer';
import { StopMarker } from './StopMarker';
import { VehicleMarker } from './VehicleMarker';
import { rotateOptions } from '../utils/leafletRotate';
import type { CooltraVehicle } from '../types/cooltra';
import type { Coordinate, Linia, LiniaResum, Parada, VehiclePos } from '../types/tmb';

const BARCELONA_CENTER: [number, number] = [41.3874, 2.1686];
const DEFAULT_ZOOM = 13;

interface Props {
  linia: Linia | null;
  parades: Parada[];
  vehicles?: VehiclePos[];
  correspondencesPerParada?: Map<string, LiniaResum[]>;
  userPosition?: Coordinate | null;
  focusPoint?: Coordinate | null;
  cooltraVehicles?: CooltraVehicle[];
}

export function MapView({
  linia,
  parades,
  vehicles,
  correspondencesPerParada,
  userPosition,
  focusPoint,
  cooltraVehicles = [],
}: Props) {
  const polylinePoints = useMemo<[number, number][][]>(() => {
    if (linia?.geometry) {
      if (linia.geometry.type === 'LineString') {
        return [linia.geometry.coordinates.map(([lng, lat]) => [lat, lng])];
      }
      return linia.geometry.coordinates.map((seg) =>
        seg.map(([lng, lat]) => [lat, lng] as [number, number]),
      );
    }
    if (parades.length > 1) {
      return [parades.map((p) => [p.lat, p.lng])];
    }
    return [];
  }, [linia, parades]);

  return (
    <MapContainer
      center={BARCELONA_CENTER}
      zoom={DEFAULT_ZOOM}
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
      {linia && polylinePoints.map((segment, idx) => (
        <Polyline
          key={`${linia.id}-${idx}`}
          positions={segment}
          pathOptions={{ color: linia.color, weight: 5, opacity: 0.9 }}
        />
      ))}
      {linia &&
        parades.map((p, idx) => (
          <StopMarker
            key={p.id}
            linia={linia}
            parada={p}
            terminal={idx === 0 || idx === parades.length - 1}
            correspondences={correspondencesPerParada?.get(p.codi)}
          />
        ))}
      {linia && vehicles &&
        vehicles.map((v) => (
          <VehicleMarker
            key={v.id}
            vehicle={v}
            liniaCodi={linia.codi}
            color={linia.color}
            tipus={linia.tipus}
          />
        ))}
      {cooltraVehicles.length > 0 && <CooltraLayer vehicles={cooltraVehicles} />}
      {userPosition && <UserDot position={userPosition} hasLine={!!linia} />}
      <AutoFit linia={linia} parades={parades} disabled={!!focusPoint} />
      {focusPoint && <FocusOnPoint point={focusPoint} />}
      <RecenterControl userPosition={userPosition ?? null} linia={linia} parades={parades} />
      <InvalidateOnResize />
    </MapContainer>
  );
}

// Bottom-right recenter: centres on the user when located, otherwise refits
// the selected line.
function RecenterControl({
  userPosition,
  linia,
  parades,
}: {
  userPosition: Coordinate | null;
  linia: Linia | null;
  parades: Parada[];
}) {
  const map = useMap();
  const recenter = () => {
    if (userPosition) {
      map.setView([userPosition.lat, userPosition.lng], 15);
      return;
    }
    const bounds = L.latLngBounds([]);
    if (linia?.geometry) {
      const coords =
        linia.geometry.type === 'LineString'
          ? linia.geometry.coordinates
          : linia.geometry.coordinates.flat();
      coords.forEach(([lng, lat]) => bounds.extend([lat, lng]));
    }
    parades.forEach((p) => bounds.extend([p.lat, p.lng]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
  };
  return (
    <div className="recenter-control" style={{ bottom: '16px' }}>
      <button type="button" onClick={recenter} aria-label="Centrar el mapa">
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

// Zooms tight onto a given point (a favourite stop opened from the
// favourites view) instead of fitting the whole line, so the user can
// see the vehicles around that stop right away.
function FocusOnPoint({ point }: { point: Coordinate }) {
  const map = useMap();
  useEffect(() => {
    map.setView([point.lat, point.lng], 16, { animate: false });
  }, [point.lat, point.lng, map]);
  return null;
}

// Shows the user's location as a blue dot. When no line is selected yet,
// pans the map to centre on the user the first time we get a position
// so the visitor lands looking at their neighbourhood rather than at
// the Barcelona-wide fallback.
function UserDot({ position, hasLine }: { position: Coordinate; hasLine: boolean }) {
  const map = useMap();
  const centeredRef = useRef(false);
  useEffect(() => {
    if (centeredRef.current || hasLine) return;
    map.setView([position.lat, position.lng], 15, { animate: false });
    centeredRef.current = true;
  }, [position.lat, position.lng, hasLine, map]);
  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={7}
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
  );
}

function AutoFit({
  linia,
  parades,
  disabled,
}: {
  linia: Linia | null;
  parades: Parada[];
  disabled?: boolean;
}) {
  const map = useMap();
  // Only fit once per line so the user's pan/zoom isn't wiped out by data
  // updates (e.g. a vehicle refresh changing parades references).
  const lastFitId = useRef<string | null>(null);
  useEffect(() => {
    if (disabled || !linia) return;
    if (lastFitId.current === linia.id) return;
    const bounds = L.latLngBounds([]);
    if (linia.geometry) {
      const coords =
        linia.geometry.type === 'LineString'
          ? linia.geometry.coordinates
          : linia.geometry.coordinates.flat();
      coords.forEach(([lng, lat]) => bounds.extend([lat, lng]));
    }
    parades.forEach((p) => bounds.extend([p.lat, p.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
      lastFitId.current = linia.id;
    }
  }, [linia, parades, map, disabled]);
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
