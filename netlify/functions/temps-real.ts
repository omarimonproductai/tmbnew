import { errorResponse, fetchIBus, jsonResponse } from './_tmb';
import type { TempsRealResposta } from '../../src/types/tmb';

export default async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    // Path: /api/temps-real/{liniaCodi}/{paradaCodi}
    const path = url.searchParams.get('path');
    const segments = (path ?? url.pathname.replace(/^.*temps-real\/?/, ''))
      .split('/')
      .map((s) => decodeURIComponent(s))
      .filter(Boolean);
    const [liniaCodi, paradaCodi] = segments;
    if (!liniaCodi || !paradaCodi) {
      return errorResponse(400, 'Falten paràmetres liniaCodi/paradaCodi');
    }

    try {
      const { arribades } = await fetchIBus(liniaCodi, paradaCodi);
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades,
        actualitzat: new Date().toISOString(),
        disponible: arribades.length > 0,
        missatge: arribades.length === 0 ? 'Sense informació de temps real ara mateix.' : undefined,
      };
      return jsonResponse(200, resposta);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades: [],
        actualitzat: new Date().toISOString(),
        disponible: false,
        missatge: `Temps real no disponible amb aquestes credencials: ${message}`,
      };
      return jsonResponse(200, resposta);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(500, message);
  }
};

export const config = { path: '/api/temps-real/*' };
