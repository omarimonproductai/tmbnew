import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tmb-planner-modes-v1';

export interface PlannerModes {
  metro: boolean;
  bus: boolean;
}

const DEFAULT_MODES: PlannerModes = { metro: true, bus: true };

function readStored(): PlannerModes {
  if (typeof window === 'undefined') return DEFAULT_MODES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MODES;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.metro === 'boolean' && typeof parsed?.bus === 'boolean') {
      // Never allow both off
      if (!parsed.metro && !parsed.bus) return DEFAULT_MODES;
      return parsed;
    }
    return DEFAULT_MODES;
  } catch {
    return DEFAULT_MODES;
  }
}

export function usePlannerModes() {
  const [modes, setModes] = useState<PlannerModes>(readStored);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(modes));
    } catch {
      // ignore
    }
  }, [modes]);

  const setMetro = (v: boolean) => {
    setModes((prev) => (!v && !prev.bus ? prev : { ...prev, metro: v }));
  };
  const setBus = (v: boolean) => {
    setModes((prev) => (!v && !prev.metro ? prev : { ...prev, bus: v }));
  };

  return { ...modes, setMetro, setBus };
}
