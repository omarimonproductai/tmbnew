import { fetchPlan, type PlanRequest } from '../../_planner';
import { errorResponse, jsonResponse, type Env } from '../../_tmb';

function parseNumber(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseModes(value: string | null): PlanRequest['transitModes'] | undefined {
  if (!value) return undefined;
  const allowed = new Set(['metro', 'bus', 'tram', 'rail']);
  const tokens = value
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => allowed.has(t));
  if (tokens.length === 0) return undefined;
  // Map our friendly names to OTP transit modes.
  const mapped = tokens.map((t) => {
    if (t === 'metro') return 'SUBWAY' as const;
    if (t === 'bus') return 'BUS' as const;
    if (t === 'tram') return 'TRAM' as const;
    return 'RAIL' as const;
  });
  return mapped;
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const fromLat = parseNumber(url.searchParams.get('fromLat'));
  const fromLon = parseNumber(url.searchParams.get('fromLon'));
  const toLat = parseNumber(url.searchParams.get('toLat'));
  const toLon = parseNumber(url.searchParams.get('toLon'));

  if (fromLat === null || fromLon === null || toLat === null || toLon === null) {
    return errorResponse(
      400,
      "Falten paràmetres. Requereix fromLat, fromLon, toLat i toLon (graus decimals).",
    );
  }

  const req: PlanRequest = {
    fromLat,
    fromLon,
    toLat,
    toLon,
    transitModes: parseModes(url.searchParams.get('modes')),
  };

  try {
    const plan = await fetchPlan(env, req);
    return jsonResponse(200, plan, {
      // Plans are time-sensitive; do not cache shared edge cache, but allow the
      // browser to reuse for a couple of seconds while the user navigates.
      'cache-control': 'private, max-age=5',
      'cdn-cache-control': 'no-store',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
