import L from 'leaflet';
import { useState } from 'react';
import { CircleMarker, Marker, Popup, Tooltip } from 'react-leaflet';
import { StopPopup } from './StopPopup';
import type { Linia, LiniaResum, Parada } from '../types/tmb';

interface Props {
  linia: Linia;
  parada: Parada;
  terminal?: boolean;
  correspondences?: LiniaResum[];
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}

function correspondenceIcon(corrs: LiniaResum[], offsetX: number, offsetY: number): L.DivIcon {
  const badges = corrs
    .map(
      (l) =>
        `<span class="corr-badge" style="background:${escapeHtml(l.color)}">${escapeHtml(l.codi)}</span>`,
    )
    .join('');
  return L.divIcon({
    className: 'stop-corr-icon',
    html: `<div class="corr-badges">${badges}</div>`,
    iconSize: [0, 0],
    iconAnchor: [offsetX, offsetY],
  });
}

export function StopMarker({ linia, parada, terminal = false, correspondences }: Props) {
  const [open, setOpen] = useState(false);
  const radius = terminal ? 9 : 6;
  const corrs = correspondences && correspondences.length > 0 ? correspondences : null;
  // Anchor the badges so they sit above-right of the stop dot.
  const icon = corrs ? correspondenceIcon(corrs, -(radius + 3), radius + 6) : null;
  return (
    <>
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
        <Tooltip direction="top" offset={[0, -4]} opacity={1} className="stop-tooltip">
          <span className="tooltip-badge" style={{ background: linia.color }}>
            {linia.codi}
          </span>
          <span className="tooltip-name">{parada.nom}</span>
        </Tooltip>
        <Popup>
          <StopPopup linia={linia} parada={parada} enabled={open} />
        </Popup>
      </CircleMarker>
      {icon && (
        <Marker
          position={[parada.lat, parada.lng]}
          icon={icon}
          interactive={false}
          keyboard={false}
        />
      )}
    </>
  );
}
