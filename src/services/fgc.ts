import type {
  FgcLinia,
  FgcLiniaDetall,
  FgcParada,
  FgcTempsReal,
  FgcVehiclesResposta,
} from '../types/fgc';

const API_BASE = '/api/fgc';

async function jsonFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} ${res.statusText} en ${url}: ${body}`);
  }
  return (await res.json()) as T;
}

export function getFgcLinies(): Promise<FgcLinia[]> {
  return jsonFetch<FgcLinia[]>(`${API_BASE}/linies`);
}

export function getFgcLiniaDetall(codi: string): Promise<FgcLiniaDetall> {
  return jsonFetch<FgcLiniaDetall>(
    `${API_BASE}/parades?linia=${encodeURIComponent(codi)}`,
  );
}

export function getFgcParadesAll(): Promise<FgcParada[]> {
  return jsonFetch<FgcParada[]>(`${API_BASE}/parades-all`);
}

export function getFgcTempsReal(paradaCodi: string): Promise<FgcTempsReal> {
  return jsonFetch<FgcTempsReal>(
    `${API_BASE}/temps-real?parada=${encodeURIComponent(paradaCodi)}`,
  );
}

export function getFgcVehicles(liniaCodi?: string): Promise<FgcVehiclesResposta> {
  const qs = liniaCodi ? `?linia=${encodeURIComponent(liniaCodi)}` : '';
  return jsonFetch<FgcVehiclesResposta>(`${API_BASE}/vehicles${qs}`);
}
