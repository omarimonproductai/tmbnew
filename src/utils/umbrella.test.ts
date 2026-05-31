import { describe, expect, it } from 'vitest';
import { hourIsRainy, umbrellaVerdict } from './umbrella';
import type { WeatherForecast, WeatherHour } from '../types/weather';

function hour(time: string, partial: Partial<WeatherHour> = {}): WeatherHour {
  return {
    time,
    temp: 18,
    precipProbability: 0,
    precipitation: 0,
    code: 0,
    ...partial,
  };
}

function forecast(hours: WeatherHour[], nowPartial: Partial<WeatherForecast['now']> = {}): WeatherForecast {
  return {
    lat: 41.38,
    lng: 2.16,
    now: { temp: 18, code: 0, precipitation: 0, ...nowPartial },
    hours,
  };
}

describe('hourIsRainy', () => {
  it('is rainy when probability clears the threshold', () => {
    expect(hourIsRainy(hour('2026-05-31T10:00', { precipProbability: 60 }))).toBe(true);
  });
  it('is rainy when precipitation clears the threshold', () => {
    expect(hourIsRainy(hour('2026-05-31T10:00', { precipitation: 0.5 }))).toBe(true);
  });
  it('is dry when both are below thresholds', () => {
    expect(hourIsRainy(hour('2026-05-31T10:00', { precipProbability: 20, precipitation: 0 }))).toBe(false);
  });
});

describe('umbrellaVerdict', () => {
  it('says no umbrella on a dry day', () => {
    const v = umbrellaVerdict(forecast([
      hour('2026-05-31T09:00'),
      hour('2026-05-31T10:00', { precipProbability: 10 }),
      hour('2026-05-31T11:00', { precipProbability: 30 }),
    ]));
    expect(v.needed).toBe(false);
    expect(v.message).toBe('No et cal paraigua');
    expect(v.detail).toBeNull();
  });

  it('flags rain in the morning with a single-hour window', () => {
    const v = umbrellaVerdict(forecast([
      hour('2026-05-31T09:00'),
      hour('2026-05-31T10:00', { precipProbability: 70, code: 61 }),
      hour('2026-05-31T11:00', { precipProbability: 20 }),
    ]));
    expect(v.needed).toBe(true);
    expect(v.rainingNow).toBe(false);
    expect(v.message).toBe('Agafa paraigua');
    expect(v.detail).toBe('cap a les 10 h');
  });

  it('reports a range when rain spans several hours', () => {
    const v = umbrellaVerdict(forecast([
      hour('2026-05-31T16:00', { precipProbability: 55 }),
      hour('2026-05-31T17:00', { precipitation: 1.2 }),
      hour('2026-05-31T18:00', { precipProbability: 80 }),
    ]));
    expect(v.detail).toBe('de les 16 a les 18 h');
  });

  it('prioritises "raining now" from the current code', () => {
    const v = umbrellaVerdict(forecast([hour('2026-05-31T12:00')], { code: 63 }));
    expect(v.rainingNow).toBe(true);
    expect(v.message).toBe('Està plovent');
  });

  it('ignores rain beyond the look-ahead window', () => {
    // 12 dry hours, then rain in hour 13 — outside the verdict window.
    const hours: WeatherHour[] = [];
    for (let i = 0; i < 12; i++) hours.push(hour(`2026-05-31T${String(i).padStart(2, '0')}:00`));
    hours.push(hour('2026-05-31T13:00', { precipProbability: 90 }));
    const v = umbrellaVerdict(forecast(hours));
    expect(v.needed).toBe(false);
  });

  it('handles empty/partial data without throwing', () => {
    const v = umbrellaVerdict(forecast([]));
    expect(v.needed).toBe(false);
    expect(v.message).toBe('No et cal paraigua');
  });
});
