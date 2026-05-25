import { useEffect, useState } from 'react';
import { getTempsReal } from '../services/tmb';
import type { TempsRealResposta } from '../types/tmb';

interface UseTempsRealResult {
  data: TempsRealResposta | null;
  loading: boolean;
  error: string | null;
}

const REFRESH_MS = 30_000;

export function useTempsReal(
  liniaCodi: string | null,
  paradaCodi: string | null,
  enabled: boolean,
): UseTempsRealResult {
  const [data, setData] = useState<TempsRealResposta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !liniaCodi || !paradaCodi) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancel = false;
    const fetchOnce = () => {
      setLoading(true);
      getTempsReal(liniaCodi, paradaCodi)
        .then((res) => {
          if (cancel) return;
          setData(res);
          setError(null);
        })
        .catch((err: Error) => {
          if (cancel) return;
          setError(err.message);
        })
        .finally(() => {
          if (!cancel) setLoading(false);
        });
    };
    fetchOnce();
    const id = window.setInterval(fetchOnce, REFRESH_MS);
    return () => {
      cancel = true;
      window.clearInterval(id);
    };
  }, [liniaCodi, paradaCodi, enabled]);

  return { data, loading, error };
}
