import { useEffect, useState } from 'react';
import type { BicingFilterState } from '../types/bicing';

const DEFAULT: BicingFilterState = { action: 'agafar' };

function read(key: string): BicingFilterState {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    const action =
      parsed?.action === 'agafar' || parsed?.action === 'retornar' || parsed?.action === 'cap'
        ? parsed.action
        : 'agafar';
    return { action };
  } catch {
    return DEFAULT;
  }
}

// Bicing intent filter. Agafar / Retornar are mutually exclusive; tapping the
// active one again hides the layer ('cap').
export function useBicingFilter(storageKey: string) {
  const [state, setState] = useState<BicingFilterState>(() => read(storageKey));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [storageKey, state]);

  return {
    state,
    toggleAgafar: () =>
      setState((s) => ({ action: s.action === 'agafar' ? 'cap' : 'agafar' })),
    toggleRetornar: () =>
      setState((s) => ({ action: s.action === 'retornar' ? 'cap' : 'retornar' })),
  };
}
