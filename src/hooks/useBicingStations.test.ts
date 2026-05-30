import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBicingStations } from './useBicingStations';
import type { BicingStation } from '../types/bicing';

const sample: BicingStation[] = [
  {
    id: '1',
    name: 'Test',
    lat: 41.4,
    lng: 2.1,
    capacity: 20,
    bikesElectric: 3,
    bikesMechanical: 2,
    docksAvailable: 15,
    docksElectric: 15,
    docksMechanical: 15,
    status: 'operativa',
    lastReported: 0,
  },
];

vi.mock('../services/bicing', () => ({
  getBicingStations: vi.fn(),
}));

import { getBicingStations } from '../services/bicing';

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('useBicingStations', () => {
  it('fetches and exposes stations when enabled', async () => {
    vi.mocked(getBicingStations).mockResolvedValue(sample);
    const { result } = renderHook(() => useBicingStations(true));
    await waitFor(() => expect(result.current.stations).toHaveLength(1));
    expect(result.current.stations[0].id).toBe('1');
    expect(result.current.error).toBeNull();
  });

  it('records a failure and keeps the cached fallback', async () => {
    window.localStorage.setItem('tmb-bicing-stations-v1', JSON.stringify(sample));
    vi.mocked(getBicingStations).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useBicingStations(true));
    await waitFor(() => expect(result.current.lastFailureAt).not.toBeNull());
    // Falls back to the cached snapshot seeded above.
    expect(result.current.stations).toHaveLength(1);
  });

  it('does not fetch when disabled', () => {
    vi.mocked(getBicingStations).mockResolvedValue(sample);
    renderHook(() => useBicingStations(false));
    expect(getBicingStations).not.toHaveBeenCalled();
  });
});
