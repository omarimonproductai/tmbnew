import { useEffect, useState } from 'react';
import { searchPlaces } from '../services/geocode';
import type { GeocodeResult } from '../types/geocode';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 3;
const BARCELONA = { lat: 41.387, lng: 2.168 };

interface State {
  results: GeocodeResult[];
  loading: boolean;
  error: string | null;
}

export function usePhotonSearch(query: string): State {
  const [state, setState] = useState<State>({
    results: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) {
      setState({ results: [], loading: false, error: null });
      return;
    }

    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const results = await searchPlaces(trimmed, BARCELONA, ctrl.signal);
        setState({ results, loading: false, error: null });
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setState({
          results: [],
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  return state;
}
