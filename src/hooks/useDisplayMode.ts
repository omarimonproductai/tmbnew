import { useEffect, useState } from 'react';

// True when the app runs as an installed PWA (standalone), either via the
// display-mode media query (Android/desktop) or navigator.standalone (iOS).
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mql = window.matchMedia?.('(display-mode: standalone)');
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(mql?.matches) || iosStandalone;
}

// iOS Safari has no beforeinstallprompt, so we detect the platform to show
// manual "Add to Home Screen" instructions instead.
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iPhoneFamily = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as desktop Mac but has touch points.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return iPhoneFamily || iPadOS;
}

export function useIsOffline(): boolean {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  return offline;
}
