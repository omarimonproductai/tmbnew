// Helpers for proxying photon.komoot.io. Photon is keyless and CORS-open,
// but proxying via Functions keeps the geocoder provider swappable, lets
// us cache, and hides user IPs from Komoot.

const PHOTON_URL = 'https://photon.komoot.io/api/';

// Bias Photon results towards Barcelona by default. The scale weights
// distance vs textual relevance — 0.2 is gentle enough that distant exact
// matches still surface but local hits are preferred.
const BARCELONA_LAT = 41.387;
const BARCELONA_LON = 2.168;
const DEFAULT_BIAS_SCALE = 0.2;
const DEFAULT_LIMIT = 6;

export interface PhotonOptions {
  /** Free-text query. Required. */
  q: string;
  /** Optional bias latitude. Defaults to Barcelona centre. */
  lat?: number;
  /** Optional bias longitude. Defaults to Barcelona centre. */
  lon?: number;
  /** 0..1, higher = stronger proximity bias. Defaults to 0.2. */
  biasScale?: number;
  /** Max results. Defaults to 6. */
  limit?: number;
  /** Two-letter language tag, e.g. 'ca' or 'es'. Photon may ignore unknown locales. */
  lang?: string;
}

export function buildPhotonUrl(opts: PhotonOptions): string {
  const params = new URLSearchParams({
    q: opts.q,
    limit: String(opts.limit ?? DEFAULT_LIMIT),
    lat: String(opts.lat ?? BARCELONA_LAT),
    lon: String(opts.lon ?? BARCELONA_LON),
    location_bias_scale: String(opts.biasScale ?? DEFAULT_BIAS_SCALE),
  });
  if (opts.lang) {
    params.set('lang', opts.lang);
  }
  return `${PHOTON_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Public (normalised) result shape returned to the frontend
// ---------------------------------------------------------------------------

export interface GeocodeResult {
  id: string;                   // stable key for React lists
  name: string;                 // primary display label
  sub: string;                  // secondary line ("district · city")
  lat: number;
  lng: number;
  osmType?: string;             // N/W/R
  osmKey?: string;              // 'highway', 'amenity', 'railway', ...
  category?: 'street' | 'house' | 'transit' | 'poi' | 'place';
}

// ---------------------------------------------------------------------------
// Raw Photon GeoJSON (subset)
// ---------------------------------------------------------------------------

interface PhotonProperties {
  osm_id?: number | string;
  osm_type?: string;
  osm_key?: string;
  osm_value?: string;
  type?: string;
  name?: string;
  street?: string;
  housenumber?: string;
  locality?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
  countrycode?: string;
}

interface PhotonFeature {
  type: 'Feature';
  properties: PhotonProperties;
  geometry: {
    type: 'Point';
    // GeoJSON order: [lng, lat]
    coordinates: [number, number];
  };
}

interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

// ---------------------------------------------------------------------------
// Categorisation: helps the frontend show the right icon next to each suggestion
// ---------------------------------------------------------------------------

function categorise(p: PhotonProperties): GeocodeResult['category'] {
  const key = p.osm_key ?? '';
  const value = p.osm_value ?? '';
  if (key === 'railway' || value === 'bus_stop' || value === 'station' || value === 'tram_stop') {
    return 'transit';
  }
  if (p.type === 'street' || key === 'highway') return 'street';
  if (p.type === 'house' || p.housenumber) return 'house';
  if (key === 'place' || p.type === 'city' || p.type === 'locality') return 'place';
  return 'poi';
}

function buildName(p: PhotonProperties): string {
  if (p.name && p.housenumber && p.street && p.street !== p.name) {
    return `${p.name}, ${p.housenumber}`;
  }
  if (p.street && p.housenumber) return `${p.street}, ${p.housenumber}`;
  if (p.name) return p.name;
  return p.street ?? p.city ?? '—';
}

function buildSub(p: PhotonProperties): string {
  const parts = [p.locality, p.district, p.city].filter((x): x is string => Boolean(x));
  // Deduplicate consecutive duplicates (district == city happens for small towns)
  const dedup: string[] = [];
  for (const part of parts) {
    if (dedup[dedup.length - 1] !== part) dedup.push(part);
  }
  return dedup.join(' · ');
}

function buildId(p: PhotonProperties, coords: [number, number]): string {
  if (p.osm_id) return `${p.osm_type ?? 'X'}-${p.osm_id}`;
  return `${coords[0].toFixed(5)}-${coords[1].toFixed(5)}`;
}

export function normalisePhoton(raw: PhotonResponse): GeocodeResult[] {
  if (!raw || !Array.isArray(raw.features)) return [];
  return raw.features.map((f) => {
    const [lng, lat] = f.geometry.coordinates;
    return {
      id: buildId(f.properties, f.geometry.coordinates),
      name: buildName(f.properties),
      sub: buildSub(f.properties),
      lat,
      lng,
      osmType: f.properties.osm_type,
      osmKey: f.properties.osm_key,
      category: categorise(f.properties),
    };
  });
}

export async function fetchPhoton(opts: PhotonOptions): Promise<GeocodeResult[]> {
  const url = buildPhotonUrl(opts);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Photon ${res.status}: ${body.slice(0, 200)}`);
  }
  const raw = (await res.json()) as PhotonResponse;
  return normalisePhoton(raw);
}
