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
    const allLinies = await fetchAllLinies(creds);
    // Metro first: there are only a dozen metro lines, and processing them
    // before the 200+ bus lines guarantees they're always represented in the
    // response even if a slow tail of bus fetches eats into our budget.
    const linies = [
      ...allLinies.filter((l) => l.tipus === 'metro'),
      ...allLinies.filter((l) => l.tipus !== 'metro'),
    ];

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
        // For metro we key on the group station id (CODI_GRUP_ESTACIO) so that
        // L1 and L5 at La Sagrera collapse into one entry with both lines in
        // `liniesQueParen`. For bus we keep the platform `codi`, which already
        // is shared by every bus passing through that physical stop.
        const groupKey = linia.tipus === 'metro' ? p.id : p.codi;
        const key = `${linia.tipus}|${groupKey}`;
        const existing = map.get(key);
        if (existing) {
          if (!existing.liniesQueParen.some((l) => l.id === liniaResum.id)) {
            existing.liniesQueParen.push(liniaResum);
          }
        } else {
          map.set(key, {
            id: `${linia.tipus}-${groupKey}`,
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
