import {
  errorResponse,
  fetchIBus,
  fetchIMetro,
  getCreds,
  jsonResponse,
  rawFetch,
  type Env,
} from '../../_tmb';
import type { TempsRealResposta } from '../../../src/types/tmb';

const TMB_BASE = 'https://api.tmb.cat/v1';

export const onRequest: PagesFunction<Env, 'path'> = async ({ request, env, params }) => {
  try {
    const url = new URL(request.url);
    const debug = url.searchParams.get('debug') === '1';
    const all = url.searchParams.get('all') === '1';

    // params.path arrives as string[] from the [[path]] catch-all.
    const raw = params.path;
    const segments = (Array.isArray(raw) ? raw : raw ? [raw] : [])
      .map((seg) => decodeURIComponent(seg))
      .filter(Boolean);
    const [tipus, liniaCodi, paradaCodi] = segments;
    if (!tipus || !liniaCodi || !paradaCodi) {
      return errorResponse(400, 'Falten paràmetres tipus/liniaCodi/paradaCodi');
    }

    const creds = getCreds(env);

    if (debug) {
      const attempts: Array<{ label: string } & Awaited<ReturnType<typeof rawFetch>>> = [];
      if (tipus === 'metro') {
        attempts.push({
          label: 'metro-estacions',
          ...(await rawFetch(
            `${TMB_BASE}/itransit/metro/estacions?estacions=${encodeURIComponent(paradaCodi)}`,
            creds,
          )),
        });
      } else if (tipus === 'bus') {
        attempts.push({
          label: 'line-scoped',
          ...(await rawFetch(
            `${TMB_BASE}/ibus/lines/${encodeURIComponent(liniaCodi)}/stops/${encodeURIComponent(paradaCodi)}`,
            creds,
          )),
        });
        attempts.push({
          label: 'stop-wide',
          ...(await rawFetch(
            `${TMB_BASE}/ibus/stops/${encodeURIComponent(paradaCodi)}`,
            creds,
          )),
        });
      }
      return jsonResponse(200, {
        inputs: { tipus, liniaCodi, paradaCodi },
        attempts,
        note: 'Mode debug: exposa la resposta crua de TMB. Crida-l com /api/temps-real/{tipus}/{linia}/{parada}?debug=1',
      });
    }

    if (tipus !== 'bus' && tipus !== 'metro') {
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades: [],
        actualitzat: new Date().toISOString(),
        disponible: false,
        missatge: `Temps real no disponible per a ${tipus}.`,
      };
      return jsonResponse(200, resposta);
    }

    try {
      const { arribades } =
        tipus === 'bus'
          ? await fetchIBus(creds, liniaCodi, paradaCodi, all)
          : await fetchIMetro(creds, liniaCodi, paradaCodi, all);
      const resposta: TempsRealResposta = {
        parada: paradaCodi,
        arribades,
        actualitzat: new Date().toISOString(),
        disponible: arribades.length > 0,
        missatge:
          arribades.length === 0
            ? 'Sense vehicles propers ara mateix.'
            : undefined,
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
