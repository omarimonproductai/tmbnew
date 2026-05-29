import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CooltraVehiclePopup } from './CooltraVehiclePopup';
import { inferKind, type CooltraKind, type CooltraVehicle } from '../types/cooltra';

// Pin under TMB markers; create a pane below overlayPane (400) so TMB
// CircleMarkers / DivIcons paint on top without per-marker tweaks.
const COOLTRA_PANE = 'cooltraPane';
const COOLTRA_PANE_Z = 350;

function vehicleIcon(kind: CooltraKind): L.DivIcon {
  return L.divIcon({
    className: `cooltra-pin cooltra-pin--${kind}`,
    html: `
      <span class="cooltra-pin__bubble" aria-hidden="true"></span>
      <span class="cooltra-pin__tail" aria-hidden="true"></span>
    `,
    iconSize: [26, 34],
    iconAnchor: [13, 32],
    popupAnchor: [0, -28],
  });
}

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
        const m = L.marker([lat, lng], {
          icon: vehicleIcon(kind),
          pane: COOLTRA_PANE,
        });
        m.bindPopup(
          renderToStaticMarkup(<CooltraVehiclePopup vehicle={v} kind={kind} />),
          { autoPanPaddingTopLeft: [10, 90] },
        );
        group.addLayer(m);
      });
  }, [vehicles]);

  return null;
}
