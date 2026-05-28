export interface CooltraVehicle {
  id: string;
  license_plate: string;
  position: { lat: number; lon: number };
  range: number;
  model_id: string;
}

export interface CooltraSystem {
  id: string;
  name: string;
  geofence: unknown;
}

export type CooltraKind = 'scooter' | 'bike';

const BIKE_MODEL_IDS = new Set(['13']);
const SCOOTER_MODEL_IDS = new Set(['6']);

export function inferKind(modelId: string): CooltraKind {
  const id = String(modelId).trim();
  if (BIKE_MODEL_IDS.has(id)) return 'bike';
  if (SCOOTER_MODEL_IDS.has(id)) return 'scooter';
  return 'scooter';
}
