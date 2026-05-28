import type { GeocodeResult } from '../types/geocode';

const API_BASE = '/api/geocode';

export async function searchPlaces(
  query: string,
  bias?: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ q: query });
  if (bias) {
    params.set('lat', String(bias.lat));
    params.set('lon', String(bias.lng));
  }
  const res = await fetch(`${API_BASE}/search?${params.toString()}`, { signal });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} en /api/geocode/search: ${body}`);
  }
  return (await res.json()) as GeocodeResult[];
}
