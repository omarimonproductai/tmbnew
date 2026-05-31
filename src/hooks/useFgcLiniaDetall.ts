import { useEffect, useState } from 'react';
import { getFgcLiniaDetall } from '../services/fgc';
import type { FgcLiniaDetall } from '../types/fgc';

export function useFgcLiniaDetall(codi: string | null) {
  const [detall, setDetall] = useState<FgcLiniaDetall | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codi) {
      setDetall(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    setError(null);
    getFgcLiniaDetall(codi)
      .then((d) => {
        if (!cancel) setDetall(d);
      })
      .catch((err: Error) => {
        if (!cancel) {
          setError(err.message);
          setDetall(null);
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [codi]);

  return { detall, loading, error };
}
