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

// Compact weather chip overlaid on the top-left of the Aprop meu map: sky icon
// + current temperature, so it doesn't steal any height from the list. Tapping
// it opens the panel with the "do I need an umbrella?" verdict and the
// next-24h hourly strip. Degrades quietly: shows nothing on error so it never
// clutters the map or blocks Aprop meu.
export function WeatherSummary({ forecast, source, loading, error }: Props) {
  const [open, setOpen] = useState(false);

  if (!forecast) {
    if (loading) {
      return <div className="weather-chip weather-chip--skeleton" aria-hidden="true" />;
    }
    if (error) return null;
    return null;
  }

  const cond = describeWeather(forecast.now.code);
  const verdict = umbrellaVerdict(forecast);
  const temp = Math.round(forecast.now.temp);

  return (
    <div className="weather-widget">
      <button
        type="button"
        className={`weather-chip${verdict.needed ? ' weather-chip--rain' : ''}`}
        aria-expanded={open}
        aria-label={`Temps: ${temp} graus, ${verdict.message}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="weather-chip-icon" aria-hidden="true">
          {cond.icon}
        </span>
        <span className="weather-chip-temp">{temp}°</span>
      </button>
      {open && (
        <div className="weather-panel" role="dialog" aria-label="Previsió del temps">
          <div className="weather-panel-head">
            <span className="weather-icon" aria-hidden="true">
              {cond.icon}
            </span>
            <span className="weather-panel-temp">{temp}°</span>
            <span className="weather-verdict">
              <span className="weather-verdict-main">{verdict.message}</span>
              {verdict.detail && (
                <span className="weather-verdict-detail">{verdict.detail}</span>
              )}
              {source === 'barcelona' && (
                <span className="weather-loc-note">Barcelona</span>
              )}
            </span>
          </div>
          <WeatherHourly hours={forecast.hours} />
          <div className="weather-attribution">Dades meteorològiques: Open‑Meteo</div>
        </div>
      )}
    </div>
  );
}
