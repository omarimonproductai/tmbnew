import { useEffect, useState } from 'react';
import { getParades } from '../services/tmb';
import type { Parada } from '../types/tmb';

interface UseParadesResult {
  parades: Parada[];
  loading: boolean;
  error: string | null;
}

export function useParades(liniaId: string | null): UseParadesResult {
  const [parades, setParades] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!liniaId) {
      setParades([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    setError(null);
    getParades(liniaId)
      .then((data) => {
        if (cancel) return;
        setParades(data);
      })
      .catch((err: Error) => {
        if (cancel) return;
        setError(err.message);
        setParades([]);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [liniaId]);

  return { parades, loading, error };
}
