import { describe, expect, it } from 'vitest';
import { filterStations, resolveBicingFilter, stationMatchesFilter } from './bicingFilter';
import type { BicingStation } from '../types/bicing';

function station(over: Partial<BicingStation>): BicingStation {
  return {
    id: '1',
    name: 'Estació',
    lat: 41.4,
    lng: 2.1,
    capacity: 20,
    bikesElectric: 0,
    bikesMechanical: 0,
    docksAvailable: 0,
    status: 'operativa',
    lastReported: 0,
    ...over,
  };
}

describe('resolveBicingFilter', () => {
  it('maps the two chips to a combined value', () => {
    expect(resolveBicingFilter(true, true)).toBe('tots');
    expect(resolveBicingFilter(true, false)).toBe('electric');
    expect(resolveBicingFilter(false, true)).toBe('mecanic');
    expect(resolveBicingFilter(false, false)).toBe('cap');
  });
});

describe('stationMatchesFilter', () => {
  const elec = station({ bikesElectric: 3, bikesMechanical: 0 });
  const mec = station({ bikesElectric: 0, bikesMechanical: 2 });
  const empty = station({ bikesElectric: 0, bikesMechanical: 0 });

  it('tots: any available bike passes, empty fails', () => {
    expect(stationMatchesFilter(elec, 'tots')).toBe(true);
    expect(stationMatchesFilter(mec, 'tots')).toBe(true);
    expect(stationMatchesFilter(empty, 'tots')).toBe(false);
  });

  it('electric/mecanic: only that type passes', () => {
    expect(stationMatchesFilter(elec, 'electric')).toBe(true);
    expect(stationMatchesFilter(mec, 'electric')).toBe(false);
    expect(stationMatchesFilter(mec, 'mecanic')).toBe(true);
    expect(stationMatchesFilter(elec, 'mecanic')).toBe(false);
  });

  it('cap hides every station', () => {
    expect(stationMatchesFilter(elec, 'cap')).toBe(false);
  });
});

describe('filterStations', () => {
  it('returns empty for cap', () => {
    expect(filterStations([station({ bikesElectric: 5 })], 'cap')).toEqual([]);
  });
  it('keeps only matching stations', () => {
    const list = [
      station({ id: 'a', bikesElectric: 1 }),
      station({ id: 'b', bikesMechanical: 1 }),
      station({ id: 'c' }),
    ];
    expect(filterStations(list, 'electric').map((s) => s.id)).toEqual(['a']);
    expect(filterStations(list, 'tots').map((s) => s.id)).toEqual(['a', 'b']);
  });
});
