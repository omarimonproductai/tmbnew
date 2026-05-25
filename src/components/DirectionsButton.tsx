import { useEffect, useRef, useState } from 'react';
import {
  isAppleDevice,
  openInAppleMaps,
  openInGoogleMaps,
} from '../utils/directions';

interface Props {
  lat: number;
  lng: number;
  nom?: string;
  variant?: 'inline' | 'block';
}

export function DirectionsButton({ lat, lng, nom, variant = 'inline' }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const appleDevice = isAppleDevice();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (appleDevice) {
      setOpen((v) => !v);
    } else {
      openInGoogleMaps(lat, lng, nom);
    }
  };

  const pick = (app: 'apple' | 'google') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (app === 'apple') openInAppleMaps(lat, lng, nom);
    else openInGoogleMaps(lat, lng, nom);
  };

  return (
    <div
      ref={wrapRef}
      className={`directions-wrap directions-wrap--${variant}${open ? ' open' : ''}`}
    >
      <button
        type="button"
        className={`directions-btn directions-btn--${variant}`}
        onClick={handleClick}
        aria-haspopup={appleDevice ? 'menu' : undefined}
        aria-expanded={appleDevice ? open : undefined}
        aria-label={nom ? `Indicacions cap a ${nom}` : 'Indicacions'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        <span>Indicacions</span>
      </button>
      {appleDevice && open && (
        <div className="directions-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            className="directions-menu-item"
            onClick={pick('apple')}
          >
            Apple Maps
          </button>
          <button
            type="button"
            role="menuitem"
            className="directions-menu-item"
            onClick={pick('google')}
          >
            Google Maps
          </button>
        </div>
      )}
    </div>
  );
}
