import type { FgcArribada, FgcVehicle } from '../src/types/fgc';

// Static derivations live in src/utils/fgc.ts (shared + unit-tested).
export { getFgcLinies, getFgcLiniaDetall, getFgcParadesAll } from '../src/utils/fgc';

// FGC Open Data real-time (Opendatasoft Explore API v2.1, records endpoint —
// JSON, so no Protobuf decoding needed in the Worker). The exact field names
// must be validated against the live feed in production (regla d'or); until
// then the parsers are defensive and degrade to "disponible: false".
const FGC_ODS_BASE =
  'https://dadesobertes.fgc.cat/api/explore/v2.1/catalog/datasets';

// --- REAL TIME (best-effort; validate fields in production) ----------

interface OdsRecord {
  [k: string]: unknown;
}
interface OdsResponse {
  results?: OdsRecord[];
}

async function odsRecords(slug: string, params: string): Promise<OdsRecord[]> {
  const url = `${FGC_ODS_BASE}/${slug}/records?${params}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`FGC ODS ${slug} ${res.status}`);
  const data = (await res.json()) as OdsResponse;
  return Array.isArray(data.results) ? data.results : [];
}

function num(v: unknown): number | null {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function str(v: unknown): string {
  return v === null || v === undefined ? '' : String(v);
}

// Vehicle positions: tolerate several plausible field names from the GTFS-RT
// → ODS mapping (latitude/longitude/route_id/trip_id…).
export async function fetchFgcVehicles(
  liniaCodi?: string,
): Promise<FgcVehicle[]> {
  const recs = await odsRecords('vehicle-positions-gtfs_realtime', 'limit=100');
  const vehicles: FgcVehicle[] = [];
  for (const r of recs) {
    const lat = num(r.latitude ?? r.lat ?? r.position_latitude);
    const lng = num(r.longitude ?? r.lon ?? r.lng ?? r.position_longitude);
    if (lat === null || lng === null) continue;
    const route = str(r.route_id ?? r.route_short_name ?? r.line ?? r.linia);
    if (liniaCodi && route && route.toUpperCase() !== liniaCodi.toUpperCase()) {
      continue;
    }
    vehicles.push({
      id: str(r.vehicle_id ?? r.id ?? r.trip_id ?? `${lat},${lng}`),
      liniaCodi: route || (liniaCodi ?? ''),
      lat,
      lng,
      destinacio: str(r.trip_headsign ?? r.headsign ?? '') || undefined,
    });
  }
  return vehicles;
}

// Trip updates → next arrivals for a stop.
export async function fetchFgcArrivals(
  stopCodi: string,
): Promise<FgcArribada[]> {
  const recs = await odsRecords(
    'trip-updates-gtfs_realtime',
    `limit=50&where=${encodeURIComponent(`stop_id="${stopCodi}"`)}`,
  );
  const now = Date.now();
  const arribades: FgcArribada[] = [];
  for (const r of recs) {
    const epoch = num(r.arrival_time ?? r.arrival ?? r.departure_time);
    let minuts: number | null = null;
    if (epoch !== null) {
      const ms = epoch > 1e12 ? epoch : epoch * 1000;
      minuts = Math.max(0, Math.round((ms - now) / 60000));
    }
    arribades.push({
      liniaCodi: str(r.route_id ?? r.route_short_name ?? r.line),
      destinacio: str(r.trip_headsign ?? r.headsign ?? ''),
      minutsRestants: minuts,
      text: minuts !== null ? `${minuts} min` : '—',
    });
  }
  arribades.sort(
    (a, b) =>
      (a.minutsRestants ?? Infinity) - (b.minutsRestants ?? Infinity),
  );
  return arribades;
}

export function jsonResponse(
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': status === 200 ? 'public, max-age=60' : 'no-store',
      ...(extraHeaders ?? {}),
    },
  });
}

export function errorResponse(status: number, message: string): Response {
  return jsonResponse(status, { error: message });
}
