import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import {
  Circle,
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
import type { Coordinate, ParadaAprop } from '../types/tmb';

const FALLBACK_CENTER: [number, number] = [41.3874, 2.1686];

interface Props {
  centre: Coordinate | null;
  radiM: number;
  parades: ParadaAprop[];
  topN: number;
  winkTarget?: { id: string; nonce: number } | null;
  bottomInset?: number;
  onRefresh?: () => void;
}

export function AproperMeuMap({
  centre,
  radiM,
  parades,
  topN,
  winkTarget = null,
  bottomInset = 0,
  onRefresh,
}: Props) {
  return (
    <MapContainer
      center={centre ? [centre.lat, centre.lng] : FALLBACK_CENTER}
      zoom={15}
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
      <ZoomAroundUser centre={centre} bottomInset={bottomInset} />
      {onRefresh && (
        <LocationRefreshButton
          bottomInset={bottomInset}
          onRefresh={onRefresh}
          centre={centre}
          radiM={radiM}
        />
      )}
      {parades.map((p, idx) => {
        const rank = idx + 1;
        return (
          <AproperMeuStopMarker
            key={p.id}
            parada={p}
            rank={rank}
            topN={topN}
            winkNonce={winkTarget?.id === p.id ? winkTarget.nonce : null}
          />
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

function LocationRefreshButton({
  bottomInset,
  onRefresh,
  centre,
  radiM,
}: {
  bottomInset: number;
  onRefresh: () => void;
  centre: Coordinate | null;
  radiM: number;
}) {
  const map = useMap();
  const handle = () => {
    onRefresh();
    if (centre) {
      const bounds = L.latLng(centre.lat, centre.lng).toBounds(radiM * 2);
      map.fitBounds(bounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [40, 40 + bottomInset],
      });
    }
  };
  return (
    <div
      className="aprop-refresh-control"
      style={{ bottom: `${bottomInset + 72}px` }}
    >
      <button
        type="button"
        onClick={handle}
        aria-label="Actualitzar la meva ubicació i centrar el mapa"
        title="Actualitzar ubicació i centrar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
      </button>
    </div>
  );
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

function AproperMeuStopMarker({
  parada,
  rank,
  topN,
  winkNonce,
}: {
  parada: ParadaAprop;
  rank: number;
  topN: number;
  winkNonce: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [winking, setWinking] = useState(false);
  const isTop = rank <= topN;
  const rep = pickRepresentativeLine(parada.liniesQueParen);
  const color = rep ? getLineColor(rep) : '#666';

  // Briefly enlarge the marker when its list row is tapped ("wink").
  useEffect(() => {
    if (winkNonce == null) return;
    setWinking(true);
    const t = window.setTimeout(() => setWinking(false), 500);
    return () => window.clearTimeout(t);
  }, [winkNonce]);

  const baseRadius = isTop ? 10 : 5;
  return (
    <CircleMarker
      center={[parada.lat, parada.lng]}
      radius={winking ? baseRadius + 8 : baseRadius}
      pathOptions={{
        color: '#ffffff',
        weight: winking ? 4 : isTop ? 3 : 1.5,
        fillColor: color,
        fillOpacity: 1,
      }}
      eventHandlers={{
        popupopen: () => setOpen(true),
        popupclose: () => setOpen(false),
      }}
    >
      <Tooltip direction="top" offset={[0, -4]} className="stop-tooltip">
        {isTop && <span className="rank-mini">{rank}</span>}
        <span className="tooltip-name">{parada.nom}</span>
      </Tooltip>
      <Popup>
        <AproperMeuStopPopup parada={parada} enabled={open} />
      </Popup>
    </CircleMarker>
  );
}

// Intercepts clicks on Leaflet's built-in +/- zoom buttons so that the
// new map center keeps the user's location at the vertical middle of
// the visible viewport (the strip above the bottom sheet) instead of at
// the geometric centre of the map container, which usually sits behind
// the sheet on mobile.
function ZoomAroundUser({
  centre,
  bottomInset,
}: {
  centre: Coordinate | null;
  bottomInset: number;
}) {
  const map = useMap();
  const centreRef = useRef<Coordinate | null>(null);
  const insetRef = useRef(0);
  centreRef.current = centre;
  insetRef.current = bottomInset;

  useEffect(() => {
    const container = map.getContainer();
    const zoomInBtn = container.querySelector<HTMLElement>('.leaflet-control-zoom-in');
    const zoomOutBtn = container.querySelector<HTMLElement>('.leaflet-control-zoom-out');

    const handler = (delta: number) => (e: Event) => {
      const c = centreRef.current;
      if (!c) return; // Without a fix yet, let Leaflet's default kick in.
      e.preventDefault();
      e.stopPropagation();
      const targetZoom = map.getZoom() + delta;
      const inset = insetRef.current;
      const userPx = map.project([c.lat, c.lng], targetZoom);
      const newCenterPx = userPx.add([0, inset / 2]);
      const newCenter = map.unproject(newCenterPx, targetZoom);
      map.setView(newCenter, targetZoom);
    };

    const onIn = handler(1);
    const onOut = handler(-1);

    zoomInBtn?.addEventListener('click', onIn, { capture: true });
    zoomOutBtn?.addEventListener('click', onOut, { capture: true });
    return () => {
      zoomInBtn?.removeEventListener('click', onIn, { capture: true });
      zoomOutBtn?.removeEventListener('click', onOut, { capture: true });
    };
  }, [map]);

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
