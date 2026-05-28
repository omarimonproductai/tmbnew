import { describe, expect, it } from 'vitest';
import { decodePolyline } from './polyline';

describe('decodePolyline', () => {
  it('decodes the canonical Google example', () => {
    // "_p~iF~ps|U_ulLnnqC_mqNvxq`@" -> 3 points (per the Google docs)
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points.length).toBe(3);
    expect(points[0][0]).toBeCloseTo(38.5, 1);
    expect(points[0][1]).toBeCloseTo(-120.2, 1);
    expect(points[2][0]).toBeCloseTo(43.252, 2);
    expect(points[2][1]).toBeCloseTo(-126.453, 2);
  });

  it('returns [] for empty input', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});
