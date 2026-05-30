import type { FavLinia, FavParada } from '../types/tmb';
import type { FavBicing } from '../types/bicing';

// Tiny external store for favourites, shared across every star button and
// the FavoritsView. Backed by localStorage, no backend. Components read it
// through useFavorits (useSyncExternalStore).

const LINIES_KEY = 'tmb-fav-linies';
const PARADES_KEY = 'tmb-fav-parades';
const BICING_KEY = 'tmb-fav-bicing';

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function save(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / quota — ignore
  }
}

// Snapshots are replaced (new array reference) only when they change, so
// useSyncExternalStore can rely on referential identity.
let liniesSnapshot: FavLinia[] = load<FavLinia>(LINIES_KEY);
let paradesSnapshot: FavParada[] = load<FavParada>(PARADES_KEY);
let bicingSnapshot: FavBicing[] = load<FavBicing>(BICING_KEY);

const listeners = new Set<() => void>();
function emit(): void {
  for (const l of listeners) l();
}

export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getLiniesSnapshot(): FavLinia[] {
  return liniesSnapshot;
}
export function getParadesSnapshot(): FavParada[] {
  return paradesSnapshot;
}
export function getBicingSnapshot(): FavBicing[] {
  return bicingSnapshot;
}

export function isLiniaFav(id: string): boolean {
  return liniesSnapshot.some((l) => l.id === id);
}
export function isParadaFav(id: string): boolean {
  return paradesSnapshot.some((p) => p.id === id);
}
export function isBicingFav(id: string): boolean {
  return bicingSnapshot.some((b) => b.id === id);
}

export function toggleLinia(linia: FavLinia): void {
  liniesSnapshot = isLiniaFav(linia.id)
    ? liniesSnapshot.filter((l) => l.id !== linia.id)
    : [...liniesSnapshot, linia];
  save(LINIES_KEY, liniesSnapshot);
  emit();
}

export function toggleParada(parada: FavParada): void {
  paradesSnapshot = isParadaFav(parada.id)
    ? paradesSnapshot.filter((p) => p.id !== parada.id)
    : [...paradesSnapshot, parada];
  save(PARADES_KEY, paradesSnapshot);
  emit();
}

export function toggleBicing(station: FavBicing): void {
  bicingSnapshot = isBicingFav(station.id)
    ? bicingSnapshot.filter((b) => b.id !== station.id)
    : [...bicingSnapshot, station];
  save(BICING_KEY, bicingSnapshot);
  emit();
}
