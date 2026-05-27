import { useState } from 'react';
import { createPortal } from 'react-dom';
import { isIOS, isStandalone } from '../hooks/useDisplayMode';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

const DISMISS_KEY = 'tmb-install-dismissed-v1';

function loadDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const ios = isIOS();
  const [dismissed, setDismissed] = useState(loadDismissed);
  const [iosSheet, setIosSheet] = useState(false);

  // Never nag an already-installed app or a user who said no.
  if (isStandalone() || dismissed) return null;
  // On Android/Chrome we only show once the native prompt is available.
  if (!ios && !canInstall) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // private mode / quota — ignore
    }
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (ios) {
      setIosSheet(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome !== 'unavailable') dismiss();
  };

  return (
    <>
      <div className="install-banner" role="region" aria-label="Instal·la l'app">
        <div className="install-badge" aria-hidden="true">TMB</div>
        <div className="ib-text">
          <div className="ib-title">Instal·la l'app</div>
          <div className="ib-sub">
            Accés directe des de la pantalla d'inici, a pantalla completa.
          </div>
        </div>
        <div className="ib-actions">
          <button type="button" className="btn-install" onClick={handleInstall}>
            Instal·la
          </button>
          <button type="button" className="btn-dismiss" onClick={dismiss}>
            Ara no
          </button>
        </div>
      </div>
      {iosSheet && <IOSInstructions onClose={() => setIosSheet(false)} />}
    </>
  );
}

function IOSInstructions({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="dir-backdrop" onClick={onClose} role="presentation">
      <div
        className="install-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Com instal·lar l'app a iOS"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <h3 className="install-sheet-title">Afegeix-la a la pantalla d'inici</h3>
        <p className="install-sheet-sub">
          Safari no té botó d'instal·lar. Fes-ho en dos passos:
        </p>
        <div className="install-step">
          <span className="install-step-num">1</span>
          <span className="install-step-txt">
            Toca el botó <strong>Compartir</strong>
            <span className="ios-share" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4" />
                <path d="M8 8l4-4 4 4" />
                <rect x="4" y="12" width="16" height="9" rx="2" />
              </svg>
            </span>
            a la barra de Safari.
          </span>
        </div>
        <div className="install-step">
          <span className="install-step-num">2</span>
          <span className="install-step-txt">
            Tria <strong>"Afegir a pantalla d'inici"</strong>.
          </span>
        </div>
        <button type="button" className="install-sheet-close" onClick={onClose}>
          Entesos
        </button>
      </div>
    </div>,
    document.body,
  );
}
