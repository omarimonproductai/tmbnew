import { useCallback, useEffect, useState } from 'react';
import { getFgcVehicles } from '../services/fgc';
import type { FgcVehicle } from '../types/fgc';

const REFRESH_MS = 30_000;

// Live FGC vehicle positions for the selected line. Refreshes every 30s while
// enabled; on failure (or disponible:false) it simply shows none.
export function useFgcVehicles(liniaCodi: string | null, enabled: boolean) {
  const [vehicles, setVehicles] = useState<FgcVehicle[]>([]);

  const fetchNow = useCallback(async () => {
    if (!liniaCodi) return;
    try {
      const r = await getFgcVehicles(liniaCodi);
      setVehicles(r.disponible ? r.vehicles : []);
    } catch {
      setVehicles([]);
    }
  }, [liniaCodi]);

  useEffect(() => {
    if (!enabled || !liniaCodi) {
      setVehicles([]);
      return;
    }
    fetchNow();
    const id = window.setInterval(fetchNow, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [enabled, liniaCodi, fetchNow]);

  return { vehicles, refresh: fetchNow };
}
