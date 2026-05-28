import { useState } from 'react';
import { GeocodeDropdown } from './GeocodeDropdown';
import { PlannerModeFilters } from './PlannerModeFilters';
import { usePhotonSearch } from '../hooks/usePhotonSearch';
import type { PlannerHistoryItem } from '../hooks/usePlannerHistory';
import type { GeocodeResult } from '../types/geocode';

type FieldKey = 'origin' | 'destination';

interface ModeState {
  metro: boolean;
  bus: boolean;
  setMetro: (v: boolean) => void;
  setBus: (v: boolean) => void;
}

interface Props {
  origin: GeocodeResult | null;
  destination: GeocodeResult | null;
  onOriginChange: (r: GeocodeResult | null) => void;
  onDestinationChange: (r: GeocodeResult | null) => void;
  onSwap: () => void;
  modes: ModeState;
  history: PlannerHistoryItem[];
  onSearch: () => void;
  canSearch: boolean;
  noGps: boolean;
  samePlace: boolean;
  /** Hide the search button when we already show a stale-free result. */
  hideSearchButton?: boolean;
}

export function RouteSearchForm({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSwap,
  modes,
  history,
  onSearch,
  canSearch,
  noGps,
  samePlace,
  hideSearchButton = false,
}: Props) {
  const [focused, setFocused] = useState<FieldKey | null>(null);
  const [originDraft, setOriginDraft] = useState('');
  const [destDraft, setDestDraft] = useState('');

  const activeDraft = focused === 'origin' ? originDraft : destDraft;
  const { results, loading, error: searchError } = usePhotonSearch(activeDraft);

  const handlePick = (r: GeocodeResult) => {
    if (focused === 'origin') {
      onOriginChange(r);
      setOriginDraft('');
    } else if (focused === 'destination') {
      onDestinationChange(r);
      setDestDraft('');
    }
    setFocused(null);
  };

  const handleHistoryPick = (h: PlannerHistoryItem) => {
    const result: GeocodeResult = {
      id: `hist-${h.lat.toFixed(5)}-${h.lng.toFixed(5)}`,
      name: h.name,
      sub: h.sub,
      lat: h.lat,
      lng: h.lng,
      category: 'place',
    };
    handlePick(result);
  };

  const originLabel = focused === 'origin' && originDraft
    ? originDraft
    : origin?.name ?? '';
  const destLabel = focused === 'destination' && destDraft
    ? destDraft
    : destination?.name ?? '';

  return (
    <div className="planner-form">
      <div className="planner-field-row">
        <div className="planner-field-icons">
          <span className="planner-dot planner-dot--origin" />
          <span className="planner-dot-line" />
          <span className="planner-dot planner-dot--dest" />
        </div>
        <div className="planner-field-stack">
          <input
            type="text"
            className={`planner-field${focused === 'origin' ? ' focused' : ''}`}
            placeholder="Des d'on?"
            value={originLabel}
            onFocus={() => setFocused('origin')}
            onChange={(e) => {
              setOriginDraft(e.target.value);
              if (origin && origin.id !== 'gps') onOriginChange(null);
              else if (origin && origin.id === 'gps') onOriginChange(null);
            }}
            onBlur={() => window.setTimeout(() => setFocused((f) => (f === 'origin' ? null : f)), 150)}
          />
          <input
            type="text"
            className={`planner-field${focused === 'destination' ? ' focused' : ''}`}
            placeholder="A on vols anar?"
            value={destLabel}
            onFocus={() => setFocused('destination')}
            onChange={(e) => {
              setDestDraft(e.target.value);
              if (destination) onDestinationChange(null);
            }}
            onBlur={() => window.setTimeout(() => setFocused((f) => (f === 'destination' ? null : f)), 150)}
          />
        </div>
        <button
          type="button"
          className="planner-swap-btn"
          onClick={onSwap}
          aria-label="Intercanvia origen i destí"
          title="Intercanvia origen i destí"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 3v18M3 7l4-4 4 4" />
            <path d="M17 21V3M21 17l-4 4-4-4" />
          </svg>
        </button>
      </div>

      {focused && activeDraft.trim().length >= 3 && (
        <GeocodeDropdown
          results={results}
          onSelect={handlePick}
          loading={loading}
          error={searchError}
        />
      )}

      {focused === 'destination' && !destDraft && history.length > 0 && (
        <div className="planner-dropdown">
          <div className="planner-dropdown-head">Recents</div>
          {history.map((h) => (
            <button
              key={`${h.lat.toFixed(5)}-${h.lng.toFixed(5)}`}
              type="button"
              className="planner-drop-item"
              onClick={() => handleHistoryPick(h)}
            >
              <span className="planner-drop-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="6" x2="12" y2="12" />
                  <line x1="12" y1="12" x2="16" y2="14" />
                </svg>
              </span>
              <span className="planner-drop-text">
                <span className="planner-drop-name">{h.name}</span>
                {h.sub && <span className="planner-drop-sub">{h.sub}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <PlannerModeFilters
        metro={modes.metro}
        bus={modes.bus}
        onMetroChange={modes.setMetro}
        onBusChange={modes.setBus}
      />

      {!hideSearchButton && (
        <button
          type="button"
          className="planner-search-btn"
          onClick={onSearch}
          disabled={!canSearch}
        >
          Buscar rutes
        </button>
      )}

      {noGps && !origin && (
        <p className="planner-hint">
          Activa la geolocalització o escriu un origen.
        </p>
      )}
      {samePlace && (
        <p className="planner-hint">Ja estàs aquí.</p>
      )}
    </div>
  );
}
