import { useTempsReal } from '../hooks/useTempsReal';
import type { Linia, Parada } from '../types/tmb';

interface Props {
  linia: Linia;
  parada: Parada;
  enabled: boolean;
}

export function StopPopup({ linia, parada, enabled }: Props) {
  const { data, loading, error } = useTempsReal(linia.codi, parada.codi, enabled);

  return (
    <div className="stop-popup-content">
      <div className="popup-title">{parada.nom}</div>
      <div>
        <span className="popup-badge" style={{ background: linia.color }}>
          {linia.codi}
        </span>
      </div>
      {linia.tipus === 'bus' ? (
        <TempsRealBlock loading={loading} error={error} data={data} />
      ) : (
        <div className="popup-note">
          Temps real no disponible per a {labelTipus(linia.tipus)}.
        </div>
      )}
    </div>
  );
}

function labelTipus(t: Linia['tipus']) {
  switch (t) {
    case 'metro':
      return 'metro';
    case 'tramvia':
      return 'tramvia';
    case 'fgc':
      return 'FGC';
    case 'rodalies':
      return 'Rodalies';
    default:
      return 'aquest mode';
  }
}

function TempsRealBlock({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: string | null;
  data: ReturnType<typeof useTempsReal>['data'];
}) {
  if (loading && !data) return <div className="popup-loading">Consultant temps real…</div>;
  if (error) return <div className="popup-error">Temps real no disponible.</div>;
  if (!data) return null;
  if (!data.disponible || data.arribades.length === 0) {
    return <div className="popup-note">{data.missatge ?? 'Sense informació de temps real.'}</div>;
  }
  return (
    <ul className="popup-arrivals">
      {data.arribades.slice(0, 4).map((a, idx) => (
        <li key={idx}>
          <span className="popup-dest">{a.destinacio || '—'}</span>
          <span className="popup-time">{a.text}</span>
        </li>
      ))}
    </ul>
  );
}
