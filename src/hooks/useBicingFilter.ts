import { useEffect, useState } from 'react';

export interface BicingFilterState {
  electric: boolean;
  mecanic: boolean;
}

const DEFAULT: BicingFilterState = { electric: true, mecanic: true };

function read(key: string): BicingFilterState {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.electric === 'boolean' && typeof parsed?.mecanic === 'boolean') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT;
}

// Two independent Bicing chips persisted under the given key. Both default on;
// both can be off (which hides the Bicing layer entirely).
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
    ...state,
    setElectric: (v: boolean) => setState((s) => ({ ...s, electric: v })),
    setMecanic: (v: boolean) => setState((s) => ({ ...s, mecanic: v })),
  };
}
