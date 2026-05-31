import { useEffect, useMemo, useRef, useState } from 'react';
import { StopRow } from './StopRow';
import type { Linia, LiniaResum, Parada, VehicleRaw } from '../types/tmb';

interface Props {
  linia: Linia;
  parades: Parada[];
  vehicles: VehicleRaw[];
  correspondencesPerParada: Map<string, LiniaResum[]>;
  nearestStopCodi?: string | null;
  // Direction tab can be driven from outside (the map-area ⇄ button).
  activeSentit?: string;
  onActiveSentitChange?: (sentit: string) => void;
  onColumnsChange?: (sentits: string[]) => void;
}

interface Column {
  sentit: string;
  parades: Parada[];
  destinacio: string;
  // synthetic = derived from line order (metro) rather than parada.sentit.
  // Means the SAME paradaCodi appears in both columns, so we filter vehicles
  // by destination instead of by stop code.
  synthetic: boolean;
}

export function LineListView({
  linia,
  parades,
  vehicles,
  correspondencesPerParada,
  nearestStopCodi,
  activeSentit: activeSentitProp,
  onActiveSentitChange,
  onColumnsChange,
}: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const nearestRowRef = useRef<HTMLDivElement | null>(null);

  const columns = useMemo<Column[]>(() => {
    const bySentit = new Map<string, Parada[]>();
    for (const p of parades) {
      const key = p.sentit ?? 'default';
      const list = bySentit.get(key) ?? [];
      list.push(p);
      bySentit.set(key, list);
    }
    for (const list of bySentit.values()) {
      list.sort((a, b) => a.ordre - b.ordre);
    }

    // Metro stations don't carry a sentit, so TMB returns a single group.
    // Synthesise the two directions from the line order so the user gets
    // the same dual-column layout as bus.
    if (
      linia.tipus === 'metro' &&
      bySentit.size === 1 &&
      (bySentit.has('default') || bySentit.has(''))
    ) {
      const sorted =
        bySentit.get('default') ?? bySentit.get('') ?? [];
      if (sorted.length >= 2) {
        return [
          {
            sentit: 'forward',
            parades: sorted,
            destinacio: sorted[sorted.length - 1]?.nom ?? linia.desti ?? '',
            synthetic: true,
          },
          {
            sentit: 'backward',
            parades: [...sorted].reverse(),
            destinacio: sorted[0]?.nom ?? linia.origen ?? '',
            synthetic: true,
          },
        ];
      }
    }

    return [...bySentit.entries()].map(([sentit, paradesSent]) => ({
      sentit,
      parades: paradesSent,
      destinacio: paradesSent[paradesSent.length - 1]?.nom ?? sentit,
      synthetic: false,
    }));
  }, [parades, linia]);

  const vehiclesPerColumn = useMemo<Map<string, VehicleRaw[]>[]>(() => {
    return columns.map((col) => {
      const map = new Map<string, VehicleRaw[]>();
      if (col.synthetic) {
        for (const v of vehicles) {
          if (!matchesDestination(v.destinacio, col.destinacio)) continue;
          const list = map.get(v.properaParadaCodi) ?? [];
          list.push(v);
          map.set(v.properaParadaCodi, list);
        }
      } else {
        const codisInCol = new Set(col.parades.map((p) => p.codi));
        for (const v of vehicles) {
          if (!codisInCol.has(v.properaParadaCodi)) continue;
          const list = map.get(v.properaParadaCodi) ?? [];
          list.push(v);
          map.set(v.properaParadaCodi, list);
        }
      }
      return map;
    });
  }, [columns, vehicles]);

  const [internalSentit, setInternalSentit] = useState<string>(
    columns[0]?.sentit ?? 'default',
  );
  // Controlled by the parent when it passes activeSentit; otherwise internal.
  const activeSentit = activeSentitProp ?? internalSentit;
  const setActiveSentit = (s: string) => {
    setInternalSentit(s);
    onActiveSentitChange?.(s);
  };

  // Tell the parent which directions exist (so the ⇄ button can cycle them).
  useEffect(() => {
    onColumnsChange?.(columns.map((c) => c.sentit));
  }, [columns, onColumnsChange]);

  // Stops arrive after the view mounts, so the columns (and their sentit
  // keys) change from the initial empty 'default' to the real ones. If the
  // active tab no longer matches any column, snap it to the first — without
  // this the mobile layout hides every column and the list looks empty
  // until you toggle to the map and back.
  useEffect(() => {
    if (columns.length === 0) return;
    if (!columns.some((c) => c.sentit === activeSentit)) {
      setActiveSentit(columns[0].sentit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, activeSentit]);

  // Scroll the user's nearest stop into the viewport once we know it.
  useEffect(() => {
    if (!nearestStopCodi || !nearestRowRef.current) return;
    nearestRowRef.current.scrollIntoView({
      block: 'center',
      behavior: 'smooth',
    });
  }, [nearestStopCodi, activeSentit, parades.length]);

  if (parades.length === 0) {
    return <div className="list-view-empty">Carregant parades…</div>;
  }

  return (
    <div className="line-list-view">
      {columns.length > 1 && (
        <div className="list-sentit-selector" role="tablist" aria-label="Sentit">
          {columns.map((c) => (
            <button
              key={c.sentit}
              type="button"
              role="tab"
              aria-selected={c.sentit === activeSentit}
              className={c.sentit === activeSentit ? 'active' : ''}
              onClick={() => setActiveSentit(c.sentit)}
            >
              → {c.destinacio}
            </button>
          ))}
        </div>
      )}
      <div className={`list-columns${columns.length > 1 ? ' multi' : ''}`}>
        {columns.map((col, colIdx) => (
          <div
            key={col.sentit}
            className={`list-column${col.sentit === activeSentit ? ' active' : ''}`}
          >
            <div
              className="list-column-head"
              style={{ borderTopColor: linia.color }}
            >
              → {col.destinacio}
            </div>
            <div className="list-column-rows">
              {col.parades.map((p, idx) => {
                const key = `${col.sentit}|${p.id}`;
                const isHere = !!nearestStopCodi && p.codi === nearestStopCodi;
                const isActiveColumn = col.sentit === activeSentit;
                return (
                  <StopRow
                    key={key}
                    parada={p}
                    ordre={idx + 1}
                    correspondencies={correspondencesPerParada.get(p.codi) ?? []}
                    vehiclesNext={vehiclesPerColumn[colIdx].get(p.codi) ?? []}
                    expanded={expandedKey === key}
                    onToggle={() =>
                      setExpandedKey(expandedKey === key ? null : key)
                    }
                    linia={linia}
                    isHere={isHere}
                    rowRef={isHere && isActiveColumn ? nearestRowRef : undefined}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function matchesDestination(a: string, b: string): boolean {
  const x = (a ?? '').toLowerCase().trim();
  const y = (b ?? '').toLowerCase().trim();
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  return false;
}
