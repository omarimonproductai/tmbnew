// WMO weather-code → icon + Catalan label. Open-Meteo encodes the sky state
// as a WMO code (https://open-meteo.com/en/docs). Emoji icons keep v1 simple
// (they don't sit on the red bar, so the "monochrome only" rule doesn't apply).

export interface WeatherCondition {
  icon: string; // emoji
  label: string; // Catalan
}

const TABLE: Record<number, WeatherCondition> = {
  0: { icon: '☀️', label: 'Cel serè' },
  1: { icon: '🌤️', label: 'Majoritàriament serè' },
  2: { icon: '⛅', label: 'Parcialment ennuvolat' },
  3: { icon: '☁️', label: 'Ennuvolat' },
  45: { icon: '🌫️', label: 'Boira' },
  48: { icon: '🌫️', label: 'Boira amb gebre' },
  51: { icon: '🌦️', label: 'Plugim feble' },
  53: { icon: '🌦️', label: 'Plugim' },
  55: { icon: '🌦️', label: 'Plugim intens' },
  56: { icon: '🌧️', label: 'Plugim gelant' },
  57: { icon: '🌧️', label: 'Plugim gelant intens' },
  61: { icon: '🌧️', label: 'Pluja feble' },
  63: { icon: '🌧️', label: 'Pluja' },
  65: { icon: '🌧️', label: 'Pluja forta' },
  66: { icon: '🌧️', label: 'Pluja gelant' },
  67: { icon: '🌧️', label: 'Pluja gelant forta' },
  71: { icon: '🌨️', label: 'Nevada feble' },
  73: { icon: '🌨️', label: 'Nevada' },
  75: { icon: '🌨️', label: 'Nevada forta' },
  77: { icon: '🌨️', label: 'Calamarsa de neu' },
  80: { icon: '🌦️', label: 'Ruixats febles' },
  81: { icon: '🌧️', label: 'Ruixats' },
  82: { icon: '⛈️', label: 'Ruixats forts' },
  85: { icon: '🌨️', label: 'Ruixats de neu' },
  86: { icon: '🌨️', label: 'Ruixats de neu forts' },
  95: { icon: '⛈️', label: 'Tempesta' },
  96: { icon: '⛈️', label: 'Tempesta amb calamarsa' },
  99: { icon: '⛈️', label: 'Tempesta amb calamarsa forta' },
};

const UNKNOWN: WeatherCondition = { icon: '🌡️', label: 'Temps' };

export function describeWeather(code: number): WeatherCondition {
  return TABLE[code] ?? UNKNOWN;
}

// True for codes that mean liquid precipitation (drizzle, rain, rain showers,
// thunderstorm). Used to flag "raining now" from the current weather code.
export function isRainyCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  );
}
