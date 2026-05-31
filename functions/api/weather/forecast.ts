import { BARCELONA, fetchForecast } from '../../_weather';

// Public weather proxy (no credentials). Reads lat/lon, falls back to Barcelona
// when missing or invalid, and lets the CDN reuse the result for 10 min —
// weather is not real-time-critical and this keeps invocations cheap.

function parseCoord(v: string | null, min: number, max: number): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const lat = parseCoord(url.searchParams.get('lat'), -90, 90) ?? BARCELONA.lat;
  const lng = parseCoord(url.searchParams.get('lon'), -180, 180) ?? BARCELONA.lng;
  try {
    const forecast = await fetchForecast(lat, lng);
    return new Response(JSON.stringify(forecast), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=600',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }
};
