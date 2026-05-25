// Cross-platform deep-link for routing. iOS hands `maps.apple.com` to
// the native Maps app; everyone else gets the Google Maps universal URL
// which opens the installed app on Android or the web on desktop.
export function openDirections(opts: {
  lat: number;
  lng: number;
  nom?: string;
}): void {
  const { lat, lng, nom } = opts;
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAppleDevice = /iPad|iPhone|iPod|Macintosh/.test(ua);
  const label = nom ? `&q=${encodeURIComponent(nom)}` : '';
  const url = isAppleDevice
    ? `https://maps.apple.com/?daddr=${lat},${lng}${label}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
