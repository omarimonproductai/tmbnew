import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInstallPrompt } from './useInstallPrompt';

function fireBeforeInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const e = new Event('beforeinstallprompt') as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  };
  e.prompt = vi.fn().mockResolvedValue(undefined);
  e.userChoice = Promise.resolve({ outcome });
  act(() => {
    window.dispatchEvent(e);
  });
  return e;
}

describe('useInstallPrompt', () => {
  it('captures the install prompt event', () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
    fireBeforeInstallPrompt();
    expect(result.current.canInstall).toBe(true);
  });

  it('returns the chosen outcome and clears the prompt', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const e = fireBeforeInstallPrompt('accepted');

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(e.prompt).toHaveBeenCalled();
    expect(outcome).toBe('accepted');
    expect(result.current.canInstall).toBe(false);
  });

  it('reports unavailable when no prompt was captured', async () => {
    const { result } = renderHook(() => useInstallPrompt());
    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });
    expect(outcome).toBe('unavailable');
  });
});
