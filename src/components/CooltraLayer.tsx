import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CooltraVehiclePopup } from './CooltraVehiclePopup';
import { inferKind, type CooltraVehicle } from '../types/cooltra';

function vehicleIcon(kind: 'scooter' | 'bike'): L.DivIcon {
  const emoji = kind === 'bike' ? '🚲' : '🛵';
  return L.divIcon({
    className: 'cooltra-marker',
    html: `<span class="cooltra-marker__bubble" aria-hidden="true">${emoji}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
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
    const markers = vehicles.map((v) => {
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
