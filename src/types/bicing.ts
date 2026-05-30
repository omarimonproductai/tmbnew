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
  status: BicingStatus;
  lastReported: number; // epoch ms
}

// Saved station in favourites (only the identity + position is persisted;
// live counts come from the feed).
export interface FavBicing {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// The two independent chips (electric / mechanical) collapse to one value,
// mirroring FilterBar's 'tots' | 'cap' pattern. 'cap' hides every station.
export type BicingFilter = 'tots' | 'cap' | 'electric' | 'mecanic';

export const BICING_STATUS_LABEL: Record<BicingStatus, string> = {
  operativa: 'Operativa',
  tancada: 'Tancada',
  'fora-servei': 'Fora de servei',
};
