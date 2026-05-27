import L from 'leaflet';
import { useState } from 'react';
import { CircleMarker, Marker, Popup, Tooltip } from 'react-leaflet';
import { StopPopup } from './StopPopup';
import { useFavorits } from '../hooks/useFavorits';
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

const STAR_PATH =
  'M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.96 6.1 20.5l1.1-6.47-4.7-4.58 6.5-.95z';

function favStarIcon(radius: number): L.DivIcon {
  return L.divIcon({
    className: 'stop-fav-icon',
    html: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="${STAR_PATH}" fill="#f7a700" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    iconSize: [18, 18],
    // Sit just above the stop dot.
    iconAnchor: [9, radius + 18],
  });
}

export function StopMarker({ linia, parada, terminal = false, correspondences }: Props) {
  const [open, setOpen] = useState(false);
  const { isParadaFav } = useFavorits();
  const radius = terminal ? 9 : 6;
  const corrs = correspondences && correspondences.length > 0 ? correspondences : null;
  // Anchor the badges so they sit above-right of the stop dot.
  const icon = corrs ? correspondenceIcon(corrs, -(radius + 3), radius + 6) : null;
  // Same id scheme as parades-all / StopPopup so it matches favourites.
  const favId =
    linia.tipus === 'metro' ? `metro-${parada.id}` : `bus-${parada.codi}`;
  const fav = isParadaFav(favId);
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
          <StopPopup
            linia={linia}
            parada={parada}
            enabled={open}
            correspondences={correspondences}
          />
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
      {fav && (
        <Marker
          position={[parada.lat, parada.lng]}
          icon={favStarIcon(radius)}
          interactive={false}
          keyboard={false}
        />
      )}
    </>
  );
}
