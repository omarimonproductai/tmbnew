import { cooltraFetch, getCooltraToken, type CooltraEnv } from '../../_cooltra';
import { errorResponse, jsonResponse } from '../../_tmb';

export const onRequest: PagesFunction<CooltraEnv> = async ({ env, request }) => {
  const url = new URL(request.url);
  const systemId = url.searchParams.get('system_id');
  if (!systemId) {
    return errorResponse(400, 'Falta el paràmetre system_id (ex: barcelona).');
  }
  try {
    const data = await cooltraFetch<unknown>(
      `/integrator/v1/vehicles?system_id=${encodeURIComponent(systemId)}`,
      getCooltraToken(env),
    );
    return jsonResponse(200, data, {
      'cache-control': 'public, max-age=30',
      'cdn-cache-control': 'public, max-age=30',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
