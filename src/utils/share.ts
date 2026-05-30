import type { ParadaAmbLinies } from '../types/tmb';

export function buildParadaUrl(paradaId: string): string {
  const url = new URL(window.location.origin);
  url.searchParams.set('parada', paradaId);
  return url.toString();
}

function shareText(parada: ParadaAmbLinies): string {
  const linies = parada.liniesQueParen
    .slice(0, 6)
    .map((l) => l.codi)
    .join(', ');
  return linies
    ? `Parada ${parada.nom} — temps real de ${linies}`
    : `Parada ${parada.nom}`;
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed';

// Uses the native share sheet on mobile; falls back to copying the link.
export async function shareParada(parada: ParadaAmbLinies): Promise<ShareResult> {
  const url = buildParadaUrl(parada.id);
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Tu et Mous Bé', text: shareText(parada), url });
      return 'shared';
    } catch (err) {
      // The user dismissing the sheet throws AbortError — not an error.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Fall through to clipboard.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

// Bicing stations have no in-app deep link; share a maps location instead.
export async function shareBicing(station: {
  name: string;
  lat: number;
  lng: number;
}): Promise<ShareResult> {
  const url = `https://www.google.com/maps/search/?api=1&query=${station.lat},${station.lng}`;
  const text = `Estació Bicing ${station.name}`;
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Tu et Mous Bé', text, url });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}
