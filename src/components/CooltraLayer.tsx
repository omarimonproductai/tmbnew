import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CooltraVehiclePopup } from './CooltraVehiclePopup';
import { inferKind, type CooltraKind, type CooltraVehicle } from '../types/cooltra';

const COLORS: Record<CooltraKind, string> = {
  bike: '#ffffff',
  scooter: '#3080e0',
};
const BORDER = '#04fc04';

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
          radius: 6,
          color: BORDER,
          weight: 2,
          fillColor: COLORS[kind],
          fillOpacity: 1,
        });
        dot.bindPopup(
          renderToStaticMarkup(<CooltraVehiclePopup vehicle={v} kind={kind} />),
          { autoPanPaddingTopLeft: [10, 90] },
        );
        group.addLayer(dot);
        // Push every Cooltra dot to the back of the shared overlayPane SVG
        // so TMB stop markers (also CircleMarker / DivIcon) paint on top.
        dot.bringToBack();
      });
  }, [vehicles]);

  return null;
}
