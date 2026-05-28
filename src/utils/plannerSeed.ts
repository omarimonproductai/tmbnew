// Cross-component bridge for "open the planner with this destination".
// Used by stop popups (which live inside Leaflet, outside React's tree)
// to seed the route planner with a destination and switch the mode.

const STORAGE_KEY = 'tmb-planner-seed-v1';
export const PLANNER_OPEN_EVENT = 'tmb:open-planner';

export interface PlannerSeed {
  name: string;
  lat: number;
  lng: number;
}

export function seedPlannerDestination(seed: PlannerSeed) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(PLANNER_OPEN_EVENT, { detail: seed }));
}
