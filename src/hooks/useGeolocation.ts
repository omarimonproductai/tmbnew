import { useCallback, useEffect, useState } from 'react';
import type { Coordinate } from '../types/tmb';

export type GeoStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

interface UseGeolocationResult {
  position: Coordinate | null;
  accuracy: number | null;
  status: GeoStatus;
  error: string | null;
  refresh: () => void;
}

export function useGeolocation(autoRequest = true): UseGeolocationResult {
  const [position, setPosition] = useState<Coordinate | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      setError('Geolocalització no disponible al navegador.');
      return;
    }
    setStatus('requesting');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setStatus('granted');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          setError("Cal permís d'ubicació per a aquest mode.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus('unavailable');
          setError('No s’ha pogut obtenir la posició.');
        } else if (err.code === err.TIMEOUT) {
          setStatus('unavailable');
          setError('S’ha esgotat el temps per obtenir la posició.');
        } else {
          setStatus('unavailable');
          setError(err.message);
        }
      },
      // Force a fresh fix when the user explicitly asks for it.
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }, []);

  // Poll the position every few seconds so the user dot tracks movement
  // without needing to tap "Actualitzar". We poll instead of using
  // watchPosition because iOS Safari (especially as an installed PWA)
  // sometimes stops firing watch updates silently.
  useEffect(() => {
    if (!autoRequest) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      setError('Geolocalització no disponible al navegador.');
      return;
    }
    setStatus('requesting');
    let cancelled = false;
    const fetchPos = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAccuracy(pos.coords.accuracy);
          setStatus('granted');
          setError(null);
        },
        (err) => {
          if (cancelled) return;
          if (err.code === err.PERMISSION_DENIED) {
            setStatus('denied');
            setError("Cal permís d'ubicació per a aquest mode.");
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setStatus('unavailable');
            setError('No s’ha pogut obtenir la posició.');
          } else if (err.code === err.TIMEOUT) {
            // Don't blow up the status on a transient timeout — the next
            // poll may succeed.
          } else {
            setStatus('unavailable');
            setError(err.message);
          }
        },
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 8_000 },
      );
    };
    fetchPos();
    const interval = window.setInterval(fetchPos, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [autoRequest]);

  return { position, accuracy, status, error, refresh };
}
