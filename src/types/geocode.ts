export type GeocodeCategory = 'street' | 'house' | 'transit' | 'poi' | 'place';

export interface GeocodeResult {
  id: string;
  name: string;
  sub: string;
  lat: number;
  lng: number;
  osmType?: string;
  osmKey?: string;
  category?: GeocodeCategory;
}
