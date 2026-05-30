import { useEffect, useState } from 'react';
import type { BicingBikeType, BicingFilterState } from '../types/bicing';

const DEFAULT: BicingFilterState = { action: 'agafar', type: 'electric' };

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
    const type = parsed?.type === 'mecanic' ? 'mecanic' : 'electric';
    return { action, type };
  } catch {
    return DEFAULT;
  }
}

// Bicing intent filter. Agafar / Retornar are mutually exclusive; tapping the
// active one again hides the layer ('cap'). When returning, a bike type must
// be chosen.
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
      setState((s) => ({ ...s, action: s.action === 'agafar' ? 'cap' : 'agafar' })),
    toggleRetornar: () =>
      setState((s) => ({ ...s, action: s.action === 'retornar' ? 'cap' : 'retornar' })),
    setType: (type: BicingBikeType) => setState((s) => ({ ...s, type, action: 'retornar' })),
  };
}
