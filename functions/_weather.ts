import type { WeatherForecast, WeatherHour, WeatherNow } from '../src/types/weather';

// Open-Meteo forecast API. Public, free, no API key, no credentials.
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';

// Barcelona city centre — fallback when the request has no GPS coordinates.
export const BARCELONA = { lat: 41.3874, lng: 2.1686 };

// ⚠️ Golden rule of the project: the real response may differ from the docs.
// This normaliser is intentionally defensive (every field guarded) and was NOT
// verifiable live in dev (the Open-Meteo host is outside the dev allowlist;
// in production the Pages Function reaches it). Validate against a live call.

function num(v: unknown): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

interface RawForecast {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    precipitation?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
    weather_code?: number[];
  };
}

function normalise(raw: RawForecast, lat: number, lng: number): WeatherForecast {
  const now: WeatherNow = {
    temp: num(raw.current?.temperature_2m),
    code: num(raw.current?.weather_code),
    precipitation: num(raw.current?.precipitation),
  };
  const h = raw.hourly ?? {};
  const times = Array.isArray(h.time) ? h.time : [];
  const hours: WeatherHour[] = times.map((time, i) => ({
    time: String(time),
    temp: num(h.temperature_2m?.[i]),
    precipProbability: num(h.precipitation_probability?.[i]),
    precipitation: num(h.precipitation?.[i]),
    code: num(h.weather_code?.[i]),
  }));
  return { lat, lng, now, hours };
}

export async function fetchForecast(lat: number, lng: number): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,weather_code,precipitation',
    hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code',
    timezone: 'Europe/Madrid',
    forecast_hours: '24',
  });
  const res = await fetch(`${OPEN_METEO}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Open-Meteo ${res.status}: ${body.slice(0, 160)}`);
  }
  const raw = (await res.json()) as RawForecast;
  return normalise(raw, lat, lng);
}
