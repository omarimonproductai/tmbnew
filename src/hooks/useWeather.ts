import { useCallback, useEffect, useState } from 'react';
import { getForecast } from '../services/weather';
import type { WeatherForecast, WeatherSource } from '../types/weather';

// Weather is not real-time-critical: a 10-min poll keeps it fresh without
// hammering the endpoint (the CDN caches each response for 10 min anyway).
const REFRESH_MS = 600_000;
const STORAGE_KEY = 'tmb-weather-v1';

// Fallback when there's no GPS permission/fix.
const BARCELONA = { lat: 41.3874, lng: 2.1686 };

// Round to ~1km so GPS jitter (the 10s geolocation updates) doesn't trigger a
// refetch on every tiny position change — city weather doesn't need finer.
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function loadCache(): WeatherForecast | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WeatherForecast) : null;
  } catch {
    return null;
  }
}

function persist(f: WeatherForecast): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  } catch {
    // quota / private mode — ignore
  }
}

interface Result {
  forecast: WeatherForecast | null;
  source: WeatherSource;
  loading: boolean;
  error: string | null;
  lastFailureAt: number | null;
}

// Fetches the forecast for the user's position (falling back to Barcelona) and
// refreshes every 10 min. Falls back to the last cached snapshot on failure,
// mirroring the rest of the app's offline-tolerant pattern.
export function useWeather(position: { lat: number; lng: number } | null): Result {
  const [forecast, setForecast] = useState<WeatherForecast | null>(loadCache);
  const [source, setSource] = useState<WeatherSource>('barcelona');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailureAt, setLastFailureAt] = useState<number | null>(null);

  const lat = round2(position?.lat ?? BARCELONA.lat);
  const lng = round2(position?.lng ?? BARCELONA.lng);
  const src: WeatherSource = position ? 'gps' : 'barcelona';

  const fetchNow = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getForecast(lat, lng);
      setForecast(data);
      setSource(src);
      persist(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLastFailureAt(Date.now());
    } finally {
      setLoading(false);
    }
  }, [lat, lng, src]);

  useEffect(() => {
    fetchNow();
    const id = window.setInterval(fetchNow, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [fetchNow]);

  return { forecast, source, loading, error, lastFailureAt };
}
