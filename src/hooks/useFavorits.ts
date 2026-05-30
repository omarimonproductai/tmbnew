import { useSyncExternalStore } from 'react';
import {
  getBicingSnapshot,
  getLiniesSnapshot,
  getParadesSnapshot,
  isBicingFav,
  isLiniaFav,
  isParadaFav,
  subscribe,
  toggleBicing,
  toggleLinia,
  toggleParada,
} from '../stores/favorits';
import type { FavLinia, FavParada } from '../types/tmb';
import type { FavBicing } from '../types/bicing';

interface UseFavoritsResult {
  favLinies: FavLinia[];
  favParades: FavParada[];
  favBicing: FavBicing[];
  toggleLinia: (l: FavLinia) => void;
  toggleParada: (p: FavParada) => void;
  toggleBicing: (b: FavBicing) => void;
  isLiniaFav: (id: string) => boolean;
  isParadaFav: (id: string) => boolean;
  isBicingFav: (id: string) => boolean;
}

export function useFavorits(): UseFavoritsResult {
  const favLinies = useSyncExternalStore(subscribe, getLiniesSnapshot, getLiniesSnapshot);
  const favParades = useSyncExternalStore(subscribe, getParadesSnapshot, getParadesSnapshot);
  const favBicing = useSyncExternalStore(subscribe, getBicingSnapshot, getBicingSnapshot);
  return {
    favLinies,
    favParades,
    favBicing,
    toggleLinia,
    toggleParada,
    toggleBicing,
    isLiniaFav,
    isParadaFav,
    isBicingFav,
  };
}
