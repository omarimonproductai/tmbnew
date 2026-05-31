import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { Marker, Popup, Tooltip } from 'react-leaflet';
import { FgcStationPopup } from './FgcStationPopup';
import { useFavorits } from '../hooks/useFavorits';
import { favStarIcon } from '../utils/favStarIcon';
import { fgcStopIcon } from '../utils/fgcMarkerIcon';
import { haversine } from '../utils/distance';
import type { FgcParada } from '../types/fgc';
import type { Coordinate } from '../types/tmb';

interface Props {
  parades: FgcParada[];
  color?: string;
  origin?: Coordinate | null;
  showFavStar?: boolean;
  winkTarget?: { id: string; nonce: number } | null;
}

export function FgcLayer({
  parades,
  color,
  origin = null,
  showFavStar = true,
  winkTarget = null,
}: Props) {
  return (
    <>
      {parades.map((p) => (
        <FgcStopMarker
          key={p.id}
          parada={p}
          color={color}
          origin={origin}
          showFavStar={showFavStar}
          winkNonce={winkTarget?.id === p.id ? winkTarget.nonce : null}
        />
      ))}
    </>
  );
}

function FgcStopMarker({
  parada,
  color,
  origin,
  showFavStar,
  winkNonce,
}: {
  parada: FgcParada;
  color?: string;
  origin: Coordinate | null;
  showFavStar: boolean;
  winkNonce: number | null;
}) {
  const { isFgcFav } = useFavorits();
  const fav = isFgcFav(parada.id);
  const [open, setOpen] = useState(false);
  const markerRef = useRef<L.Marker>(null);
  const distanceM = origin
    ? haversine(origin, { lat: parada.lat, lng: parada.lng })
    : null;

  useEffect(() => {
    if (winkNonce == null) return;
    const m = markerRef.current;
    const el = m?.getElement();
    m?.setZIndexOffset(1000);
    m?.openTooltip();
    el?.classList.add('fgc-wink');
    const t = window.setTimeout(() => {
      el?.classList.remove('fgc-wink');
      m?.closeTooltip();
      m?.setZIndexOffset(0);
    }, 1050);
    return () => {
      window.clearTimeout(t);
      el?.classList.remove('fgc-wink');
      m?.closeTooltip();
      m?.setZIndexOffset(0);
    };
  }, [winkNonce]);

  return (
    <>
      <Marker
        ref={markerRef}
        position={[parada.lat, parada.lng]}
        icon={fgcStopIcon(color, fav)}
        eventHandlers={{
          popupopen: () => setOpen(true),
          popupclose: () => setOpen(false),
        }}
      >
        <Tooltip direction="top" offset={[0, -14]} className="stop-tooltip">
          <span className="tooltip-name">{parada.nom}</span>
        </Tooltip>
        <Popup autoPanPaddingTopLeft={[10, 90]}>
          <FgcStationPopup parada={parada} enabled={open} distanceM={distanceM} />
        </Popup>
      </Marker>
      {fav && showFavStar && (
        <Marker
          position={[parada.lat, parada.lng]}
          icon={favStarIcon(13)}
          interactive={false}
          keyboard={false}
        />
      )}
    </>
  );
}
