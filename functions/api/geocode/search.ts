import { fetchPhoton } from '../../_photon';
import { errorResponse, jsonResponse } from '../../_tmb';

const MIN_QUERY_LEN = 3;

function parseNumberOrUndefined(value: string | null): number | undefined {
  if (value === null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export const onRequest: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length < MIN_QUERY_LEN) {
    return errorResponse(400, `Query massa curta. Mínim ${MIN_QUERY_LEN} caràcters.`);
  }

  try {
    const results = await fetchPhoton({
      q,
      lat: parseNumberOrUndefined(url.searchParams.get('lat')),
      lon: parseNumberOrUndefined(url.searchParams.get('lon')),
      lang: 'ca',
    });
    return jsonResponse(200, results, {
      // Geocode results for the same query are stable enough to cache for an
      // hour. The user's typeahead will re-hit different cache entries per
      // keystroke, but the resulting URL has the same q over a 1-hour window.
      'cache-control': 'public, max-age=3600',
      'cdn-cache-control': 'public, max-age=3600',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
