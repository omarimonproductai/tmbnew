import type { Itinerary, Leg, LegMode } from '../types/planner';

interface Props {
  itinerary: Itinerary;
}

const FALLBACK_COLOR: Record<LegMode, string> = {
  WALK: '#888888',
  BUS: '#E84E0F',
  METRO: '#FF3300',
  SUBWAY: '#FF3300',
  TRAM: '#1d7df2',
  RAIL: '#444444',
};

function legColor(leg: Leg): string {
  if (leg.routeColor) {
    return leg.routeColor.startsWith('#') ? leg.routeColor : `#${leg.routeColor}`;
  }
  return FALLBACK_COLOR[leg.mode] ?? '#666666';
}

function modeLabel(mode: LegMode): string {
  switch (mode) {
    case 'METRO':
    case 'SUBWAY':
      return 'Metro';
    case 'BUS':
      return 'Bus';
    case 'TRAM':
      return 'Tram';
    case 'RAIL':
      return 'Tren';
    default:
      return 'A peu';
  }
}

function formatMinutes(seconds: number): string {
  const m = Math.max(1, Math.round(seconds / 60));
  return `${m} min`;
}

function formatMeters(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function LegIcon({ leg }: { leg: Leg }) {
  if (leg.mode === 'WALK') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="13" cy="4" r="2" />
        <path d="M7 22l2-7-3-3 4-5 4 5 3 1" />
        <path d="M11 15l4 7" />
      </svg>
    );
  }
  if (leg.mode === 'BUS') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="4" y="3" width="16" height="14" rx="3" />
        <line x1="4" y1="11" x2="20" y2="11" />
        <circle cx="8" cy="19" r="1.5" />
        <circle cx="16" cy="19" r="1.5" />
      </svg>
    );
  }
  // metro / subway / tram / rail
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4 Q4 2 6 2 L18 2 Q22 2 22 7 Q22 14 18 14 L6 14 Q4 14 4 12 Z" />
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

export function RoutePlanListView({ itinerary }: Props) {
  return (
    <div className="planner-list">
      {itinerary.legs.map((leg, idx) => {
        const color = legColor(leg);
        const isTransit = leg.mode !== 'WALK';
        return (
          <div key={idx} className="planner-list-item">
            <div className="planner-list-icon" style={{ background: color }}>
              <LegIcon leg={leg} />
            </div>
            <div className="planner-list-body">
              {isTransit ? (
                <>
                  <div className="planner-list-head">
                    {leg.routeShortName && (
                      <span
                        className="planner-list-badge"
                        style={{ background: color }}
                      >
                        {leg.routeShortName}
                      </span>
                    )}
                    <span className="planner-list-mode">
                      {modeLabel(leg.mode)}
                      {leg.headsign && ` cap a ${leg.headsign}`}
                    </span>
                  </div>
                  <div className="planner-list-stops">
                    <div><strong>Puja:</strong> {leg.from.name}</div>
                    <div><strong>Baixa:</strong> {leg.to.name}</div>
                  </div>
                  <div className="planner-list-meta">
                    {formatMinutes(leg.duration)}
                    {(leg.intermediateStops?.length ?? 0) > 0 && (
                      <> · {leg.intermediateStops!.length + 1} parades</>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="planner-list-head">
                    <span className="planner-list-mode">A peu fins a {leg.to.name}</span>
                  </div>
                  <div className="planner-list-meta">
                    {formatMinutes(leg.duration)} · {formatMeters(leg.distance)}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
