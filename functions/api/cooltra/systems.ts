import { cooltraFetch, getCooltraToken, type CooltraEnv } from '../../_cooltra';
import { errorResponse, jsonResponse } from '../../_tmb';

export const onRequest: PagesFunction<CooltraEnv> = async ({ env }) => {
  try {
    const data = await cooltraFetch<unknown>('/integrator/v1/systems', getCooltraToken(env));
    return jsonResponse(200, data, {
      'cache-control': 'public, max-age=3600',
      'cdn-cache-control': 'public, max-age=3600',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
