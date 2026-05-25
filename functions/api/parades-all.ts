import {
  errorResponse,
  fetchAllLinies,
  fetchParades,
  getCreds,
  mapLimit,
  type Env,
} from '../_tmb';
import type { LiniaResum, ParadaAmbLinies } from '../../src/types/tmb';

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const chunksTotal = Math.max(
      1,
      Math.min(20, parseInt(url.searchParams.get('chunks') ?? '1', 10) || 1),
    );
    const chunkIdx = Math.max(
      0,
      Math.min(
        chunksTotal - 1,
        parseInt(url.searchParams.get('chunk') ?? '0', 10) || 0,
      ),
    );

    const creds = getCreds(env);
    const allLinies = await fetchAllLinies(creds);
    // Cloudflare Workers cap us at 50 subrequests per invocation. Sort by
    // importance so each chunk slices a consistent priority window:
    //   1. metro
    //   2. Nova Xarxa families V / H / D / M
    //   3. numeric & other (B, L, …)
    //   4. night-bus N
    const familyRank = (codi: string): number => {
      const head = codi.charAt(0).toUpperCase();
      if (head === 'V' || head === 'H' || head === 'D' || head === 'M') return 1;
      if (head === 'N') return 3;
      return 2;
    };
    const sorted = [...allLinies].sort((a, b) => {
      if (a.tipus !== b.tipus) return a.tipus === 'metro' ? -1 : 1;
      if (a.tipus === 'metro') return 0;
      return familyRank(a.codi) - familyRank(b.codi);
    });

    // Slice the chunk this invocation is responsible for.
    const chunkSize = Math.ceil(sorted.length / chunksTotal);
    const start = chunkIdx * chunkSize;
    const linies = sorted.slice(start, start + chunkSize);

    const results = await mapLimit(linies, 20, async (linia) => {
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
