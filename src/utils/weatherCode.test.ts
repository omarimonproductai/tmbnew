import { describe, expect, it } from 'vitest';
import { describeWeather, isRainyCode } from './weatherCode';

describe('describeWeather', () => {
  it('maps known WMO codes to an icon + Catalan label', () => {
    expect(describeWeather(0).label).toBe('Cel serè');
    expect(describeWeather(3).label).toBe('Ennuvolat');
    expect(describeWeather(63).label).toBe('Pluja');
    expect(describeWeather(95).label).toBe('Tempesta');
    expect(describeWeather(0).icon).toBeTruthy();
  });

  it('falls back for unknown codes', () => {
    expect(describeWeather(999).label).toBe('Temps');
    expect(describeWeather(-1).icon).toBeTruthy();
  });
});

describe('isRainyCode', () => {
  it('flags drizzle, rain, showers and thunderstorm', () => {
    expect(isRainyCode(51)).toBe(true); // drizzle
    expect(isRainyCode(63)).toBe(true); // rain
    expect(isRainyCode(81)).toBe(true); // rain showers
    expect(isRainyCode(95)).toBe(true); // thunderstorm
  });

  it('does not flag clear, cloudy, fog or snow', () => {
    expect(isRainyCode(0)).toBe(false);
    expect(isRainyCode(3)).toBe(false);
    expect(isRainyCode(45)).toBe(false);
    expect(isRainyCode(71)).toBe(false); // snow
  });
});
