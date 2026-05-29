// Options to spread onto a react-leaflet MapContainer to enable the
// leaflet-rotate plugin. We only opt in on touch devices (phones,
// tablets) — on desktop the rotated map adds no value and the compass
// button covers the top-right corner where other controls live.
//
// react-leaflet's types don't include these fields, so callers spread
// the result with a cast.

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  );
}

export function rotateOptions(
  position: 'topright' | 'topleft' | 'bottomright' | 'bottomleft' = 'topleft',
) {
  const touch = isTouchDevice();
  if (!touch) {
    return { rotate: false, rotateControl: false } as const;
  }
  return {
    rotate: true,
    rotateControl: {
      closeOnZeroBearing: false,
      position,
    },
    touchRotate: true,
    bearing: 0,
  } as const;
}

