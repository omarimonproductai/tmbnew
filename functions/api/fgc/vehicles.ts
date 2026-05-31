import { fetchFgcVehicles, jsonResponse } from '../../_fgc';
import type { FgcVehiclesResposta } from '../../../src/types/fgc';

export const onRequest: PagesFunction = async ({ request }) => {
  const linia = new URL(request.url).searchParams.get('linia') ?? undefined;
  const actualitzat = new Date().toISOString();
  try {
    const vehicles = await fetchFgcVehicles(linia);
    const resp: FgcVehiclesResposta = { vehicles, actualitzat, disponible: true };
    return jsonResponse(200, resp);
  } catch (err) {
    const resp: FgcVehiclesResposta = {
      vehicles: [],
      actualitzat,
      disponible: false,
      missatge: err instanceof Error ? err.message : String(err),
    };
    return jsonResponse(200, resp);
  }
};
