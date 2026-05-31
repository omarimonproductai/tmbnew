import { useCallback, useEffect, useState } from 'react';
import { getFgcParadesAll } from '../services/fgc';
import type { FgcParada } from '../types/fgc';

const STORAGE_KEY = 'tmb-fgc-parades-all-v1';

function loadCache(): FgcParada[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as FgcParada[]) : [];
  } catch {
    return [];
  }
}

function persist(stations: FgcParada[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  } catch {
    // quota / private mode — ignore
  }
}

interface Result {
  stations: FgcParada[];
  loading: boolean;
  error: string | null;
  lastFailureAt: number | null;
  refresh: () => void;
}

// FGC stops are static, so we fetch once when enabled and cache; on failure we
// keep the last cached snapshot and bump lastFailureAt for a soft toast.
export function useFgcStations(enabled: boolean): Result {
  const [stations, setStations] = useState<FgcParada[]>(loadCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailureAt, setLastFailureAt] = useState<number | null>(null);

  const fetchNow = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFgcParadesAll();
      setStations(data);
      persist(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLastFailureAt(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    fetchNow();
  }, [enabled, fetchNow]);

  return { stations, loading, error, lastFailureAt, refresh: fetchNow };
}
