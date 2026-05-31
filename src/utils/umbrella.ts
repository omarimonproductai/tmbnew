import type { WeatherForecast, WeatherHour } from '../types/weather';
import { isRainyCode } from './weatherCode';

// Thresholds for the "do I need an umbrella?" verdict. Easily tunable.
export const RAIN_PROBABILITY_THRESHOLD = 50; // %
export const RAIN_AMOUNT_THRESHOLD = 0.2; // mm
// Look-ahead window for the verdict ("will it rain while I'm out today").
export const VERDICT_WINDOW_HOURS = 12;

export interface UmbrellaVerdict {
  needed: boolean;
  rainingNow: boolean;
  message: string; // "Agafa paraigua" | "No et cal paraigua" | "Està plovent"
  detail: string | null; // "cap a les 17 h" | "de les 17 a les 19 h" | null
}

// A single hour counts as rainy if it's likely enough OR wet enough.
export function hourIsRainy(h: WeatherHour): boolean {
  return (
    h.precipProbability >= RAIN_PROBABILITY_THRESHOLD ||
    h.precipitation >= RAIN_AMOUNT_THRESHOLD
  );
}

function hourOf(iso: string): number {
  const m = /T(\d{2}):/.exec(iso);
  return m ? parseInt(m[1], 10) : 0;
}

function formatWindow(rainy: WeatherHour[]): string {
  const hours = rainy.map((h) => hourOf(h.time)).sort((a, b) => a - b);
  const first = hours[0];
  const last = hours[hours.length - 1];
  if (first === last) return `cap a les ${first} h`;
  return `de les ${first} a les ${last} h`;
}

export function umbrellaVerdict(forecast: WeatherForecast): UmbrellaVerdict {
  const rainingNow =
    forecast.now.precipitation >= RAIN_AMOUNT_THRESHOLD ||
    isRainyCode(forecast.now.code);
  if (rainingNow) {
    return {
      needed: true,
      rainingNow: true,
      message: 'Està plovent',
      detail: 'agafa paraigua',
    };
  }

  const window = forecast.hours.slice(0, VERDICT_WINDOW_HOURS);
  const rainy = window.filter(hourIsRainy);
  if (rainy.length === 0) {
    return {
      needed: false,
      rainingNow: false,
      message: 'No et cal paraigua',
      detail: null,
    };
  }
  return {
    needed: true,
    rainingNow: false,
    message: 'Agafa paraigua',
    detail: formatWindow(rainy),
  };
}
