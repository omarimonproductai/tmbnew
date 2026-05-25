import {
  errorResponse,
  fetchAllLinies,
  fetchParades,
  getCreds,
  mapLimit,
  type Env,
} from '../_tmb';
import type { LiniaResum, ParadaAmbLinies } from '../../src/types/tmb';

export const onRequest: PagesFunction<Env> = async ({ env }) => {
  try {
    const creds = getCreds(env);
    const linies = await fetchAllLinies(creds);

    const results = await mapLimit(linies, 10, async (linia) => {
      try {
        const parades = await fetchParades(creds, linia.id);
        return { linia, parades };
      } catch {
        return { linia, parades: [] };
      }
    });

    const map = new Map<string, ParadaAmbLinies>();
    for (const { linia, parades } of results) {
      const liniaResum: LiniaResum = {
        id: linia.id,
        codi: linia.codi,
        tipus: linia.tipus,
        color: linia.color,
      };
      for (const p of parades) {
        if (!p.codi || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
        const key = `${linia.tipus}|${p.codi}`;
        const existing = map.get(key);
        if (existing) {
          if (!existing.liniesQueParen.some((l) => l.id === liniaResum.id)) {
            existing.liniesQueParen.push(liniaResum);
          }
        } else {
          map.set(key, {
            id: `${linia.tipus}-${p.codi}`,
            codi: p.codi,
            nom: p.nom,
            lat: p.lat,
            lng: p.lng,
            tipus: linia.tipus,
            liniesQueParen: [liniaResum],
          });
        }
      }
    }

    const stops = [...map.values()];
    return new Response(JSON.stringify(stops), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'cdn-cache-control': 'public, max-age=300',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};
