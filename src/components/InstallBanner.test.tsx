import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InstallBanner } from './InstallBanner';

const mocks = vi.hoisted(() => ({
  isStandalone: vi.fn(() => false),
  isIOS: vi.fn(() => false),
  canInstall: true,
  promptInstall: vi.fn(async () => 'accepted' as const),
}));

vi.mock('../hooks/useDisplayMode', () => ({
  isStandalone: mocks.isStandalone,
  isIOS: mocks.isIOS,
}));

vi.mock('../hooks/useInstallPrompt', () => ({
  useInstallPrompt: () => ({
    canInstall: mocks.canInstall,
    promptInstall: mocks.promptInstall,
  }),
}));

describe('InstallBanner', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mocks.isStandalone.mockReturnValue(false);
    mocks.isIOS.mockReturnValue(false);
    mocks.canInstall = true;
  });
  afterEach(cleanup);

  it('renders nothing when already installed (standalone)', () => {
    mocks.isStandalone.mockReturnValue(true);
    const { container } = render(<InstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while a recent dismissal is still valid', () => {
    window.localStorage.setItem('tmb-install-dismissed-v1', String(Date.now()));
    const { container } = render(<InstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the banner on Android and remembers dismissal', () => {
    render(<InstallBanner />);
    expect(screen.getByText('Instal·la')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ara no'));
    const ts = Number(window.localStorage.getItem('tmb-install-dismissed-v1'));
    expect(ts).toBeGreaterThan(0);
    expect(Date.now() - ts).toBeLessThan(5000);
    expect(screen.queryByText('Instal·la')).not.toBeInTheDocument();
  });

  it('re-shows the banner once the dismissal is older than a day', () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem('tmb-install-dismissed-v1', String(twoDaysAgo));
    render(<InstallBanner />);
    expect(screen.getByText('Instal·la')).toBeInTheDocument();
  });

  it('opens the iOS instructions sheet instead of a native prompt', () => {
    mocks.isIOS.mockReturnValue(true);
    mocks.canInstall = false; // iOS never fires beforeinstallprompt
    render(<InstallBanner />);
    fireEvent.click(screen.getByText('Instal·la'));
    expect(
      screen.getByText("Afegeix-la a la pantalla d'inici"),
    ).toBeInTheDocument();
    expect(mocks.promptInstall).not.toHaveBeenCalled();
  });
});
