// Regenerates src/data/fgcStatic.ts from the official FGC GTFS feed.
//
// Run manually / in CI where the network reaches FGC (NOT wired into
// `npm run build`, so the build stays green in restricted environments):
//   npm run build:fgc
//
// Selection rule (PRD): keep only routes with a DIRECT connection to Barcelona
// — i.e. at least one stop inside the Barcelona-city bounding box below — and
// emit the WHOLE route (all its stops). Coordinates, ordered stops, and
// official route colours come straight from the GTFS.
//
// Dependency: fflate (devDependency) for unzip.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';

const GTFS_URL = 'https://www.fgc.cat/google/google_transit.zip';
// Barcelona-city bounding box (approx. municipal extent). A precise municipal
// polygon could replace this if edge cases appear near the boundary.
const BCN = { minLat: 41.32, maxLat: 41.47, minLng: 2.05, maxLng: 2.23 };

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'src', 'data', 'fgcStatic.ts');
const OUT_TRIPS = join(here, '..', 'src', 'data', 'fgcTrips.ts');

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i] ?? ''));
    return row;
  });
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function color(raw) {
  const c = (raw || '').trim();
  if (!c) return '#666666';
  return c.startsWith('#') ? c : `#${c}`;
}

async function main() {
  console.log('Descarregant', GTFS_URL);
  const res = await fetch(GTFS_URL, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`GTFS ${res.status}`);
  const zip = unzipSync(new Uint8Array(await res.arrayBuffer()));
  const read = (name) => parseCsv(strFromU8(zip[name]));

  const routes = read('routes.txt');
  const stops = read('stops.txt');
  const trips = read('trips.txt');
  const stopTimes = read('stop_times.txt');

  const stopById = new Map(stops.map((s) => [s.stop_id, s]));
  const inBcn = (s) => {
    const lat = Number(s.stop_lat);
    const lng = Number(s.stop_lon);
    return (
      lat >= BCN.minLat && lat <= BCN.maxLat && lng >= BCN.minLng && lng <= BCN.maxLng
    );
  };

  // trip → ordered stop_ids
  const tripStops = new Map();
  for (const st of stopTimes) {
    if (!tripStops.has(st.trip_id)) tripStops.set(st.trip_id, []);
    tripStops.get(st.trip_id).push({ id: st.stop_id, seq: Number(st.stop_sequence) });
  }
  for (const arr of tripStops.values()) arr.sort((a, b) => a.seq - b.seq);

  // route → a representative (longest) trip's ordered stops
  const routeStops = new Map();
  const tripByRoute = new Map();
  for (const t of trips) {
    if (!tripByRoute.has(t.route_id)) tripByRoute.set(t.route_id, []);
    tripByRoute.get(t.route_id).push(t.trip_id);
  }
  for (const [routeId, tripIds] of tripByRoute) {
    let best = [];
    for (const tid of tripIds) {
      const s = tripStops.get(tid) ?? [];
      if (s.length > best.length) best = s;
    }
    routeStops.set(routeId, best.map((s) => s.id));
  }

  // Dedup routes by line code (route_short_name), keeping the variant with the
  // most stops; map every route_id (both directions) to that code.
  const FGC_ROUTE_IDS = {};
  const byCodi = new Map(); // codi -> { route, ordered }
  for (const r of routes) {
    const ordered = routeStops.get(r.route_id) ?? [];
    const servesBcn = ordered.some((id) => {
      const s = stopById.get(id);
      return s && inBcn(s);
    });
    if (!servesBcn || ordered.length === 0) continue;
    const codi = (r.route_short_name || r.route_id).trim();
    FGC_ROUTE_IDS[r.route_id] = codi;
    const prev = byCodi.get(codi);
    if (!prev || ordered.length > prev.ordered.length) byCodi.set(codi, { route: r, ordered });
  }

  const FGC_LINES = [];
  const FGC_LINE_STOPS = {};
  const usedStops = new Set();
  for (const [codi, { route, ordered }] of byCodi) {
    FGC_LINES.push({
      id: `fgc-${codi}`,
      codi,
      nom: route.route_long_name || codi,
      color: color(route.route_color),
      nomComplet: `FGC ${codi}`,
    });
    FGC_LINE_STOPS[codi] = ordered;
    ordered.forEach((id) => usedStops.add(id));
  }

  const FGC_STOPS = {};
  for (const id of usedStops) {
    const s = stopById.get(id);
    if (!s) continue;
    const lat = Number(s.stop_lat);
    const lng = Number(s.stop_lon);
    // Drop stops with invalid/empty coordinates so a stray (0,0) can't blow up
    // the map's fitBounds (line would render off-screen).
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) continue;
    FGC_STOPS[id] = { nom: s.stop_name, lat, lng };
  }

  // trip_id → { line code, headsign } for the qualifying routes, so RT can
  // label arrivals/vehicles (the feed omits route_id/headsign).
  const FGC_TRIPS = {};
  for (const t of trips) {
    const codi = FGC_ROUTE_IDS[t.route_id];
    if (!codi) continue;
    FGC_TRIPS[t.trip_id] = { c: codi, h: (t.trip_headsign || '').trim() };
  }

  const banner = `import type { FgcLinia } from '../types/fgc';

// AUTO-GENERATED by scripts/build-fgc-data.mjs from the official FGC GTFS.
// Do not edit by hand — run \`npm run build:fgc\` to refresh.

export interface FgcStaticStop {
  nom: string;
  lat: number;
  lng: number;
}
`;
  const body =
    banner +
    `\nexport const FGC_LINES: FgcLinia[] = ${JSON.stringify(FGC_LINES, null, 2)};\n` +
    `\nexport const FGC_STOPS: Record<string, FgcStaticStop> = ${JSON.stringify(FGC_STOPS, null, 2)};\n` +
    `\nexport const FGC_LINE_STOPS: Record<string, string[]> = ${JSON.stringify(FGC_LINE_STOPS, null, 2)};\n` +
    `\nexport const FGC_ROUTE_IDS: Record<string, string> = ${JSON.stringify(FGC_ROUTE_IDS, null, 2)};\n`;

  writeFileSync(OUT, body);

  const tripsBody =
    `// AUTO-GENERATED by scripts/build-fgc-data.mjs from the GTFS trips.txt.\n` +
    `// Do not edit by hand — run \`npm run build:fgc\` to refresh.\n\n` +
    `export const FGC_TRIPS: Record<string, { c: string; h: string }> = ${JSON.stringify(FGC_TRIPS)};\n`;
  writeFileSync(OUT_TRIPS, tripsBody);

  console.log(
    `Escrit ${OUT}: ${FGC_LINES.length} línies, ${Object.keys(FGC_STOPS).length} parades; ` +
      `${OUT_TRIPS}: ${Object.keys(FGC_TRIPS).length} trips.`,
  );
}

// Non-fatal: if FGC is unreachable (restricted network / allowlist), keep the
// committed data and let the build proceed. On Cloudflare Pages (open network)
// this regenerates the real dataset on every deploy.
main().catch((err) => {
  console.warn(
    "[build-fgc-data] no s'ha pogut regenerar; es manté el fitxer existent:",
    err?.message ?? err,
  );
  process.exit(0);
});
