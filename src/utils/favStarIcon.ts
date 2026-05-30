import L from 'leaflet';

const STAR_PATH =
  'M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.96 6.1 20.5l1.1-6.47-4.7-4.58 6.5-.95z';

// Gold star overlay that sits just above a stop dot of the given radius.
// Shared by the line map (StopMarker) and Aprop meu so favourite stops read
// the same everywhere.
export function favStarIcon(radius: number): L.DivIcon {
  return L.divIcon({
    className: 'stop-fav-icon',
    html: `<svg viewBox="0 0 24 24" width="18" height="18"><path d="${STAR_PATH}" fill="#f7a700" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
    iconSize: [18, 18],
    iconAnchor: [9, radius + 18],
  });
}
