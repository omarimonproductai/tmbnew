import { beforeEach, describe, expect, it } from 'vitest';
import { getFgcSnapshot, isFgcFav, toggleFgc } from './favorits';
import type { FavFgc } from '../types/fgc';

const station: FavFgc = {
  id: 'fgc-PC',
  codi: 'PC',
  nom: 'Barcelona — Plaça Catalunya',
  lat: 41.3873,
  lng: 2.1699,
  liniesQueParen: ['L6', 'L7', 'S1'],
};

describe('favorits FGC bucket', () => {
  beforeEach(() => {
    // Clean slate per test (toggle off if present).
    if (isFgcFav(station.id)) toggleFgc(station);
  });

  it('adds and removes an FGC stop', () => {
    expect(isFgcFav(station.id)).toBe(false);
    toggleFgc(station);
    expect(isFgcFav(station.id)).toBe(true);
    expect(getFgcSnapshot().some((f) => f.id === station.id)).toBe(true);
    toggleFgc(station);
    expect(isFgcFav(station.id)).toBe(false);
  });

  it('replaces the snapshot reference on change (for useSyncExternalStore)', () => {
    const before = getFgcSnapshot();
    toggleFgc(station);
    expect(getFgcSnapshot()).not.toBe(before);
  });
});
