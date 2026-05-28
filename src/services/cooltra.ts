import type { CooltraSystem, CooltraVehicle } from '../types/cooltra';

const API_BASE = '/api/cooltra';

async function jsonFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} en ${url}: ${body}`);
  }
  return (await res.json()) as T;
}

export function getCooltraVehicles(systemId: string): Promise<CooltraVehicle[]> {
  return jsonFetch<CooltraVehicle[]>(
    `${API_BASE}/vehicles?system_id=${encodeURIComponent(systemId)}`,
  );
}

export function getCooltraSystem(systemId: string): Promise<CooltraSystem> {
  return jsonFetch<CooltraSystem>(
    `${API_BASE}/systems?system_id=${encodeURIComponent(systemId)}`,
  );
}
