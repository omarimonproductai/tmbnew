import { useMemo } from 'react';
import type { Itinerary } from '../types/planner';

interface Props {
  itineraries: Itinerary[];
  activeIdx: number;
  onSelect: (idx: number) => void;
}

interface TabLabel {
  idx: number;
  primary: string;
  secondary?: string;
}

// Pick the best itinerary per criterion, dedupe if two criteria point at the
// same itinerary (combine the labels).
function buildTabs(itineraries: Itinerary[]): TabLabel[] {
  if (itineraries.length === 0) return [];

  const fastestIdx = itineraries
    .map((it, i) => ({ it, i }))
    .sort((a, b) => a.it.duration - b.it.duration)[0].i;

  const fewestTransIdx = itineraries
    .map((it, i) => ({ it, i }))
    .sort((a, b) => a.it.transfers - b.it.transfers || a.it.duration - b.it.duration)[0].i;

  const leastWalkIdx = itineraries
    .map((it, i) => ({ it, i }))
    .sort((a, b) => a.it.walkDistance - b.it.walkDistance || a.it.duration - b.it.duration)[0].i;

  // Hide "less walking" tab if the delta vs fastest is insignificant (<100m).
  const fastest = itineraries[fastestIdx];
  const leastWalk = itineraries[leastWalkIdx];
  const showLeastWalk = Math.abs(fastest.walkDistance - leastWalk.walkDistance) >= 100;

  // Build the candidate list, then merge duplicates
  const candidates: { idx: number; label: string }[] = [];
  candidates.push({ idx: fastestIdx, label: 'Més ràpida' });
  if (fewestTransIdx !== fastestIdx) {
    candidates.push({ idx: fewestTransIdx, label: 'Menys transbords' });
  } else {
    candidates[0].label += ' · menys transbords';
  }
  if (showLeastWalk) {
    const existing = candidates.find((c) => c.idx === leastWalkIdx);
    if (existing) {
      existing.label += ' · menys camí';
    } else {
      candidates.push({ idx: leastWalkIdx, label: 'Menys camí' });
    }
  }

  return candidates.map((c) => ({
    idx: c.idx,
    primary: c.label,
  }));
}

function formatMinutes(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export function RoutePlanTabs({ itineraries, activeIdx, onSelect }: Props) {
  const tabs = useMemo(() => buildTabs(itineraries), [itineraries]);
  // When all criteria collapse onto the same itinerary there is nothing to
  // choose between — drop the marketing copy and just show the duration so
  // the row reads as a result header, not a fake selector.
  const singleTab = tabs.length === 1;

  return (
    <div className={`planner-tabs${singleTab ? ' planner-tabs--single' : ''}`} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.idx}
          type="button"
          role="tab"
          aria-selected={activeIdx === tab.idx}
          className={`planner-tab${activeIdx === tab.idx ? ' active' : ''}`}
          onClick={() => onSelect(tab.idx)}
          disabled={singleTab}
        >
          <span>{singleTab ? 'Ruta' : tab.primary}</span>
          <span className="planner-tab__time">{formatMinutes(itineraries[tab.idx].duration)}</span>
        </button>
      ))}
    </div>
  );
}
