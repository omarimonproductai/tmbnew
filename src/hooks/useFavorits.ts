import { useSyncExternalStore } from 'react';
import {
  getBicingSnapshot,
  getFgcSnapshot,
  getLiniesSnapshot,
  getParadesSnapshot,
  isBicingFav,
  isFgcFav,
  isLiniaFav,
  isParadaFav,
  subscribe,
  toggleBicing,
  toggleFgc,
  toggleLinia,
  toggleParada,
} from '../stores/favorits';
import type { FavLinia, FavParada } from '../types/tmb';
import type { FavBicing } from '../types/bicing';
import type { FavFgc } from '../types/fgc';

interface UseFavoritsResult {
  favLinies: FavLinia[];
  favParades: FavParada[];
  favBicing: FavBicing[];
  favFgc: FavFgc[];
  toggleLinia: (l: FavLinia) => void;
  toggleParada: (p: FavParada) => void;
  toggleBicing: (b: FavBicing) => void;
  toggleFgc: (f: FavFgc) => void;
  isLiniaFav: (id: string) => boolean;
  isParadaFav: (id: string) => boolean;
  isBicingFav: (id: string) => boolean;
  isFgcFav: (id: string) => boolean;
}

export function useFavorits(): UseFavoritsResult {
  const favLinies = useSyncExternalStore(subscribe, getLiniesSnapshot, getLiniesSnapshot);
  const favParades = useSyncExternalStore(subscribe, getParadesSnapshot, getParadesSnapshot);
  const favBicing = useSyncExternalStore(subscribe, getBicingSnapshot, getBicingSnapshot);
  const favFgc = useSyncExternalStore(subscribe, getFgcSnapshot, getFgcSnapshot);
  return {
    favLinies,
    favParades,
    favBicing,
    favFgc,
    toggleLinia,
    toggleParada,
    toggleBicing,
    toggleFgc,
    isLiniaFav,
    isParadaFav,
    isBicingFav,
    isFgcFav,
  };
}
