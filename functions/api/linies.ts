import { errorResponse, fetchAllLinies, getCreds, jsonResponse, type Env } from '../_tmb';

export const onRequest: PagesFunction<Env> = async ({ env }) => {
  try {
    const linies = await fetchAllLinies(getCreds(env));
    return jsonResponse(200, linies, {
      'cache-control': 'public, max-age=3600',
      'cdn-cache-control': 'public, max-age=3600',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
