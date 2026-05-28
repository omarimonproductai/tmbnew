import type { Env, TmbCreds } from './_tmb';
import { getCreds } from './_tmb';

const TMB_PLANNER_URL = 'https://api.tmb.cat/v1/planner/plan';

// ---------------------------------------------------------------------------
// Public (normalised) shape returned by /api/planner/plan to the frontend.
// Intentionally narrower than the raw OTP response so we can swap providers
// later without changing the React layer.
// ---------------------------------------------------------------------------

export type LegMode = 'WALK' | 'BUS' | 'METRO' | 'SUBWAY' | 'TRAM' | 'RAIL';

export interface LegEndpoint {
  name: string;
  lat: number;
  lng: number;
  stopId?: string;
}

export interface Leg {
  mode: LegMode;
  startTime: number;            // epoch ms
  endTime: number;
  duration: number;             // seconds
  distance: number;             // meters
  from: LegEndpoint;
  to: LegEndpoint;
  routeShortName?: string;      // e.g. 'V15', 'L4'
  routeLongName?: string;
  headsign?: string;            // e.g. 'Av. Tibidabo'
  agencyName?: string;          // 'TMB'
  routeColor?: string;          // hex without '#' if upstream provides it
  legGeometry?: string;         // encoded Google polyline (precision 5)
  intermediateStops?: LegEndpoint[];
}

export interface Itinerary {
  duration: number;             // seconds
  startTime: number;
  endTime: number;
  walkTime: number;
  transitTime: number;
  waitingTime: number;
  walkDistance: number;
  transfers: number;
  legs: Leg[];
}

export interface RoutePlan {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  itineraries: Itinerary[];
}

// ---------------------------------------------------------------------------
// Request shape
// ---------------------------------------------------------------------------

export interface PlanRequest {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  /** Optional whitelist of transit modes. Defaults to ['BUS','SUBWAY','TRAM','RAIL']. */
  transitModes?: ('BUS' | 'SUBWAY' | 'TRAM' | 'RAIL')[];
  /** Max number of itineraries OTP should return. */
  numItineraries?: number;
  /** Max walking distance in meters. */
  maxWalkDistance?: number;
}

// ---------------------------------------------------------------------------
// URL builder
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

// TMB Planner expects MM-DD-YYYY for `date` and hh:mma/p for `time`.
function formatDate(d: Date): string {
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  const hours24 = d.getHours();
  const minutes = pad(d.getMinutes());
  const period = hours24 < 12 ? 'am' : 'pm';
  const hours12 = ((hours24 + 11) % 12) + 1;
  return `${pad(hours12)}:${minutes}${period}`;
}

function buildModeParam(transitModes?: PlanRequest['transitModes']): string {
  const modes = transitModes && transitModes.length > 0
    ? transitModes.join(',')
    : 'BUS,SUBWAY,TRAM,RAIL';
  return `${modes},WALK`;
}

export function buildPlanUrl(req: PlanRequest, creds: TmbCreds, now = new Date()): string {
  const params = new URLSearchParams({
    app_id: creds.app_id,
    app_key: creds.app_key,
    fromPlace: `${req.fromLat},${req.fromLon}`,
    toPlace: `${req.toLat},${req.toLon}`,
    date: formatDate(now),
    time: formatTime(now),
    arriveBy: 'false',
    mode: buildModeParam(req.transitModes),
    maxWalkDistance: String(req.maxWalkDistance ?? 800),
    showIntermediateStops: 'true',
    numItineraries: String(req.numItineraries ?? 5),
  });
  return `${TMB_PLANNER_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// OTP raw types (subset — only what we read)
// ---------------------------------------------------------------------------

interface OTPLegEndpoint {
  name?: string;
  lat?: number;
  lon?: number;
  stopId?: string;
}

interface OTPLegGeometry {
  points?: string;
}

interface OTPLeg {
  mode?: string;
  startTime?: number;
  endTime?: number;
  duration?: number;
  distance?: number;
  from?: OTPLegEndpoint;
  to?: OTPLegEndpoint;
  routeShortName?: string;
  routeLongName?: string;
  headsign?: string;
  agencyName?: string;
  routeColor?: string;
  legGeometry?: OTPLegGeometry;
  intermediateStops?: OTPLegEndpoint[];
}

interface OTPItinerary {
  duration?: number;
  startTime?: number;
  endTime?: number;
  walkTime?: number;
  transitTime?: number;
  waitingTime?: number;
  walkDistance?: number;
  transfers?: number;
  legs?: OTPLeg[];
}

interface OTPResponse {
  requestParameters?: Record<string, unknown>;
  plan?: {
    from?: { lat?: number; lon?: number };
    to?: { lat?: number; lon?: number };
    itineraries?: OTPItinerary[];
  };
  error?: { msg?: string; id?: number };
}

// ---------------------------------------------------------------------------
// Normaliser
// ---------------------------------------------------------------------------

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function normaliseEndpoint(e: OTPLegEndpoint | undefined): LegEndpoint {
  return {
    name: str(e?.name),
    lat: num(e?.lat),
    lng: num(e?.lon),
    stopId: e?.stopId || undefined,
  };
}

const KNOWN_LEG_MODES: LegMode[] = ['WALK', 'BUS', 'METRO', 'SUBWAY', 'TRAM', 'RAIL'];

function normaliseMode(mode: string): LegMode {
  const upper = mode.toUpperCase() as LegMode;
  return KNOWN_LEG_MODES.includes(upper) ? upper : 'WALK';
}

function normaliseLeg(leg: OTPLeg): Leg {
  return {
    mode: normaliseMode(str(leg.mode)),
    startTime: num(leg.startTime),
    endTime: num(leg.endTime),
    duration: num(leg.duration),
    distance: num(leg.distance),
    from: normaliseEndpoint(leg.from),
    to: normaliseEndpoint(leg.to),
    routeShortName: leg.routeShortName || undefined,
    routeLongName: leg.routeLongName || undefined,
    headsign: leg.headsign || undefined,
    agencyName: leg.agencyName || undefined,
    routeColor: leg.routeColor || undefined,
    legGeometry: leg.legGeometry?.points || undefined,
    intermediateStops: leg.intermediateStops?.map(normaliseEndpoint),
  };
}

function normaliseItinerary(it: OTPItinerary): Itinerary {
  return {
    duration: num(it.duration),
    startTime: num(it.startTime),
    endTime: num(it.endTime),
    walkTime: num(it.walkTime),
    transitTime: num(it.transitTime),
    waitingTime: num(it.waitingTime),
    walkDistance: num(it.walkDistance),
    transfers: num(it.transfers),
    legs: (it.legs ?? []).map(normaliseLeg),
  };
}

export function normalisePlan(raw: OTPResponse, req: PlanRequest): RoutePlan {
  return {
    from: { lat: req.fromLat, lng: req.fromLon },
    to: { lat: req.toLat, lng: req.toLon },
    itineraries: (raw.plan?.itineraries ?? []).map(normaliseItinerary),
  };
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

export async function fetchPlan(env: Env, req: PlanRequest): Promise<RoutePlan> {
  const creds = getCreds(env);
  const url = buildPlanUrl(req, creds);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TMB Planner ${res.status}: ${body.slice(0, 200)}`);
  }
  const raw = (await res.json()) as OTPResponse;
  if (raw.error?.msg) {
    throw new Error(`TMB Planner error: ${raw.error.msg}`);
  }
  return normalisePlan(raw, req);
}
