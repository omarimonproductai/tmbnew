import { useCallback, useEffect, useState } from 'react';
import { getCooltraVehicles } from '../services/cooltra';
import type { CooltraVehicle } from '../types/cooltra';

const REFRESH_MS = 30_000;

export function useCooltraVehicles(enabled: boolean, systemId = 'barcelona') {
  const [vehicles, setVehicles] = useState<CooltraVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const fetchNow = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const data = await getCooltraVehicles(systemId);
      setVehicles(data);
      setError(null);
      setLastFetchedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [enabled, systemId]);

  useEffect(() => {
    if (!enabled) {
      setVehicles([]);
      setError(null);
      return;
    }
    fetchNow();
    const id = window.setInterval(fetchNow, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [enabled, fetchNow]);

  return { vehicles, loading, error, lastFetchedAt, refresh: fetchNow };
}
