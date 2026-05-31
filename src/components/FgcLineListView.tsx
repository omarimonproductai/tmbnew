import { useState } from 'react';
import { useFgcArribades } from '../hooks/useFgcArribades';
import { fgcLineColor } from '../utils/fgc';
import type { FgcArribada, FgcLiniaDetall, FgcParadaOrdenada } from '../types/fgc';
import type { FgcLinia } from '../types/fgc';

// FGC stop list — mirrors TMB's LineListView/StopRow (same classes/markup) so
// the design is identical: numbered stops, coloured connection badges, a
// chevron that expands the live arrivals for that stop.
export function FgcLineListView({
  detall,
  sentit = 'forward',
}: {
  detall: FgcLiniaDetall;
  sentit?: 'forward' | 'backward';
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  // The two directions are the stop list and its reverse (same idea as TMB's
  // synthesised metro directions).
  const parades =
    sentit === 'backward' ? [...detall.parades].reverse() : detall.parades;
  const desti = parades[parades.length - 1]?.nom ?? detall.linia.nom;
  return (
    <div className="line-list-view fgc-line-listview">
      <div className="list-columns">
        <div className="list-column active">
          <div className="list-column-head" style={{ borderTopColor: detall.linia.color }}>
            → {desti}
          </div>
          <div className="list-column-rows">
            {parades.map((p, idx) => (
              <FgcStopRow
                key={p.id}
                parada={p}
                ordre={idx + 1}
                linia={detall.linia}
                expanded={expanded === p.id}
                onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FgcStopRow({
  parada,
  ordre,
  linia,
  expanded,
  onToggle,
}: {
  parada: FgcParadaOrdenada;
  ordre: number;
  linia: FgcLinia;
  expanded: boolean;
  onToggle: () => void;
}) {
  // Connections = the other FGC lines stopping here (like TMB correspondences).
  const corresp = parada.liniesQueParen.filter((c) => c !== linia.codi);
  return (
    <div
      className={`stop-row${expanded ? ' expanded' : ''}`}
      style={expanded ? { borderLeftColor: linia.color } : undefined}
    >
      <button
        type="button"
        className="stop-row-main"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span className="stop-row-ordre">{ordre}</span>
        <div className="stop-row-info">
          <div className="stop-row-name" title={parada.nom}>
            {parada.nom}
          </div>
          {corresp.length > 0 && (
            <div className="stop-row-corresp">
              {corresp.slice(0, 4).map((c) => (
                <span key={c} className="corresp-badge" style={{ background: fgcLineColor(c) }}>
                  {c}
                </span>
              ))}
              {corresp.length > 4 && (
                <span className="corresp-more">+{corresp.length - 4}</span>
              )}
            </div>
          )}
        </div>
        <span className={`stop-row-caret${expanded ? ' open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {expanded && <FgcStopAccordion parada={parada} linia={linia} />}
    </div>
  );
}

function FgcStopAccordion({ parada, linia }: { parada: FgcParadaOrdenada; linia: FgcLinia }) {
  const { data, loading } = useFgcArribades(parada.codi, true);
  if (loading && !data) return <div className="acc-loading">Carregant temps real…</div>;
  if (!data) return null;
  if (!data.disponible || data.arribades.length === 0) {
    return <div className="acc-empty">Sense trens propers ara mateix.</div>;
  }
  const byDest = new Map<string, FgcArribada[]>();
  for (const a of data.arribades.slice(0, 12)) {
    const k = a.destinacio || '—';
    const list = byDest.get(k) ?? [];
    list.push(a);
    byDest.set(k, list);
  }
  const groups = [...byDest.entries()];
  return (
    <div className="acc-groups">
      {groups.map(([dest, arribades], gi) => (
        <div key={dest} className="acc-group">
          {gi > 0 && <div className="acc-group-divider" />}
          <div className="acc-group-head">→ {dest}</div>
          <ul className="acc-arrivals">
            {arribades.map((a, idx) => (
              <li key={`${a.liniaCodi}-${idx}`}>
                <span
                  className="acc-line"
                  style={{ background: fgcLineColor(a.liniaCodi || linia.codi) }}
                >
                  {a.liniaCodi || linia.codi}
                </span>
                <span className="acc-time">{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
