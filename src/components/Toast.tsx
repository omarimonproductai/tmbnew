import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  message: string;
  // Triggers the parent to clear the toast. Called after timeout or on
  // the user's tap.
  onDismiss: () => void;
  durationMs?: number;
  tone?: 'info' | 'warning' | 'error';
}

export function Toast({
  message,
  onDismiss,
  durationMs = 4000,
  tone = 'warning',
}: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [onDismiss, durationMs]);

  return createPortal(
    <div className={`toast toast--${tone}`} role="status" aria-live="polite">
      <button
        type="button"
        className="toast-inner"
        onClick={onDismiss}
        aria-label="Tancar avís"
      >
        {message}
      </button>
    </div>,
    document.body,
  );
}
