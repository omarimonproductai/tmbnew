import { fetchBicingStations } from '../../_bicing';
import { errorResponse, jsonResponse, type Env } from '../../_tmb';

// Bicing GBFS is public (no credentials). Returns normalised stations.
export const onRequest: PagesFunction<Env> = async () => {
  try {
    const stations = await fetchBicingStations();
    return jsonResponse(
      200,
      { stations },
      {
        // Availability is time-sensitive: let the browser reuse briefly while
        // navigating, but never serve a stale shared CDN copy.
        'cache-control': 'private, max-age=15',
        'cdn-cache-control': 'no-store',
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
