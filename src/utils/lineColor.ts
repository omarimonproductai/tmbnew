import type { LiniaResum, TransportType } from '../types/tmb';

// Official TMB "Nova Xarxa" colour palette for prefixed bus families.
const BUS_FAMILY_COLORS: Record<string, string> = {
  V: '#28922F', // Vertical — green
  H: '#0072BB', // Horizontal — dark blue
  D: '#7E2D8E', // Diagonal — purple
  N: '#1a1a1a', // Nitbus — near-black
  M: '#00A19A', // Metropolità intermunicipal — teal
};

function familyFromCodi(codi: string): string | null {
  const m = codi.toUpperCase().match(/^([A-Z])/);
  return m ? m[1] : null;
}

export function getLineColor(linia: {
  tipus: TransportType;
  codi: string;
  color: string;
}): string {
  if (linia.tipus === 'metro') return linia.color;
  const fam = familyFromCodi(linia.codi);
  if (fam && BUS_FAMILY_COLORS[fam]) return BUS_FAMILY_COLORS[fam];
  return linia.color;
}

// Pick the "representative" line for a multi-line stop: prefer metro over
// bus (so an interchange shows the metro colour), then a prefixed bus
// family in V→H→D→M→N priority, then the first line.
const FAMILY_PRIORITY = ['V', 'H', 'D', 'M', 'N'];

export function pickRepresentativeLine(
  linies: LiniaResum[],
): LiniaResum | undefined {
  if (linies.length === 0) return undefined;
  const metro = linies.find((l) => l.tipus === 'metro');
  if (metro) return metro;
  for (const fam of FAMILY_PRIORITY) {
    const m = linies.find((l) => familyFromCodi(l.codi) === fam);
    if (m) return m;
  }
  return linies[0];
}
