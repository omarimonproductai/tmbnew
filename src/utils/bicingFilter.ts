import type { BicingFilterState, BicingStation } from '../types/bicing';

// A station passes the filter when it satisfies the user's intent:
//  - agafar  → has ≥1 bike available (any type — when taking, any will do).
//  - retornar→ has ≥1 free dock. In Bicing any free dock accepts any bike, so
//             the chosen type doesn't change which stations qualify (it only
//             reflects what the user is carrying).
//  - cap     → hidden.
export function stationMatches(s: BicingStation, f: BicingFilterState): boolean {
  switch (f.action) {
    case 'agafar':
      return s.bikesElectric > 0 || s.bikesMechanical > 0;
    case 'retornar':
      return s.docksAvailable > 0;
    case 'cap':
    default:
      return false;
  }
}

export function filterStations(
  stations: BicingStation[],
  f: BicingFilterState,
): BicingStation[] {
  if (f.action === 'cap') return [];
  return stations.filter((s) => stationMatches(s, f));
}
