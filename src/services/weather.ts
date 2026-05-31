import type { WeatherForecast } from '../types/weather';

export async function getForecast(lat: number, lng: number): Promise<WeatherForecast> {
  const res = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lng}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Error ${res.status} en /api/weather/forecast: ${body}`);
  }
  return (await res.json()) as WeatherForecast;
}
