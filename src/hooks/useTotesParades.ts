import { useEffect, useState } from 'react';
import { getParadesAllChunk } from '../services/tmb';
import type { LiniaResum, ParadaAmbLinies } from '../types/tmb';

interface Result {
  parades: ParadaAmbLinies[];
  loading: boolean;
  error: string | null;
}

// Cloudflare Workers cap us at 50 subrequests per invocation. With ~212
// TMB lines, we split the fetch across this many parallel requests so we
// stay safely under the cap on each one. Chunks arrive progressively, the
// UI sees more stops as each finishes.
const CHUNK_COUNT = 6;

function mergeInto(
  map: Map<string, ParadaAmbLinies>,
  stops: ParadaAmbLinies[],
): void {
  for (const s of stops) {
    const existing = map.get(s.id);
    if (existing) {
      for (const l of s.liniesQueParen) {
        if (!existing.liniesQueParen.some((el: LiniaResum) => el.id === l.id)) {
          existing.liniesQueParen.push(l);
        }
      }
    } else {
      map.set(s.id, { ...s, liniesQueParen: [...s.liniesQueParen] });
    }
  }
}

export function useTotesParades(enabled = true): Result {
  const [parades, setParades] = useState<ParadaAmbLinies[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const accumulated = new Map<string, ParadaAmbLinies>();
    let pending = CHUNK_COUNT;
    setLoading(true);
    setError(null);

    for (let i = 0; i < CHUNK_COUNT; i += 1) {
      getParadesAllChunk(i, CHUNK_COUNT)
        .then((stops) => {
          if (cancelled) return;
          mergeInto(accumulated, stops);
          setParades([...accumulated.values()]);
        })
        .catch((err: Error) => {
          if (cancelled) return;
          // Don't blow away the partial results we already have — only
          // surface the error if every chunk has failed and we have
          // nothing to show.
          if (accumulated.size === 0) setError(err.message);
        })
        .finally(() => {
          if (cancelled) return;
          pending -= 1;
          if (pending === 0) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { parades, loading, error };
}
