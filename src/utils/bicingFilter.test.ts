import { describe, expect, it } from 'vitest';
import { filterStations, stationMatches } from './bicingFilter';
import type { BicingFilterState, BicingStation } from '../types/bicing';

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
    docksElectric: 0,
    docksMechanical: 0,
    status: 'operativa',
    lastReported: 0,
    ...over,
  };
}

const agafar: BicingFilterState = { action: 'agafar', type: 'electric' };
const retElec: BicingFilterState = { action: 'retornar', type: 'electric' };
const retMec: BicingFilterState = { action: 'retornar', type: 'mecanic' };
const cap: BicingFilterState = { action: 'cap', type: 'electric' };

describe('stationMatches', () => {
  it('agafar: passes when any bike is available', () => {
    expect(stationMatches(station({ bikesElectric: 1 }), agafar)).toBe(true);
    expect(stationMatches(station({ bikesMechanical: 2 }), agafar)).toBe(true);
    expect(stationMatches(station({}), agafar)).toBe(false);
  });

  it('retornar: passes when there is a free dock for that type', () => {
    expect(stationMatches(station({ docksElectric: 3 }), retElec)).toBe(true);
    expect(stationMatches(station({ docksElectric: 0, docksMechanical: 4 }), retElec)).toBe(false);
    expect(stationMatches(station({ docksMechanical: 4 }), retMec)).toBe(true);
  });

  it('cap: hides every station', () => {
    expect(stationMatches(station({ bikesElectric: 9, docksElectric: 9 }), cap)).toBe(false);
  });
});

describe('filterStations', () => {
  it('returns empty for cap', () => {
    expect(filterStations([station({ bikesElectric: 5 })], cap)).toEqual([]);
  });
  it('keeps only matching stations', () => {
    const list = [
      station({ id: 'a', bikesElectric: 1 }),
      station({ id: 'b', docksMechanical: 1 }),
      station({ id: 'c' }),
    ];
    expect(filterStations(list, agafar).map((s) => s.id)).toEqual(['a']);
    expect(filterStations(list, retMec).map((s) => s.id)).toEqual(['b']);
  });
});
