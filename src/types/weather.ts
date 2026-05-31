// Weather forecast — normalised shape consumed by the frontend.
// Source: Open-Meteo (free, no API key). The backend normaliser is defensive
// about the real response shape; see functions/_weather.ts.

export type WeatherSource = 'gps' | 'barcelona';

// Current conditions.
export interface WeatherNow {
  temp: number; // °C
  code: number; // WMO weather code
  precipitation: number; // mm in the current period
}

// One hourly slot of the forecast.
export interface WeatherHour {
  time: string; // ISO local time, e.g. "2026-05-31T14:00"
  temp: number; // °C
  precipProbability: number; // %
  precipitation: number; // mm
  code: number; // WMO weather code
}

export interface WeatherForecast {
  lat: number;
  lng: number;
  now: WeatherNow;
  hours: WeatherHour[]; // next ~24h, starting at the current hour
}
