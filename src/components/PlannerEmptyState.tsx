interface Props {
  kind: 'idle' | 'loading' | 'no-route' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function PlannerEmptyState({ kind, message, onRetry }: Props) {
  if (kind === 'idle') {
    return (
      <div className="planner-empty">
        <div className="planner-empty__icon" aria-hidden="true">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l18-8-8 18-2-8z" />
          </svg>
        </div>
        <div className="planner-empty__title">A on vols anar?</div>
        <div className="planner-empty__sub">
          Tria un destí i et calcularem com arribar-hi en metro o bus.
        </div>
      </div>
    );
  }
  if (kind === 'loading') {
    return (
      <div className="planner-empty">
        <div className="planner-empty__spinner" aria-hidden="true" />
        <div className="planner-empty__title">Buscant rutes…</div>
      </div>
    );
  }
  if (kind === 'no-route') {
    return (
      <div className="planner-empty">
        <div className="planner-empty__title">No hi ha cap ruta</div>
        <div className="planner-empty__sub">
          Prova a activar Metro i Bus o tria un destí més proper.
        </div>
      </div>
    );
  }
  return (
    <div className="planner-empty">
      <div className="planner-empty__title">No s'ha pogut calcular la ruta</div>
      {message && <div className="planner-empty__sub">{message}</div>}
      {onRetry && (
        <button type="button" className="planner-empty__retry" onClick={onRetry}>
          Tornar a provar
        </button>
      )}
    </div>
  );
}
