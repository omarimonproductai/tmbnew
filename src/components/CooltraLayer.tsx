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
const BORDER = '#04fc04';

// Cooltra dots live below TMB stops. Putting them in a dedicated pane with
// a z-index between tilePane (200) and overlayPane (400) keeps them behind
// every TMB CircleMarker / DivIcon without per-marker bringToBack() calls.
const COOLTRA_PANE = 'cooltraPane';
const COOLTRA_PANE_Z = 350;

interface Props {
  vehicles: CooltraVehicle[];
}

export function CooltraLayer({ vehicles }: Props) {
  const map = useMap();
  const groupRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map.getPane(COOLTRA_PANE)) {
      const pane = map.createPane(COOLTRA_PANE);
      pane.style.zIndex = String(COOLTRA_PANE_Z);
    }
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
          pane: COOLTRA_PANE,
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
