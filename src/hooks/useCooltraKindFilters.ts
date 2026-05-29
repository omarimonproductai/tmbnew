import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tmb-cooltra-kinds-v1';

export interface CooltraKindState {
  motos: boolean;
  bikes: boolean;
}

const DEFAULT_KINDS: CooltraKindState = { motos: true, bikes: true };

function readStored(): CooltraKindState {
  if (typeof window === 'undefined') return DEFAULT_KINDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KINDS;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.motos === 'boolean' && typeof parsed?.bikes === 'boolean') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_KINDS;
}

export function useCooltraKindFilters() {
  const [state, setState] = useState<CooltraKindState>(readStored);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  return {
    ...state,
    setMotos: (v: boolean) => setState((s) => ({ ...s, motos: v })),
    setBikes: (v: boolean) => setState((s) => ({ ...s, bikes: v })),
  };
}
