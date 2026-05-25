import L from 'leaflet';
import { useEffect, useState } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { StopPopup } from './StopPopup';
import type { Linia, Parada } from '../types/tmb';

interface Props {
  linia: Linia;
  parada: Parada;
  terminal?: boolean;
}

export function StopMarker({ linia, parada, terminal = false }: Props) {
  const [open, setOpen] = useState(false);
  const radius = terminal ? 9 : 6;
  return (
    <CircleMarker
      center={[parada.lat, parada.lng]}
      radius={radius}
      pathOptions={{
        color: '#ffffff',
        weight: terminal ? 3 : 2,
        fillColor: linia.color,
        fillOpacity: 1,
      }}
      eventHandlers={{
        popupopen: () => setOpen(true),
        popupclose: () => setOpen(false),
      }}
    >
      <Popup>
        <PopupAutoSize />
        <StopPopup linia={linia} parada={parada} enabled={open} />
      </Popup>
    </CircleMarker>
  );
}

// Forces Leaflet popup to resize after our content renders the first time.
function PopupAutoSize() {
  useEffect(() => {
    const t = window.setTimeout(() => {
      // Touch leaflet's popup wrapper by dispatching a resize.
      window.dispatchEvent(new Event('resize'));
    }, 0);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

// Re-export Leaflet for convenience (avoids tree-shaking surprises in tests).
export const _L = L;
