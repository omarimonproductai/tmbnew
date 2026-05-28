import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CooltraVehiclePopup } from './CooltraVehiclePopup';
import { inferKind, type CooltraKind, type CooltraVehicle } from '../types/cooltra';

const COLORS: Record<CooltraKind, string> = {
  bike: '#00a651',
  scooter: '#1098f0',
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
          radius: 7,
          color: '#fff',
          weight: 2,
          fillColor: COLORS[kind],
          fillOpacity: 1,
        });
        dot.bindPopup(
          renderToStaticMarkup(<CooltraVehiclePopup vehicle={v} kind={kind} />),
          { autoPanPaddingTopLeft: [10, 90] },
        );
        group.addLayer(dot);
      });
  }, [vehicles]);

  return null;
}
