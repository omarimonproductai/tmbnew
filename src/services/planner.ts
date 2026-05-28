import type { RoutePlan } from '../types/planner';

const API_BASE = '/api/planner';

export interface RoutePlanRequest {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  transitModes?: ('BUS' | 'SUBWAY' | 'TRAM' | 'RAIL')[];
}

export async function getRoutePlan(req: RoutePlanRequest): Promise<RoutePlan> {
  const params = new URLSearchParams({
    fromLat: String(req.fromLat),
    fromLon: String(req.fromLon),
    toLat: String(req.toLat),
    toLon: String(req.toLon),
  });
  if (req.transitModes && req.transitModes.length > 0) {
    const reverse: Record<string, string> = {
      SUBWAY: 'metro',
      BUS: 'bus',
      TRAM: 'tram',
      RAIL: 'rail',
    };
    params.set('modes', req.transitModes.map((m) => reverse[m]).join(','));
  }
  const res = await fetch(`${API_BASE}/plan?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} en /api/planner/plan: ${body}`);
  }
  return (await res.json()) as RoutePlan;
}
