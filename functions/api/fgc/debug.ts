import { errorResponse, fgcRtDebug, jsonResponse } from '../../_fgc';

// Temporary diagnostic endpoint to inspect the live FGC GTFS-RT fields.
export const onRequest: PagesFunction = async () => {
  try {
    return jsonResponse(200, await fgcRtDebug(), { 'cache-control': 'no-store' });
  } catch (err) {
    return errorResponse(500, err instanceof Error ? err.message : String(err));
  }
};
