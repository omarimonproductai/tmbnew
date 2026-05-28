import { cooltraFetch, getCooltraToken, type CooltraEnv } from '../../_cooltra';
import { errorResponse, jsonResponse } from '../../_tmb';

interface CooltraSystem {
  id?: string;
  name?: string;
  geofence?: unknown;
}

export const onRequest: PagesFunction<CooltraEnv> = async ({ env, request }) => {
  const url = new URL(request.url);
  const systemId = url.searchParams.get('system_id');
  if (!systemId) {
    return errorResponse(400, 'Falta el paràmetre system_id (ex: barcelona).');
  }
  try {
    const all = await cooltraFetch<CooltraSystem[]>('/integrator/v1/systems', getCooltraToken(env));
    const match = Array.isArray(all) ? all.find((s) => s?.id === systemId) : undefined;
    if (!match) {
      return errorResponse(404, `Ciutat '${systemId}' no trobada a Cooltra.`);
    }
    return jsonResponse(200, match, {
      'cache-control': 'public, max-age=3600',
      'cdn-cache-control': 'public, max-age=3600',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
