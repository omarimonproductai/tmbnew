import { errorResponse, getFgcLiniaDetall, jsonResponse } from '../../_fgc';

export const onRequest: PagesFunction = async ({ request }) => {
  try {
    const linia = new URL(request.url).searchParams.get('linia') ?? '';
    const detall = getFgcLiniaDetall(linia);
    if (!detall) return errorResponse(404, `Línia FGC desconeguda: ${linia}`);
    return jsonResponse(200, detall, {
      'cache-control': 'public, max-age=86400',
      'cdn-cache-control': 'public, max-age=86400',
    });
  } catch (err) {
    return errorResponse(500, err instanceof Error ? err.message : String(err));
  }
};
