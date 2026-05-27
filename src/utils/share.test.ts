import { describe, expect, it } from 'vitest';
import { buildParadaUrl } from './share';

describe('buildParadaUrl', () => {
  it('puts the stop id in the ?parada= query param', () => {
    expect(buildParadaUrl('bus-7-1234-A-3')).toContain('?parada=bus-7-1234-A-3');
  });

  it('url-encodes special characters', () => {
    expect(buildParadaUrl('a b/c')).toContain('parada=a+b%2Fc');
  });
});
