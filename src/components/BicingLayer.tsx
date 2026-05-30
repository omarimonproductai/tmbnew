import L from 'leaflet';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { BicingStationPopup } from './BicingStationPopup';
import { useFavorits } from '../hooks/useFavorits';
import { favStarIcon } from '../utils/favStarIcon';
import { haversine } from '../utils/distance';
import { BICING_TYPE_COLOR, type BicingFilterState, type BicingStation } from '../types/bicing';
import type { Coordinate } from '../types/tmb';

interface Props {
  stations: BicingStation[];
  filter: BicingFilterState;
  origin?: Coordinate | null;
}

// SQUARE markers (so Bicing reads instantly apart from the round TMB/Cooltra
// dots). In "agafar" mode the square is split — green = electric bikes, yellow
// = mechanical bikes. In "retornar" mode it's a single square coloured by the
// chosen type, showing the free docks for that type.
function stationIcon(s: BicingStation, filter: BicingFilterState, fav: boolean): L.DivIcon {
  if (filter.action === 'retornar') {
    const color = BICING_TYPE_COLOR[filter.type];
    const docks = filter.type === 'electric' ? s.docksElectric : s.docksMechanical;
    return L.divIcon({
      className: `bicing-sq-icon${fav ? ' is-fav' : ''}`,
      html: `<span class="bicing-sq bicing-sq--solo" style="background:${color}">${docks}</span>`,
      iconSize: [26, 24],
      iconAnchor: [13, 12],
      popupAnchor: [0, -12],
    });
  }
  return L.divIcon({
    className: `bicing-sq-icon${fav ? ' is-fav' : ''}`,
    html:
      `<span class="bicing-sq bicing-sq--split">` +
      `<span class="bicing-sq__half bicing-sq__e">${s.bikesElectric}</span>` +
      `<span class="bicing-sq__half bicing-sq__m">${s.bikesMechanical}</span>` +
      `</span>`,
    iconSize: [42, 24],
    iconAnchor: [21, 12],
    popupAnchor: [0, -12],
  });
}

export function BicingLayer({ stations, filter, origin = null }: Props) {
  return (
    <>
      {stations.map((s) => (
        <BicingStationMarker key={s.id} station={s} filter={filter} origin={origin} />
      ))}
    </>
  );
}

function BicingStationMarker({
  station,
  filter,
  origin,
}: {
  station: BicingStation;
  filter: BicingFilterState;
  origin: Coordinate | null;
}) {
  const { isBicingFav } = useFavorits();
  const fav = isBicingFav(station.id);
  const distanceM = origin
    ? haversine(origin, { lat: station.lat, lng: station.lng })
    : null;
  return (
    <>
      <Marker position={[station.lat, station.lng]} icon={stationIcon(station, filter, fav)}>
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
