import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { CooltraVehiclePopup } from './CooltraVehiclePopup';
import { inferKind, type CooltraKind, type CooltraVehicle } from '../types/cooltra';

function vehicleIcon(kind: CooltraKind): L.DivIcon {
  return L.divIcon({
    className: `cooltra-pin cooltra-pin--${kind}`,
    html: `
      <span class="cooltra-pin__bubble" aria-hidden="true"></span>
      <span class="cooltra-pin__tail" aria-hidden="true"></span>
    `,
    iconSize: [26, 32],
    iconAnchor: [13, 30],
    popupAnchor: [0, -26],
  });
}

interface Props {
  vehicles: CooltraVehicle[];
}

// Cooltra DivIcon markers live in the default markerPane; we explicitly push
// each one to the back of that pane so TMB markers paint on top. (Custom
// panes worked at first but broke after recent refactors — keep it simple.)
export function CooltraLayer({ vehicles }: Props) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];
    };
  }, [map]);

  useEffect(() => {
    // Replace the markers when the vehicle list changes
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

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
        const m = L.marker([lat, lng], { icon: vehicleIcon(kind) });
        m.bindPopup(
          renderToStaticMarkup(<CooltraVehiclePopup vehicle={v} kind={kind} />),
          { autoPanPaddingTopLeft: [10, 90] },
        );
        m.addTo(map);
        // DivIcon markers go to markerPane (z 600), above TMB CircleMarker
        // (overlayPane z 400). Push z-index of each Cooltra marker so it
        // paints below the other map markers without leaving its pane.
        m.setZIndexOffset(-1000);
        markersRef.current.push(m);
      });
  }, [vehicles, map]);

  return null;
}
