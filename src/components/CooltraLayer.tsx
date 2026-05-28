import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CooltraVehiclePopup } from './CooltraVehiclePopup';
import { inferKind, type CooltraVehicle } from '../types/cooltra';

const BIKE_SVG = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="5.5" cy="17.5" r="3.5"/>
  <circle cx="18.5" cy="17.5" r="3.5"/>
  <path d="M5.5 17.5 10 9h5l3.5 8.5"/>
  <path d="M10 9l-2-3h2"/>
  <path d="M15 9V6h-1"/>
</svg>`;

const SCOOTER_SVG = `
<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="5.5" cy="17.5" r="3"/>
  <circle cx="18.5" cy="17.5" r="3"/>
  <path d="M5.5 17.5h6l2-5h4"/>
  <path d="M17.5 12.5l1-5h-3"/>
  <path d="M11.5 12.5l2-4"/>
</svg>`;

function vehicleIcon(kind: 'scooter' | 'bike'): L.DivIcon {
  const svg = kind === 'bike' ? BIKE_SVG : SCOOTER_SVG;
  return L.divIcon({
    className: `cooltra-marker cooltra-marker--${kind}`,
    html: `<span class="cooltra-marker__bubble">${svg}</span><span class="cooltra-marker__tail" aria-hidden="true"></span>`,
    iconSize: [30, 38],
    iconAnchor: [15, 36],
    popupAnchor: [0, -34],
  });
}

function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  let size: 'sm' | 'md' | 'lg' = 'sm';
  if (count >= 100) size = 'lg';
  else if (count >= 20) size = 'md';
  return L.divIcon({
    className: `cooltra-cluster cooltra-cluster--${size}`,
    html: `<span class="cooltra-cluster__bubble">${count}</span>`,
    iconSize: size === 'lg' ? [44, 44] : size === 'md' ? [38, 38] : [32, 32],
  });
}

interface Props {
  vehicles: CooltraVehicle[];
}

export function CooltraLayer({ vehicles }: Props) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 60,
      iconCreateFunction: clusterIcon,
    });
    groupRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();
    const markers = vehicles
      .filter(
        (v) =>
          v?.position &&
          Number.isFinite(v.position.lat) &&
          Number.isFinite(v.position.lon),
      )
      .map((v) => {
        const kind = inferKind(v.model_id);
        const m = L.marker([v.position.lat, v.position.lon], {
          icon: vehicleIcon(kind),
        });
        m.bindPopup(
          renderToStaticMarkup(<CooltraVehiclePopup vehicle={v} kind={kind} />),
          { autoPanPaddingTopLeft: [10, 90] },
        );
        return m;
      });
    group.addLayers(markers);
  }, [vehicles]);

  return null;
}
