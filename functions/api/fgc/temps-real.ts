import { fetchFgcArrivals, jsonResponse } from '../../_fgc';
import type { FgcTempsReal } from '../../../src/types/fgc';

export const onRequest: PagesFunction = async ({ request }) => {
  const parada = new URL(request.url).searchParams.get('parada') ?? '';
  const actualitzat = new Date().toISOString();
  try {
    const arribades = await fetchFgcArrivals(parada);
    const resp: FgcTempsReal = { parada, arribades, actualitzat, disponible: true };
    return jsonResponse(200, resp);
  } catch (err) {
    // Degrade gracefully: 200 with disponible:false so the UI shows static
    // data and a soft notice instead of an error.
    const resp: FgcTempsReal = {
      parada,
      arribades: [],
      actualitzat,
      disponible: false,
      missatge: err instanceof Error ? err.message : String(err),
    };
    return jsonResponse(200, resp);
  }
};
