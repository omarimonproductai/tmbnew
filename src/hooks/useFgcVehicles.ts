import { useCallback, useEffect, useState } from 'react';
import { getFgcVehicles } from '../services/fgc';
import type { FgcVehicle } from '../types/fgc';

const REFRESH_MS = 30_000;

// Live FGC vehicle positions. With a line code it returns that line's trains;
// with null it returns ALL FGC trains (each labelled with its own line via the
// trip_id map). Refreshes every 30s while enabled.
export function useFgcVehicles(liniaCodi: string | null, enabled: boolean) {
  const [vehicles, setVehicles] = useState<FgcVehicle[]>([]);

  const fetchNow = useCallback(async () => {
    try {
      const r = await getFgcVehicles(liniaCodi ?? undefined);
      setVehicles(r.disponible ? r.vehicles : []);
    } catch {
      setVehicles([]);
    }
  }, [liniaCodi]);

  useEffect(() => {
    if (!enabled) {
      setVehicles([]);
      return;
    }
    fetchNow();
    const id = window.setInterval(fetchNow, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [enabled, fetchNow]);

  return { vehicles, refresh: fetchNow };
}
