import { useEffect, useState } from 'react';
import { getParadesAllChunk } from '../services/tmb';
import type { LiniaResum, ParadaAmbLinies } from '../types/tmb';

interface Result {
  parades: ParadaAmbLinies[];
  loading: boolean;
  // Timestamp of the last fetch round that had at least one failed chunk.
  // Bumps each time so consumers can fire a toast per failure event.
  lastFailureAt: number | null;
}

// Cloudflare Workers cap us at 50 subrequests per invocation. With ~212
// TMB lines, we split the fetch across this many parallel requests so we
// stay safely under the cap on each one. Chunks arrive progressively, the
// UI sees more stops as each finishes.
const CHUNK_COUNT = 6;
const STORAGE_KEY = 'tmb-parades-all-v1';

function loadCachedParades(): ParadaAmbLinies[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ParadaAmbLinies[];
  } catch {
    // ignore corrupt cache
  }
  return [];
}

function persistParades(stops: ParadaAmbLinies[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stops));
  } catch {
    // quota or private mode — silently ignore
  }
}

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
  const [parades, setParades] = useState<ParadaAmbLinies[]>(loadCachedParades);
  const [loading, setLoading] = useState(false);
  const [lastFailureAt, setLastFailureAt] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // Seed the in-flight aggregator with whatever we already have on
    // screen (cached or previously fetched). That way a chunk failure
    // never makes the list shrink — the worst case is 'stale but full'.
    const accumulated = new Map<string, ParadaAmbLinies>();
    for (const s of parades) {
      accumulated.set(s.id, { ...s, liniesQueParen: [...s.liniesQueParen] });
    }
    let pending = CHUNK_COUNT;
    let anyFailure = false;
    setLoading(true);

    for (let i = 0; i < CHUNK_COUNT; i += 1) {
      getParadesAllChunk(i, CHUNK_COUNT)
        .then((stops) => {
          if (cancelled) return;
          mergeInto(accumulated, stops);
          const next = [...accumulated.values()];
          setParades(next);
          persistParades(next);
        })
        .catch(() => {
          if (cancelled) return;
          anyFailure = true;
        })
        .finally(() => {
          if (cancelled) return;
          pending -= 1;
          if (pending === 0) {
            setLoading(false);
            if (anyFailure) setLastFailureAt(Date.now());
          }
        });
    }

    return () => {
      cancelled = true;
    };
    // We intentionally exclude `parades` from deps — refeeding wouldn't
    // gain anything (the cache hydrates the initial state) and would
    // re-trigger every fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { parades, loading, lastFailureAt };
}
