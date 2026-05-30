import type { BicingStation, BicingStatus } from '../src/types/bicing';

// GBFS v3.0 discovery for Bicing Barcelona. Public feed, no credentials.
const GBFS_DISCOVERY =
  'https://barcelona.publicbikesystem.net/customer/gbfs/v3.0/gbfs.json';

// ⚠️ Golden rule of the project: the real feed may differ from the spec
// (field names, vehicle_type ids, timestamp formats). This normaliser is
// intentionally defensive (handles v2.x and v3.0 shapes) but MUST be checked
// against a live call before trusting it in production.

async function fetchJson<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GBFS ${res.status} @ ${url}: ${body.slice(0, 160)}`);
  }
  return (await res.json()) as T;
}

// gbfs.json: v3.0 exposes data.feeds directly; v2.x nests by language
// (data.<lang>.feeds). Handle both.
function feedUrls(discovery: unknown): Record<string, string> {
  const data = (discovery as { data?: unknown })?.data as
    | { feeds?: unknown }
    | Record<string, { feeds?: unknown }>
    | undefined;
  let feeds: unknown;
  if (data && typeof data === 'object' && 'feeds' in data && Array.isArray((data as { feeds?: unknown }).feeds)) {
    feeds = (data as { feeds: unknown }).feeds;
  } else if (data && typeof data === 'object') {
    const first = Object.values(data)[0] as { feeds?: unknown } | undefined;
    feeds = first?.feeds;
  }
  const map: Record<string, string> = {};
  for (const f of (Array.isArray(feeds) ? feeds : []) as Array<{ name?: string; url?: string }>) {
    if (f?.name && f?.url) map[f.name] = f.url;
  }
  return map;
}

// v3.0 names are localised arrays [{ text, language }]; v2.x are plain strings.
function localisedName(name: unknown): string {
  if (typeof name === 'string') return name;
  if (Array.isArray(name)) {
    const arr = name as Array<{ text?: string; language?: string }>;
    const ca = arr.find((n) => n?.language === 'ca');
    return (ca ?? arr[0])?.text ?? '';
  }
  return '';
}

function toEpochMs(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (Number.isFinite(t)) return t;
  }
  return Date.now();
}

function num(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

interface RawVehicleType {
  vehicle_type_id?: string | number;
  propulsion_type?: string;
  form_factor?: string;
}
interface RawStationInfo {
  station_id?: string | number;
  name?: unknown;
  lat?: number;
  lon?: number;
  capacity?: number;
}
interface RawTypeCount {
  vehicle_type_id?: string | number;
  // GBFS v3.0 may use vehicle_type_ids (array); v2.x uses vehicle_type_id.
  vehicle_type_ids?: Array<string | number>;
  count?: number;
}
interface RawStationStatus {
  station_id?: string | number;
  num_vehicles_available?: number;
  num_bikes_available?: number;
  num_docks_available?: number;
  is_installed?: boolean;
  is_renting?: boolean;
  is_returning?: boolean;
  last_reported?: number | string;
  vehicle_types_available?: RawTypeCount[];
  vehicle_docks_available?: RawTypeCount[];
}

function deriveStatus(st: RawStationStatus): BicingStatus {
  if (st.is_installed === false) return 'fora-servei';
  if (st.is_renting === false) return 'tancada';
  return 'operativa';
}

export async function fetchBicingStations(): Promise<BicingStation[]> {
  const discovery = await fetchJson(GBFS_DISCOVERY);
  const urls = feedUrls(discovery);
  const infoUrl = urls['station_information'];
  const statusUrl = urls['station_status'];
  if (!infoUrl || !statusUrl) {
    throw new Error('GBFS: falten els feeds station_information/station_status');
  }

  const [info, status, vtypes] = await Promise.all([
    fetchJson<{ data?: { stations?: RawStationInfo[] } }>(infoUrl),
    fetchJson<{ data?: { stations?: RawStationStatus[] } }>(statusUrl),
    urls['vehicle_types']
      ? fetchJson<{ data?: { vehicle_types?: RawVehicleType[] } }>(urls['vehicle_types'])
      : Promise.resolve({ data: { vehicle_types: [] as RawVehicleType[] } }),
  ]);

  // Map every vehicle_type_id → is it electric? (propulsion != human)
  const electricById = new Map<string, boolean>();
  for (const vt of vtypes?.data?.vehicle_types ?? []) {
    const id = String(vt.vehicle_type_id);
    const prop = String(vt.propulsion_type ?? 'human').toLowerCase();
    electricById.set(id, prop !== 'human');
  }

  const infoById = new Map<string, RawStationInfo>();
  for (const s of info?.data?.stations ?? []) {
    infoById.set(String(s.station_id), s);
  }

  const out: BicingStation[] = [];
  for (const st of status?.data?.stations ?? []) {
    const id = String(st.station_id);
    const meta = infoById.get(id);
    if (!meta || typeof meta.lat !== 'number' || typeof meta.lon !== 'number') continue;

    let elec = 0;
    let mech = 0;
    const vta = st.vehicle_types_available;
    if (Array.isArray(vta) && vta.length > 0 && electricById.size > 0) {
      for (const v of vta) {
        const ids = v.vehicle_type_ids ?? (v.vehicle_type_id != null ? [v.vehicle_type_id] : []);
        const isElectric = ids.some((tid) => electricById.get(String(tid)) === true);
        const c = num(v.count);
        if (isElectric) elec += c;
        else mech += c;
      }
    } else {
      // Fallback: only the total is known; can't split → count as mechanical.
      const total = num(st.num_vehicles_available ?? st.num_bikes_available);
      mech = total;
    }

    const docks = num(st.num_docks_available);

    // Docks per type, if the feed breaks it down; otherwise the generic count
    // applies to both (Bicing docks usually accept any bike type).
    let docksElec = docks;
    let docksMech = docks;
    const vda = st.vehicle_docks_available;
    if (Array.isArray(vda) && vda.length > 0 && electricById.size > 0) {
      docksElec = 0;
      docksMech = 0;
      for (const v of vda) {
        const ids = v.vehicle_type_ids ?? (v.vehicle_type_id != null ? [v.vehicle_type_id] : []);
        const isElectric = ids.some((tid) => electricById.get(String(tid)) === true);
        const c = num(v.count);
        if (isElectric) docksElec += c;
        else docksMech += c;
      }
    }

    out.push({
      id,
      name: localisedName(meta.name),
      lat: meta.lat,
      lng: meta.lon,
      capacity: num(meta.capacity) || elec + mech + docks,
      bikesElectric: elec,
      bikesMechanical: mech,
      docksAvailable: docks,
      docksElectric: docksElec,
      docksMechanical: docksMech,
      status: deriveStatus(st),
      lastReported: toEpochMs(st.last_reported),
    });
  }

  return out;
}
