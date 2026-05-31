import { describe, expect, it } from 'vitest';
import {
  getFgcLinies,
  getFgcLiniaDetall,
  getFgcParadesAll,
  isInBarcelona,
  liniesForStop,
} from './fgc';

describe('fgc static derivations', () => {
  it('lists lines with a stop count', () => {
    const linies = getFgcLinies();
    expect(linies.length).toBeGreaterThan(0);
    const l6 = linies.find((l) => l.codi === 'L6');
    expect(l6?.numParades).toBe(9);
  });

  it('returns an ordered, geo-aligned line detail', () => {
    const detall = getFgcLiniaDetall('L6');
    expect(detall).not.toBeNull();
    expect(detall!.parades).toHaveLength(9);
    expect(detall!.parades[0].codi).toBe('PC');
    expect(detall!.parades.map((p) => p.ordre)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    // geometry is [lng, lat] per stop, same length as the stop list
    expect(detall!.geometry).toHaveLength(9);
    expect(detall!.geometry[0]).toEqual([
      detall!.parades[0].lng,
      detall!.parades[0].lat,
    ]);
  });

  it('returns null for an unknown line', () => {
    expect(getFgcLiniaDetall('ZZ')).toBeNull();
  });

  it('exposes which lines stop at a shared trunk station', () => {
    const linies = liniesForStop('PC');
    expect(linies).toContain('L6');
    expect(linies).toContain('L7');
    expect(linies).toContain('S1');
  });

  it('lists every stop once with its lines', () => {
    const all = getFgcParadesAll();
    const pc = all.find((p) => p.codi === 'PC');
    expect(pc?.nom).toMatch(/Plaça Catalunya/);
    expect(pc?.liniesQueParen.length).toBeGreaterThan(1);
  });

  it('detects Barcelona-city coordinates', () => {
    expect(isInBarcelona(41.3873, 2.1699)).toBe(true); // Pl. Catalunya
    expect(isInBarcelona(41.7223, 1.8307)).toBe(false); // Manresa
  });
});
