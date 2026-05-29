import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CooltraVehiclePopup } from './CooltraVehiclePopup';
import { inferKind, type CooltraKind, type CooltraVehicle } from '../types/cooltra';

// Cooltra dots use the same double-colour scheme as the filter buttons:
// outer ring is the accent colour, fill is the brand colour. No tail.
const OUTER: Record<CooltraKind, string> = {
  bike: '#04fc04',
  scooter: '#1e5fa8',
};
const INNER: Record<CooltraKind, string> = {
  bike: '#00c853',
  scooter: '#3080e0',
};

interface Props {
  vehicles: CooltraVehicle[];
}

export function CooltraLayer({ vehicles }: Props) {
  const map = useMap();
  const groupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    const group = L.featureGroup();
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
    vehicles
      .filter(
        (v) =>
          Array.isArray(v?.position) &&
          Number.isFinite(v.position[0]) &&
          Number.isFinite(v.position[1]),
      )
      .forEach((v) => {
        const kind = inferKind(v.model_id);
        const [lng, lat] = v.position;
        const dot = L.circleMarker([lat, lng], {
          radius: 5,
          color: OUTER[kind],
          weight: 2,
          fillColor: INNER[kind],
          fillOpacity: 1,
        });
        dot.bindPopup(
          renderToStaticMarkup(<CooltraVehiclePopup vehicle={v} kind={kind} />),
          { autoPanPaddingTopLeft: [10, 90] },
        );
        group.addLayer(dot);
        // Same overlayPane as TMB CircleMarkers — push to the back so TMB
        // dots paint on top.
        dot.bringToBack();
      });
  }, [vehicles]);

  return null;
}
