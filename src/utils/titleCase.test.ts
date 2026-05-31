import { describe, expect, it } from 'vitest';
import { titleCaseName } from './titleCase';

describe('titleCaseName', () => {
  it('title-cases an all-caps street name', () => {
    expect(titleCaseName('C/ VILLAR, 2')).toBe('C/ Villar, 2');
  });

  it('keeps Catalan connectors lowercase (except first word)', () => {
    expect(titleCaseName('CARRER DE LA MARINA')).toBe('Carrer de la Marina');
    expect(titleCaseName('PG. MARÍTIM')).toBe('Pg. Marítim');
  });

  it('capitalizes after an apostrophe', () => {
    expect(titleCaseName("AV. DE L'ESTATUT")).toBe("Av. de l'Estatut");
  });

  it('is stable on already-cased and empty input', () => {
    expect(titleCaseName('Provença')).toBe('Provença');
    expect(titleCaseName('')).toBe('');
  });
});
