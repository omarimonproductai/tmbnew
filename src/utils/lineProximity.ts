import type { Coordinate, Linia } from '../types/tmb';
import { haversine } from './distance';

// Iterates the line's polyline vertices and returns the minimum
// haversine distance to the given point. We use vertices rather than
// projected segment distances — for sort ordering the approximation is
// indistinguishable and it keeps the per-line cost cheap.
export function lineMinDistance(linia: Linia, point: Coordinate): number {
  const geom = linia.geometry;
  if (!geom) return Number.POSITIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  const segments =
    geom.type === 'LineString' ? [geom.coordinates] : geom.coordinates;
  for (const seg of segments) {
    for (const [lng, lat] of seg) {
      const d = haversine(point, { lat, lng });
      if (d < min) min = d;
    }
  }
  return min;
}
