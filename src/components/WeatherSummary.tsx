import { useState } from 'react';
import { WeatherHourly } from './WeatherHourly';
import { describeWeather } from '../utils/weatherCode';
import { umbrellaVerdict } from '../utils/umbrella';
import type { WeatherForecast, WeatherSource } from '../types/weather';

interface Props {
  forecast: WeatherForecast | null;
  source: WeatherSource;
  loading: boolean;
  error: string | null;
}

// Compact weather card shown at the top of "Aprop meu": sky icon + current
// temperature + the "do I need an umbrella?" verdict (the prominent bit).
// Tapping it expands the next-24h hourly strip. Degrades quietly: never blocks
// the rest of Aprop meu if the forecast is unavailable.
export function WeatherSummary({ forecast, source, loading, error }: Props) {
  const [open, setOpen] = useState(false);

  if (!forecast) {
    if (loading) {
      return <div className="weather-card weather-card--skeleton" aria-hidden="true" />;
    }
    if (error) {
      return <div className="weather-card weather-card--error">Temps no disponible</div>;
    }
    return null;
  }

  const cond = describeWeather(forecast.now.code);
  const verdict = umbrellaVerdict(forecast);

  return (
    <div className={`weather-card${verdict.needed ? ' weather-card--rain' : ''}`}>
      <button
        type="button"
        className="weather-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="weather-icon" aria-hidden="true">
          {cond.icon}
        </span>
        <span className="weather-temp">{Math.round(forecast.now.temp)}°</span>
        <span className="weather-verdict">
          <span className="weather-verdict-main">{verdict.message}</span>
          {verdict.detail && (
            <span className="weather-verdict-detail">{verdict.detail}</span>
          )}
          {source === 'barcelona' && (
            <span className="weather-loc-note">Barcelona</span>
          )}
        </span>
        <svg
          className={`weather-chevron${open ? ' open' : ''}`}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <>
          <WeatherHourly hours={forecast.hours} />
          <div className="weather-attribution">Dades meteorològiques: Open‑Meteo</div>
        </>
      )}
    </div>
  );
}
