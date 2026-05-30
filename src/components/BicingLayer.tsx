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
  // The favourites map already implies everything is a favourite, so the gold
  // star overlay is redundant there.
  showFavStar?: boolean;
}

// SQUARE markers (so Bicing reads instantly apart from the round TMB/Cooltra
// dots). In "agafar" mode the square is split — green = electric bikes, yellow
// = mechanical bikes — but collapses to a single colour when one type is 0, so
// zeros never clutter the map. In "retornar" mode it's a single square
// coloured by the chosen type, showing the free docks for that type.
function soloIcon(color: string, value: number, fav: boolean): L.DivIcon {
  return L.divIcon({
    className: `bicing-sq-icon${fav ? ' is-fav' : ''}`,
    html: `<span class="bicing-sq bicing-sq--solo" style="background:${color}">${value}</span>`,
    iconSize: [26, 24],
    iconAnchor: [13, 12],
    popupAnchor: [0, -12],
  });
}

function stationIcon(s: BicingStation, filter: BicingFilterState, fav: boolean): L.DivIcon {
  if (filter.action === 'retornar') {
    const docks = filter.type === 'electric' ? s.docksElectric : s.docksMechanical;
    return soloIcon(BICING_TYPE_COLOR[filter.type], docks, fav);
  }
  const e = s.bikesElectric;
  const m = s.bikesMechanical;
  if (e > 0 && m > 0) {
    return L.divIcon({
      className: `bicing-sq-icon${fav ? ' is-fav' : ''}`,
      html:
        `<span class="bicing-sq bicing-sq--split">` +
        `<span class="bicing-sq__half bicing-sq__e">${e}</span>` +
        `<span class="bicing-sq__half bicing-sq__m">${m}</span>` +
        `</span>`,
      iconSize: [42, 24],
      iconAnchor: [21, 12],
      popupAnchor: [0, -12],
    });
  }
  // Only one type available → single-colour square (no "0").
  return e > 0
    ? soloIcon(BICING_TYPE_COLOR.electric, e, fav)
    : soloIcon(BICING_TYPE_COLOR.mecanic, m, fav);
}

export function BicingLayer({ stations, filter, origin = null, showFavStar = true }: Props) {
  return (
    <>
      {stations.map((s) => (
        <BicingStationMarker
          key={s.id}
          station={s}
          filter={filter}
          origin={origin}
          showFavStar={showFavStar}
        />
      ))}
    </>
  );
}

function BicingStationMarker({
  station,
  filter,
  origin,
  showFavStar,
}: {
  station: BicingStation;
  filter: BicingFilterState;
  origin: Coordinate | null;
  showFavStar: boolean;
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
      {fav && showFavStar && (
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
