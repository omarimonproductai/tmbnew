import { errorResponse, fetchParades, jsonResponse } from './_tmb';

export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    // The redirect rewrite maps /api/parades/<id> -> ?liniaId=<id>.
    // We also support /api/parades?liniaId=<id> directly for local dev.
    const fromQuery = url.searchParams.get('liniaId');
    const fromPath = url.pathname.split('/').filter(Boolean).pop();
    const liniaId =
      fromQuery && fromQuery !== 'parades'
        ? decodeURIComponent(fromQuery)
        : fromPath && fromPath !== 'parades'
          ? decodeURIComponent(fromPath)
          : null;
    if (!liniaId) return errorResponse(400, 'Falta el paràmetre liniaId');
    const parades = await fetchParades(liniaId);
    return jsonResponse(200, parades);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};

export const config = { path: '/api/parades/*' };
