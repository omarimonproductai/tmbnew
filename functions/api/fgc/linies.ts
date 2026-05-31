import { errorResponse, getFgcLinies, jsonResponse } from '../../_fgc';

export const onRequest: PagesFunction = async () => {
  try {
    return jsonResponse(200, getFgcLinies(), {
      'cache-control': 'public, max-age=86400',
      'cdn-cache-control': 'public, max-age=86400',
    });
  } catch (err) {
    return errorResponse(500, err instanceof Error ? err.message : String(err));
  }
};
