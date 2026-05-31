import { FGC_ROUTE_IDS } from '../src/data/fgcStatic';
import { decodeFeedMessage } from '../src/utils/gtfsRt';
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

interface OdsFileResponse {
  results?: Array<{ file?: { url?: string } }>;
}

// The Opendatasoft GTFS-RT datasets expose a single record holding the raw
// GTFS-RT protobuf as a file attachment (vehicleposition.pb / tripupdates.pb).
// Step 1: read the records endpoint to get the current file URL. Step 2: fetch
// the .pb. Step 3: decode it (see decodeFeedMessage). 2 subrequests per call.
async function fetchPbFeed(slug: string) {
  const recUrl = `${FGC_ODS_BASE}/${slug}/records?limit=1`;
  const recRes = await fetch(recUrl, { headers: { Accept: 'application/json' } });
  if (!recRes.ok) throw new Error(`FGC ODS ${slug} ${recRes.status}`);
  const rec = (await recRes.json()) as OdsFileResponse;
  const fileUrl = rec.results?.[0]?.file?.url;
  if (!fileUrl) throw new Error(`FGC ODS ${slug}: cap fitxer .pb`);
  const pbRes = await fetch(fileUrl);
  if (!pbRes.ok) throw new Error(`FGC pb ${slug} ${pbRes.status}`);
  return decodeFeedMessage(new Uint8Array(await pbRes.arrayBuffer()));
}

// Map a feed route_id (GTFS route_id) to our line code (route_short_name). The
// build pre-bake fills FGC_ROUTE_IDS; with the curated seed it's empty, so we
// fall back to comparing the raw value.
function routeCodi(routeId: string): string {
  return FGC_ROUTE_IDS[routeId] ?? routeId;
}

export async function fetchFgcVehicles(liniaCodi?: string): Promise<FgcVehicle[]> {
  const { vehicles } = await fetchPbFeed('vehicle-positions-gtfs_realtime');
  const target = liniaCodi?.toUpperCase();
  return vehicles
    .filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng))
    .map((v) => ({ codi: routeCodi(v.routeId), v }))
    .filter(({ codi }) => !target || codi.toUpperCase() === target)
    .map(({ codi, v }) => ({
      id: v.id || `${v.lat},${v.lng}`,
      liniaCodi: codi,
      lat: v.lat,
      lng: v.lng,
    }));
}

export async function fetchFgcArrivals(stopCodi: string): Promise<FgcArribada[]> {
  const { tripUpdates } = await fetchPbFeed('trip-updates-gtfs_realtime');
  const now = Date.now();
  const arribades: FgcArribada[] = [];
  for (const tu of tripUpdates) {
    for (const s of tu.stops) {
      if (s.stopId !== stopCodi) continue;
      const minuts =
        s.time !== null ? Math.max(0, Math.round((s.time * 1000 - now) / 60000)) : null;
      arribades.push({
        liniaCodi: routeCodi(tu.routeId),
        destinacio: '',
        minutsRestants: minuts,
        text: minuts !== null ? `${minuts} min` : '—',
      });
    }
  }
  arribades.sort(
    (a, b) => (a.minutsRestants ?? Infinity) - (b.minutsRestants ?? Infinity),
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
