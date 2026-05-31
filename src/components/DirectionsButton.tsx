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

function WalkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="13.5" cy="3.5" r="2" />
      <path d="M9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
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
        aria-label={nom ? `Ruta a peu cap a ${nom} (mapes)` : 'Ruta a peu (mapes)'}
        title="A peu (Apple/Google Maps)"
      >
        <WalkIcon size={variant === 'block' ? 16 : 18} />
        {variant === 'block' && <span>A peu</span>}
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
