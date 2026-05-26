import { useSyncExternalStore } from 'react';
import {
  getLiniesSnapshot,
  getParadesSnapshot,
  isLiniaFav,
  isParadaFav,
  subscribe,
  toggleLinia,
  toggleParada,
} from '../stores/favorits';
import type { FavLinia, FavParada } from '../types/tmb';

interface UseFavoritsResult {
  favLinies: FavLinia[];
  favParades: FavParada[];
  toggleLinia: (l: FavLinia) => void;
  toggleParada: (p: FavParada) => void;
  isLiniaFav: (id: string) => boolean;
  isParadaFav: (id: string) => boolean;
}

export function useFavorits(): UseFavoritsResult {
  const favLinies = useSyncExternalStore(subscribe, getLiniesSnapshot, getLiniesSnapshot);
  const favParades = useSyncExternalStore(subscribe, getParadesSnapshot, getParadesSnapshot);
  return {
    favLinies,
    favParades,
    toggleLinia,
    toggleParada,
    isLiniaFav,
    isParadaFav,
  };
}
