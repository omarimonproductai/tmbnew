import { useEffect, useState } from 'react';
import { getFgcTempsReal } from '../services/fgc';
import type { FgcTempsReal } from '../types/fgc';

// Fetches FGC next-arrivals for a stop when its popup opens. Real-time degrades
// gracefully (the endpoint returns disponible:false on failure), so the popup
// just shows static info + a soft "no real-time" notice.
export function useFgcArribades(paradaCodi: string | null, enabled: boolean) {
  const [data, setData] = useState<FgcTempsReal | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !paradaCodi) return;
    let cancel = false;
    setLoading(true);
    getFgcTempsReal(paradaCodi)
      .then((d) => {
        if (!cancel) setData(d);
      })
      .catch(() => {
        if (!cancel) setData(null);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [paradaCodi, enabled]);

  return { data, loading };
}
