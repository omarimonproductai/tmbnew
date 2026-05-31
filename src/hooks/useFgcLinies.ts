import { useEffect, useMemo, useState } from 'react';
import { getFgcLinies } from '../services/fgc';
import type { FgcLinia } from '../types/fgc';

export type FgcSort = 'az' | 'za';

function naturalCmp(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function useFgcLinies() {
  const [linies, setLinies] = useState<FgcLinia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cerca, setCerca] = useState('');
  const [sort, setSort] = useState<FgcSort>('az');

  useEffect(() => {
    let cancel = false;
    getFgcLinies()
      .then((d) => {
        if (!cancel) setLinies(d);
      })
      .catch((err: Error) => {
        if (!cancel) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const liniesFiltrades = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    const arr = linies.filter(
      (l) =>
        !q ||
        l.codi.toLowerCase().includes(q) ||
        l.nom.toLowerCase().includes(q),
    );
    return [...arr].sort((a, b) =>
      sort === 'za' ? naturalCmp(b.codi, a.codi) : naturalCmp(a.codi, b.codi),
    );
  }, [linies, cerca, sort]);

  return { linies, liniesFiltrades, loading, error, cerca, setCerca, sort, setSort };
}
