// FGC (Ferrocarrils de la Generalitat de Catalunya) types. FGC is modelled as
// a second operator alongside TMB. We keep its own types (rather than widening
// TMB's TransportType) so the existing TMB/Bicing flows stay untouched; FGC
// favourites live in their own store bucket and are merged in the UI (the same
// pattern Bicing uses).

export interface FgcLinia {
  id: string; // 'fgc-L6'
  codi: string; // 'L6'
  nom: string; // 'Pl. Catalunya — Sarrià'
  origen?: string;
  desti?: string;
  color: string; // '#rrggbb'
  nomComplet: string; // 'FGC L6'
  numParades?: number;
}

export interface FgcParada {
  id: string; // 'fgc-PC'
  codi: string; // 'PC'
  nom: string;
  lat: number;
  lng: number;
  liniesQueParen: string[]; // line codes stopping here, e.g. ['L6','S1','S2']
}

// A stop within a selected line, with its draw order along that line.
export interface FgcParadaOrdenada extends FgcParada {
  ordre: number;
}

export interface FgcLiniaDetall {
  linia: FgcLinia;
  parades: FgcParadaOrdenada[];
  // Stop-to-stop polyline (the curated seed has no shapes; prod GTFS does).
  geometry: [number, number][];
}

export interface FgcArribada {
  liniaCodi: string;
  destinacio: string;
  minutsRestants: number | null;
  text: string;
}

export interface FgcTempsReal {
  parada: string;
  arribades: FgcArribada[];
  actualitzat: string;
  disponible: boolean;
  missatge?: string;
}

export interface FgcVehicle {
  id: string;
  liniaCodi: string;
  lat: number;
  lng: number;
  destinacio?: string;
}

export interface FgcVehiclesResposta {
  actualitzat: string;
  vehicles: FgcVehicle[];
  disponible: boolean;
  missatge?: string;
}

// Favourite FGC stop (own bucket, merged with TMB/Bicing in the UI).
export interface FavFgc {
  id: string;
  codi: string;
  nom: string;
  lat: number;
  lng: number;
  liniesQueParen: string[];
}
