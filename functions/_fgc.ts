import { FGC_ROUTE_IDS } from '../src/data/fgcStatic';
import { FGC_TRIPS } from '../src/data/fgcTrips';
import { decodeFeedMessage } from '../src/utils/gtfsRt';
import type { FgcArribada, FgcVehicle } from '../src/types/fgc';

// Static derivations live in src/utils/fgc.ts (shared + unit-tested).
import { getFgcLinies, getFgcLiniaDetall, getFgcParadesAll } from '../src/utils/fgc';
export { getFgcLinies, getFgcLiniaDetall, getFgcParadesAll };

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

// The FGC GTFS-RT feed omits route_id and headsign per entity, carrying only an
// opaque trip_id. We resolve the line + destination from the pre-baked
// trip_id → { c, h } map (the RT trip_id may carry a "|…" suffix; strip it).
function tripInfo(tripId: string): { c: string; h: string } | null {
  if (!tripId) return null;
  return FGC_TRIPS[tripId] ?? FGC_TRIPS[tripId.split('|')[0]] ?? null;
}
function codiFromTrip(tripId: string, routeId: string): string {
  return tripInfo(tripId)?.c ?? FGC_ROUTE_IDS[routeId] ?? routeId;
}

export async function fetchFgcVehicles(liniaCodi?: string): Promise<FgcVehicle[]> {
  const { vehicles } = await fetchPbFeed('vehicle-positions-gtfs_realtime');
  const target = liniaCodi?.toUpperCase();
  return vehicles
    .filter((v) => Number.isFinite(v.lat) && Number.isFinite(v.lng))
    .map((v) => ({ codi: codiFromTrip(v.tripId, v.routeId), info: tripInfo(v.tripId), v }))
    .filter(({ codi }) => !target || codi.toUpperCase() === target)
    .map(({ codi, info, v }) => ({
      id: v.id || v.tripId || `${v.lat},${v.lng}`,
      liniaCodi: codi,
      lat: v.lat,
      lng: v.lng,
      destinacio: info?.h || undefined,
    }));
}

export async function fetchFgcArrivals(stopCodi: string): Promise<FgcArribada[]> {
  const { tripUpdates } = await fetchPbFeed('trip-updates-gtfs_realtime');
  const now = Date.now();
  const arribades: FgcArribada[] = [];
  for (const tu of tripUpdates) {
    const info = tripInfo(tu.tripId);
    for (const s of tu.stops) {
      if (s.stopId !== stopCodi) continue;
      const minuts =
        s.time !== null ? Math.max(0, Math.round((s.time * 1000 - now) / 60000)) : null;
      arribades.push({
        liniaCodi: info?.c ?? FGC_ROUTE_IDS[tu.routeId] ?? tu.routeId,
        destinacio: info?.h ?? '',
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

// Diagnostic: returns a small sample of the decoded live feeds + how our
// static keys look, so we can see which fields the FGC GTFS-RT actually carries
// (route_id present? trip_id format? stop_id format?) and finish the mapping.
export async function fgcRtDebug() {
  const safe = async <T>(p: Promise<T>) => {
    try {
      return await p;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) } as const;
    }
  };
  const vp = await safe(fetchPbFeed('vehicle-positions-gtfs_realtime'));
  const tu = await safe(fetchPbFeed('trip-updates-gtfs_realtime'));
  return {
    vehicles: 'error' in vp ? vp : vp.vehicles.slice(0, 5),
    tripUpdates:
      'error' in tu
        ? tu
        : tu.tripUpdates.slice(0, 5).map((t) => ({
            routeId: t.routeId,
            tripId: t.tripId,
            stops: t.stops.slice(0, 3),
          })),
    routeIdsSample: Object.entries(FGC_ROUTE_IDS).slice(0, 12),
    stopCodesSample: getFgcParadesAll().slice(0, 6).map((p) => p.codi),
  };
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
