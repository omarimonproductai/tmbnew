import { useEffect, useMemo, useState } from 'react';
import { getLinies } from '../services/tmb';
import type { Linia, TransportType } from '../types/tmb';

export type FilterType = 'tots' | TransportType;

interface UseLiniesResult {
  linies: Linia[];
  liniesFiltrades: Linia[];
  loading: boolean;
  error: string | null;
  filtre: FilterType;
  setFiltre: (f: FilterType) => void;
  cerca: string;
  setCerca: (s: string) => void;
  refetch: () => void;
}

export function useLinies(): UseLiniesResult {
  const [linies, setLinies] = useState<Linia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<FilterType>('tots');
  const [cerca, setCerca] = useState('');
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    getLinies()
      .then((data) => {
        if (cancel) return;
        setLinies(data);
      })
      .catch((err: Error) => {
        if (cancel) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [nonce]);

  const liniesFiltrades = useMemo(() => {
    const cercaNorm = cerca.trim().toLowerCase();
    return linies.filter((l) => {
      if (filtre !== 'tots' && l.tipus !== filtre) return false;
      if (!cercaNorm) return true;
      return (
        l.codi.toLowerCase().includes(cercaNorm) ||
        l.nom.toLowerCase().includes(cercaNorm) ||
        (l.origen ?? '').toLowerCase().includes(cercaNorm) ||
        (l.desti ?? '').toLowerCase().includes(cercaNorm)
      );
    });
  }, [linies, filtre, cerca]);

  return {
    linies,
    liniesFiltrades,
    loading,
    error,
    filtre,
    setFiltre,
    cerca,
    setCerca,
    refetch: () => setNonce((n) => n + 1),
  };
}
