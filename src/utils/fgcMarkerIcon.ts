import L from 'leaflet';

// A train glyph in a white rounded square — visually distinct from TMB's round
// dots, Bicing's coloured squares with numbers, and Cooltra's mini dots. The
// glyph takes the line colour (currentColor) so FGC stops read per-line on the
// line map and use the FGC accent on the merged "Aprop meu" list.
const TRAIN_SVG =
  '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12 2c-3.6 0-7 .4-7 4v8.5A2.5 2.5 0 0 0 7.5 17L6 18.5V19h12v-.5L16.5 17A2.5 2.5 0 0 0 19 14.5V6c0-3.6-3.4-4-7-4zM8 16a1.3 1.3 0 1 1 1.3-1.3A1.3 1.3 0 0 1 8 16zm3-6H7V6.5h4zm2 0V6.5h4V10zm3 6a1.3 1.3 0 1 1 1.3-1.3A1.3 1.3 0 0 1 16 16z"/></svg>';

export function fgcStopIcon(color = '#1f7a3d', fav = false): L.DivIcon {
  return L.divIcon({
    className: `fgc-stop-icon${fav ? ' is-fav' : ''}`,
    html: `<span class="fgc-stop" style="color:${color}">${TRAIN_SVG}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}
