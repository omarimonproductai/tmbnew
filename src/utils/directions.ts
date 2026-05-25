// Map deep-link helpers. We can't tell from a web page which map apps are
// installed, so on iOS we surface both Apple Maps and Google Maps and let
// the user pick; on every other platform we head straight to Google Maps.

export function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
}

export function openInAppleMaps(lat: number, lng: number, nom?: string): void {
  const label = nom ? `&q=${encodeURIComponent(nom)}` : '';
  window.open(
    `https://maps.apple.com/?daddr=${lat},${lng}${label}`,
    '_blank',
    'noopener,noreferrer',
  );
}

export function openInGoogleMaps(lat: number, lng: number, _nom?: string): void {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    '_blank',
    'noopener,noreferrer',
  );
}
