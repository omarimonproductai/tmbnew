export type LegMode = 'WALK' | 'BUS' | 'METRO' | 'SUBWAY' | 'TRAM' | 'RAIL';

export interface LegEndpoint {
  name: string;
  lat: number;
  lng: number;
  stopId?: string;
}

export interface Leg {
  mode: LegMode;
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  from: LegEndpoint;
  to: LegEndpoint;
  routeShortName?: string;
  routeLongName?: string;
  headsign?: string;
  agencyName?: string;
  routeColor?: string;
  legGeometry?: string;
  intermediateStops?: LegEndpoint[];
}

export interface Itinerary {
  duration: number;
  startTime: number;
  endTime: number;
  walkTime: number;
  transitTime: number;
  waitingTime: number;
  walkDistance: number;
  transfers: number;
  legs: Leg[];
}

export interface RoutePlan {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  itineraries: Itinerary[];
}
