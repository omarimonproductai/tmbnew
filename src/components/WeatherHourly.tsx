import { describeWeather } from '../utils/weatherCode';
import { hourIsRainy } from '../utils/umbrella';
import type { WeatherHour } from '../types/weather';

function hourLabel(iso: string): string {
  const m = /T(\d{2}):/.exec(iso);
  return m ? `${m[1]}h` : '';
}

// Horizontal strip of the next ~24h. Hours likely to rain are highlighted.
export function WeatherHourly({ hours }: { hours: WeatherHour[] }) {
  return (
    <div className="weather-hourly" role="list">
      {hours.map((h) => {
        const cond = describeWeather(h.code);
        const rainy = hourIsRainy(h);
        return (
          <div
            key={h.time}
            className={`weather-hour${rainy ? ' rainy' : ''}`}
            role="listitem"
          >
            <span className="weather-hour-time">{hourLabel(h.time)}</span>
            <span className="weather-hour-icon" aria-hidden="true">
              {cond.icon}
            </span>
            <span className="weather-hour-temp">{Math.round(h.temp)}°</span>
            <span className="weather-hour-pop">{h.precipProbability}%</span>
          </div>
        );
      })}
    </div>
  );
}
