const COOLTRA_BASE = 'https://maas.zeus.cooltra.com';

export interface CooltraEnv {
  ZEUS_API_PROD?: string;
  ZEUS_API_STAGE?: string;
}

export function getCooltraToken(env: CooltraEnv): string {
  const token = env.ZEUS_API_PROD || env.ZEUS_API_STAGE;
  if (!token) {
    throw new Error(
      'Credencial Cooltra no configurada. Defineix ZEUS_API_PROD (producció) o ZEUS_API_STAGE (preview/dev) a Cloudflare Pages o .dev.vars.',
    );
  }
  return token;
}

export async function cooltraFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${COOLTRA_BASE}${path}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Cooltra API ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}
