// Bicing (GBFS v3.0) — normalised station shape consumed by the frontend.
// IMPORTANT: the backend normaliser is defensive about the real feed shape
// (v2/v3 differences); see functions/_bicing.ts.

export type BicingStatus = 'operativa' | 'tancada' | 'fora-servei';

export interface BicingStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  bikesElectric: number;
  bikesMechanical: number;
  docksAvailable: number;
  // Docks available per bike type (GBFS vehicle_docks_available; falls back to
  // the generic dock count when the feed doesn't break it down).
  docksElectric: number;
  docksMechanical: number;
  status: BicingStatus;
  lastReported: number; // epoch ms
}

export type BicingBikeType = 'electric' | 'mecanic';

// What the user is after: take a bike (agafar → needs available bikes) or
// return one (retornar → needs a free dock of the type they're carrying).
// 'cap' hides the Bicing layer.
export interface BicingFilterState {
  action: 'agafar' | 'retornar' | 'cap';
  type: BicingBikeType; // only meaningful when action === 'retornar'
}

export const BICING_TYPE_COLOR: Record<BicingBikeType, string> = {
  electric: '#1b9e4b', // green
  mecanic: '#f5a623', // yellow
};

export const BICING_TYPE_LABEL: Record<BicingBikeType, string> = {
  electric: 'Elèctrica',
  mecanic: 'Mecànica',
};

// Saved station in favourites (only the identity + position is persisted;
// live counts come from the feed).
export interface FavBicing {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const BICING_STATUS_LABEL: Record<BicingStatus, string> = {
  operativa: 'Operativa',
  tancada: 'Tancada',
  'fora-servei': 'Fora de servei',
};
