import { errorResponse, fetchParades, getCreds, jsonResponse, type Env } from '../../_tmb';

export const onRequest: PagesFunction<Env, 'liniaId'> = async ({ env, params }) => {
  try {
    const raw = params.liniaId;
    const liniaId = Array.isArray(raw) ? raw[0] : raw;
    if (!liniaId) return errorResponse(400, 'Falta el paràmetre liniaId');
    const parades = await fetchParades(getCreds(env), decodeURIComponent(liniaId));
    return jsonResponse(200, parades, {
      'cache-control': 'public, max-age=300',
      'cdn-cache-control': 'public, max-age=300',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
