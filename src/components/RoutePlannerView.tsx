import { useEffect, useMemo, useState } from 'react';
import { PlannerEmptyState } from './PlannerEmptyState';
import { RoutePlanMap } from './RoutePlanMap';
import { RoutePlanTabs } from './RoutePlanTabs';
import { RouteSearchForm } from './RouteSearchForm';
import { useCooltraVehicles } from '../hooks/useCooltraVehicles';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePlannerHistory } from '../hooks/usePlannerHistory';
import { usePlannerModes } from '../hooks/usePlannerModes';
import { useRoutePlan } from '../hooks/useRoutePlan';
import { haversine } from '../utils/distance';
import type { GeocodeResult } from '../types/geocode';
import type { Itinerary } from '../types/planner';

const SAME_PLACE_METERS = 50;
const COOLTRA_RADIUS_METERS = 200;
const PLANNER_SEED_KEY = 'tmb-planner-seed-v1';

interface SeedDestination {
  name: string;
  lat: number;
  lng: number;
}

function readPlannerSeed(): SeedDestination | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(PLANNER_SEED_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PLANNER_SEED_KEY);
    const parsed = JSON.parse(raw) as SeedDestination;
    if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

interface SearchSnapshot {
  originId: string;
  destinationId: string;
  metro: boolean;
  bus: boolean;
}

export function RoutePlannerView() {
  const { position, status: geoStatus } = useGeolocation(true);
  const [origin, setOrigin] = useState<GeocodeResult | null>(null);
  const [destination, setDestination] = useState<GeocodeResult | null>(null);
  const [activeItineraryIdx, setActiveItineraryIdx] = useState(0);
  const [lastSearch, setLastSearch] = useState<SearchSnapshot | null>(null);

  const history = usePlannerHistory();
  const modes = usePlannerModes();
  const plan = useRoutePlan();
  const { vehicles: cooltraVehicles } = useCooltraVehicles(true);

  // GPS auto-fill for origin once we have a position
  useEffect(() => {
    if (origin) return;
    if (!position) return;
    setOrigin({
      id: 'gps',
      name: 'La meva ubicació',
      sub: '',
      lat: position.lat,
      lng: position.lng,
      category: 'place',
    });
  }, [position, origin]);

  // Consume "Ruta fins aquí" seed from other views once
  useEffect(() => {
    const seed = readPlannerSeed();
    if (!seed) return;
    setDestination({
      id: `seed-${seed.lat.toFixed(5)}-${seed.lng.toFixed(5)}`,
      name: seed.name,
      sub: '',
      lat: seed.lat,
      lng: seed.lng,
      category: 'transit',
    });
  }, []);

  const samePlace = useMemo(() => {
    if (!origin || !destination) return false;
    return (
      haversine(
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
      ) < SAME_PLACE_METERS
    );
  }, [origin, destination]);

  const canSearch = !!origin && !!destination && !samePlace;

  const handleSearch = () => {
    if (!canSearch || !origin || !destination) return;
    history.add({
      name: destination.name,
      sub: destination.sub,
      lat: destination.lat,
      lng: destination.lng,
    });
    setActiveItineraryIdx(0);
    setLastSearch({
      originId: origin.id,
      destinationId: destination.id,
      metro: modes.metro,
      bus: modes.bus,
    });
    plan.trigger({
      fromLat: origin.lat,
      fromLon: origin.lng,
      toLat: destination.lat,
      toLon: destination.lng,
      transitModes: [
        ...(modes.metro ? (['SUBWAY'] as const) : []),
        ...(modes.bus ? (['BUS'] as const) : []),
      ],
    });
  };

  // Hide the Search button while the currently-shown result still matches the
  // form. The moment the user edits anything, the button reappears so they
  // can re-run the search.
  const resultFresh = useMemo(() => {
    if (!lastSearch || !plan.data || !origin || !destination) return false;
    return (
      lastSearch.originId === origin.id &&
      lastSearch.destinationId === destination.id &&
      lastSearch.metro === modes.metro &&
      lastSearch.bus === modes.bus
    );
  }, [lastSearch, plan.data, origin, destination, modes.metro, modes.bus]);

  // Auto-search when both endpoints are populated via seed and GPS arrives
  useEffect(() => {
    if (canSearch && !plan.data && !plan.loading && destination?.id?.startsWith('seed-')) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSearch, destination]);

  const itineraries: Itinerary[] = plan.data?.itineraries ?? [];
  const activeItinerary = itineraries[activeItineraryIdx] ?? null;

  // Cooltra vehicles within 200m of the destination (last-mile)
  const cooltraNearDest = useMemo(() => {
    if (!destination) return [];
    return cooltraVehicles.filter((v) => {
      if (!Array.isArray(v.position)) return false;
      const [lng, lat] = v.position;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
      const distM = haversine(
        { lat: destination.lat, lng: destination.lng },
        { lat, lng },
      );
      return distM <= COOLTRA_RADIUS_METERS;
    });
  }, [cooltraVehicles, destination]);

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const noGps = geoStatus === 'denied' || geoStatus === 'unavailable';

  return (
    <main className="app-main planner-main">
      <aside className="panel planner-panel">
        <RouteSearchForm
          origin={origin}
          destination={destination}
          onOriginChange={setOrigin}
          onDestinationChange={setDestination}
          onSwap={handleSwap}
          modes={modes}
          history={history.list}
          onSearch={handleSearch}
          canSearch={canSearch}
          noGps={noGps}
          samePlace={samePlace}
          hideSearchButton={resultFresh}
        />
        {itineraries.length > 0 && (
          <RoutePlanTabs
            itineraries={itineraries}
            activeIdx={activeItineraryIdx}
            onSelect={setActiveItineraryIdx}
          />
        )}
      </aside>
      <section className="map-area" aria-label="Mapa del trajecte">
        {plan.loading ? (
          <PlannerEmptyState kind="loading" />
        ) : plan.error ? (
          <PlannerEmptyState kind="error" message={plan.error} onRetry={handleSearch} />
        ) : itineraries.length === 0 && plan.data ? (
          <PlannerEmptyState kind="no-route" />
        ) : activeItinerary ? (
          <RoutePlanMap
            origin={origin}
            destination={destination}
            itinerary={activeItinerary}
            cooltraVehiclesNearDest={cooltraNearDest}
          />
        ) : (
          <PlannerEmptyState kind="idle" />
        )}
      </section>
    </main>
  );
}
