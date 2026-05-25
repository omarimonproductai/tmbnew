import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  isAppleDevice,
  openInAppleMaps,
  openInGoogleMaps,
} from '../utils/directions';

interface Props {
  lat: number;
  lng: number;
  nom?: string;
  variant?: 'icon' | 'block';
}

function NavIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22 2L2 9.27l8.18 2.55L12.73 22 22 2z" />
    </svg>
  );
}

export function DirectionsButton({ lat, lng, nom, variant = 'icon' }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const appleDevice = isAppleDevice();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (appleDevice) {
      setSheetOpen(true);
    } else {
      openInGoogleMaps(lat, lng, nom);
    }
  };

  const pick = (app: 'apple' | 'google') => () => {
    setSheetOpen(false);
    if (app === 'apple') openInAppleMaps(lat, lng, nom);
    else openInGoogleMaps(lat, lng, nom);
  };

  return (
    <>
      <button
        type="button"
        className={`dir-btn dir-btn--${variant}`}
        onClick={handleClick}
        aria-haspopup={appleDevice ? 'dialog' : undefined}
        aria-label={nom ? `Indicacions cap a ${nom}` : 'Indicacions'}
        title="Indicacions"
      >
        <NavIcon size={variant === 'block' ? 16 : 18} />
        {variant === 'block' && <span>Com arribar-hi</span>}
      </button>
      {sheetOpen && (
        <DirectionsSheet
          nom={nom}
          onPick={pick}
          onCancel={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}

function DirectionsSheet({
  nom,
  onPick,
  onCancel,
}: {
  nom?: string;
  onPick: (app: 'apple' | 'google') => () => void;
  onCancel: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return createPortal(
    <div className="dir-backdrop" onClick={onCancel} role="presentation">
      <div
        ref={sheetRef}
        className="dir-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Tria d'app de mapes"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dir-sheet-head">
          <div className="dir-sheet-title">Com arribar-hi</div>
          {nom && <div className="dir-sheet-sub">{nom}</div>}
        </div>
        <div className="dir-sheet-group">
          <button
            type="button"
            className="dir-sheet-item"
            onClick={onPick('apple')}
          >
            Apple Maps
          </button>
          <div className="dir-sheet-sep" />
          <button
            type="button"
            className="dir-sheet-item"
            onClick={onPick('google')}
          >
            Google Maps
          </button>
        </div>
        <button
          type="button"
          className="dir-sheet-cancel"
          onClick={onCancel}
        >
          Cancel·la
        </button>
      </div>
    </div>,
    document.body,
  );
}
