// leaflet-rotate (and many other legacy Leaflet plugins) read the
// Leaflet object off `window.L`. When Leaflet is bundled as an ES
// module, Vite never assigns it to the global, so the plugin patches
// nothing and the whole app trips on `L.extend is not a function`
// during the very first MapContainer mount — leaving a blank screen.
// Import this module BEFORE 'leaflet-rotate' to bridge the gap.
import L from 'leaflet';

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).L = L;
}
