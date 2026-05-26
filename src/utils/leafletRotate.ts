// Options to spread onto a react-leaflet MapContainer to enable the
// leaflet-rotate plugin: a compass button on every viewport, plus a
// two-finger rotate gesture on touch devices.
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

export function rotateOptions() {
  return {
    rotate: true,
    rotateControl: {
      closeOnZeroBearing: false,
      position: 'topright',
    },
    touchRotate: isTouchDevice(),
    bearing: 0,
  } as const;
}
