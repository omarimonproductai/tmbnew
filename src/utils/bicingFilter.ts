import type { BicingFilter, BicingStation } from '../types/bicing';

// Two independent chips (electric / mechanical) ↔ one combined value, mirroring
// FilterBar's 'tots' | 'cap' pattern so both can be deselected.
export function resolveBicingFilter(electric: boolean, mecanic: boolean): BicingFilter {
  if (electric && mecanic) return 'tots';
  if (electric) return 'electric';
  if (mecanic) return 'mecanic';
  return 'cap';
}

// A station passes when it currently has ≥1 available bike of an enabled type
// (filter by real availability — the user's choice, PRD §4 req.10). 'cap' hides
// everything.
export function stationMatchesFilter(s: BicingStation, filter: BicingFilter): boolean {
  switch (filter) {
    case 'tots':
      return s.bikesElectric > 0 || s.bikesMechanical > 0;
    case 'electric':
      return s.bikesElectric > 0;
    case 'mecanic':
      return s.bikesMechanical > 0;
    case 'cap':
    default:
      return false;
  }
}

export function filterStations(
  stations: BicingStation[],
  filter: BicingFilter,
): BicingStation[] {
  if (filter === 'cap') return [];
  return stations.filter((s) => stationMatchesFilter(s, filter));
}
