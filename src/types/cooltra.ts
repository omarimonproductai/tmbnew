export interface CooltraVehicle {
  id: string;
  license_plate: string;
  // GeoJSON-style: [longitude, latitude]
  position: [number, number];
  // Remaining range in metres
  range: number;
  model_id: number | string;
}

export interface CooltraSystem {
  id: string;
  name: string;
  geofence: unknown;
}

export type CooltraKind = 'scooter' | 'bike';

const BIKE_MODEL_IDS = new Set(['13']);
const SCOOTER_MODEL_IDS = new Set(['6']);

export function inferKind(modelId: number | string): CooltraKind {
  const id = String(modelId).trim();
  if (BIKE_MODEL_IDS.has(id)) return 'bike';
  if (SCOOTER_MODEL_IDS.has(id)) return 'scooter';
  return 'scooter';
}
