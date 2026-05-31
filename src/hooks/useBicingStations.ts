import { useCallback, useEffect, useState } from 'react';
import { getBicingStations } from '../services/bicing';
import type { BicingStation } from '../types/bicing';

const REFRESH_MS = 30_000;
const STORAGE_KEY = 'tmb-bicing-stations-v1';

function loadCache(): BicingStation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BicingStation[]) : [];
  } catch {
    return [];
  }
}

function persist(stations: BicingStation[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  } catch {
    // quota / private mode — ignore
  }
}

interface Result {
  stations: BicingStation[];
  loading: boolean;
  error: string | null;
  lastFailureAt: number | null;
  refresh: () => void;
}

// Fetches Bicing stations and refreshes every 60s while enabled. Falls back to
// the last cached snapshot on failure (and bumps lastFailureAt so the view can
// fire a toast), mirroring the rest of the app's offline-tolerant pattern.
export function useBicingStations(enabled: boolean): Result {
  const [stations, setStations] = useState<BicingStation[]>(loadCache);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailureAt, setLastFailureAt] = useState<number | null>(null);

  const fetchNow = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBicingStations();
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
    const id = window.setInterval(fetchNow, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [enabled, fetchNow]);

  return { stations, loading, error, lastFailureAt, refresh: fetchNow };
}
