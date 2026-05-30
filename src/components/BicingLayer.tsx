import L from 'leaflet';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { BicingStationPopup } from './BicingStationPopup';
import { useFavorits } from '../hooks/useFavorits';
import { favStarIcon } from '../utils/favStarIcon';
import { haversine } from '../utils/distance';
import type { BicingStation } from '../types/bicing';
import type { Coordinate } from '../types/tmb';

interface Props {
  stations: BicingStation[];
  // When provided, the popup shows the distance from this origin.
  origin?: Coordinate | null;
}

// A rounded-square red "B" badge with the total available bikes — visually
// distinct from the round TMB dots and the small Cooltra dots. Plain DivIcon
// markers in the default pane (no custom pane / no position:relative) to avoid
// the Leaflet pitfalls noted in HANDOVER.
function stationIcon(total: number, fav: boolean): L.DivIcon {
  return L.divIcon({
    className: `bicing-marker${fav ? ' is-fav' : ''}`,
    html: `<span class="bicing-marker__count">${total}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export function BicingLayer({ stations, origin = null }: Props) {
  return (
    <>
      {stations.map((s) => (
        <BicingStationMarker key={s.id} station={s} origin={origin} />
      ))}
    </>
  );
}

function BicingStationMarker({
  station,
  origin,
}: {
  station: BicingStation;
  origin: Coordinate | null;
}) {
  const { isBicingFav } = useFavorits();
  const fav = isBicingFav(station.id);
  const total = station.bikesElectric + station.bikesMechanical;
  const distanceM = origin
    ? haversine(origin, { lat: station.lat, lng: station.lng })
    : null;
  return (
    <>
      <Marker position={[station.lat, station.lng]} icon={stationIcon(total, fav)}>
        <Tooltip direction="top" offset={[0, -12]} className="stop-tooltip">
          <span className="tooltip-name">{station.name}</span>
        </Tooltip>
        <Popup autoPanPaddingTopLeft={[10, 90]}>
          <BicingStationPopup station={station} distanceM={distanceM} />
        </Popup>
      </Marker>
      {fav && (
        <Marker
          position={[station.lat, station.lng]}
          icon={favStarIcon(12)}
          interactive={false}
          keyboard={false}
        />
      )}
    </>
  );
}
