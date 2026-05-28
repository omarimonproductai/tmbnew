import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'tmb-planner-history-v1';
const MAX_ITEMS = 5;

export interface PlannerHistoryItem {
  name: string;
  sub: string;
  lat: number;
  lng: number;
  ts: number;
}

function readStored(): PlannerHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is PlannerHistoryItem =>
        typeof x?.name === 'string' &&
        typeof x?.lat === 'number' &&
        typeof x?.lng === 'number',
    );
  } catch {
    return [];
  }
}

function writeStored(items: PlannerHistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore quota / private mode
  }
}

export function usePlannerHistory() {
  const [list, setList] = useState<PlannerHistoryItem[]>(readStored);

  useEffect(() => {
    writeStored(list);
  }, [list]);

  const add = useCallback((entry: Omit<PlannerHistoryItem, 'ts'>) => {
    setList((prev) => {
      const key = (it: PlannerHistoryItem) =>
        `${it.lat.toFixed(5)}-${it.lng.toFixed(5)}`;
      const newItem: PlannerHistoryItem = { ...entry, ts: Date.now() };
      const filtered = prev.filter((it) => key(it) !== key(newItem));
      return [newItem, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const clear = useCallback(() => setList([]), []);

  return { list, add, clear };
}
