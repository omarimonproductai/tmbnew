import type { BicingStation } from '../types/bicing';

export async function getBicingStations(): Promise<BicingStation[]> {
  const res = await fetch('/api/bicing/stations');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} en /api/bicing/stations: ${body}`);
  }
  const data = (await res.json()) as { stations?: BicingStation[] };
  return Array.isArray(data?.stations) ? data.stations : [];
}
