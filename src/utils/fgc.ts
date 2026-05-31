import { FGC_LINES, FGC_LINE_STOPS, FGC_STOPS } from '../data/fgcStatic';
import type {
  FgcLinia,
  FgcLiniaDetall,
  FgcParada,
  FgcParadaOrdenada,
} from '../types/fgc';

// Pure derivations over the static FGC catalogue. Shared by the Pages Function
// (`functions/_fgc.ts`) and unit-testable on its own.

export function liniesForStop(code: string): string[] {
  const out: string[] = [];
  for (const [lineCodi, stops] of Object.entries(FGC_LINE_STOPS)) {
    if (stops.includes(code)) out.push(lineCodi);
  }
  return out;
}

export function getFgcLinies(): FgcLinia[] {
  return FGC_LINES.map((l) => ({
    ...l,
    numParades: FGC_LINE_STOPS[l.codi]?.length ?? 0,
  }));
}

export function getFgcLiniaDetall(codi: string): FgcLiniaDetall | null {
  const linia = FGC_LINES.find((l) => l.codi === codi);
  const stopCodes = FGC_LINE_STOPS[codi];
  if (!linia || !stopCodes) return null;
  const parades: FgcParadaOrdenada[] = stopCodes
    .filter((c) => FGC_STOPS[c])
    .map((c, i) => {
      const s = FGC_STOPS[c];
      return {
        id: `fgc-${c}`,
        codi: c,
        nom: s.nom,
        lat: s.lat,
        lng: s.lng,
        ordre: i,
        liniesQueParen: liniesForStop(c),
      };
    });
  // GeoJSON order [lng, lat], consistent with the rest of the app's geometry.
  const geometry: [number, number][] = parades.map((p) => [p.lng, p.lat]);
  return { linia: { ...linia, numParades: parades.length }, parades, geometry };
}

export function getFgcParadesAll(): FgcParada[] {
  return Object.keys(FGC_STOPS).map((c) => {
    const s = FGC_STOPS[c];
    return {
      id: `fgc-${c}`,
      codi: c,
      nom: s.nom,
      lat: s.lat,
      lng: s.lng,
      liniesQueParen: liniesForStop(c),
    };
  });
}

// Barcelona-city bounding box used to decide which routes "connect directly"
// to Barcelona (mirrors the rule in scripts/build-fgc-data.mjs).
export const BCN_BBOX = { minLat: 41.32, maxLat: 41.47, minLng: 2.05, maxLng: 2.23 };

export function isInBarcelona(lat: number, lng: number): boolean {
  return (
    lat >= BCN_BBOX.minLat &&
    lat <= BCN_BBOX.maxLat &&
    lng >= BCN_BBOX.minLng &&
    lng <= BCN_BBOX.maxLng
  );
}
