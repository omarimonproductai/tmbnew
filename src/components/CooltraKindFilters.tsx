interface Props {
  motos: boolean;
  bikes: boolean;
  onMotosChange: (v: boolean) => void;
  onBikesChange: (v: boolean) => void;
}

// Filter pills that appear under the main Cooltra button when Cooltra is on.
// Each button mirrors its map marker's look: moto = blue fill, bici = white fill,
// both ringed in Cooltra green. Off state dims + slashes the button.
export function CooltraKindFilters({ motos, bikes, onMotosChange, onBikesChange }: Props) {
  return (
    <>
      <button
        type="button"
        className={`cooltra-kind-btn cooltra-kind-btn--moto${motos ? '' : ' off'}`}
        onClick={() => onMotosChange(!motos)}
        aria-pressed={motos}
        title={motos ? 'Amaga les motos' : 'Mostra les motos'}
        aria-label={motos ? 'Amaga les motos Cooltra' : 'Mostra les motos Cooltra'}
      >
        <MotoIcon />
        {!motos && <Slash />}
      </button>
      <button
        type="button"
        className={`cooltra-kind-btn cooltra-kind-btn--bike${bikes ? '' : ' off'}`}
        onClick={() => onBikesChange(!bikes)}
        aria-pressed={bikes}
        title={bikes ? 'Amaga les bicis' : 'Mostra les bicis'}
        aria-label={bikes ? 'Amaga les bicis Cooltra' : 'Mostra les bicis Cooltra'}
      >
        <BikeIcon />
        {!bikes && <Slash />}
      </button>
    </>
  );
}

function MotoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5" cy="17.5" r="2.5" />
      <circle cx="19" cy="17.5" r="2.5" />
      <path d="M5 17.5h4l3-3 3 1.5h4" />
      <path d="M12 14.5l-2.5-4h-2" />
      <path d="M16 10h3l-1.5 3" />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5.5" cy="17" r="3" />
      <circle cx="18.5" cy="17" r="3" />
      <path d="M5.5 17 8 13.5l3 3.5" />
      <path d="M11 17l3.5-6" />
      <path d="M14.5 11l4 6" />
      <rect x="14" y="8" width="5" height="3" rx="0.4" />
      <path d="M16 8V6.5" />
    </svg>
  );
}

function Slash() {
  return (
    <svg className="cooltra-kind-btn__slash" viewBox="0 0 40 40" aria-hidden="true">
      <line x1="8" y1="32" x2="32" y2="8" stroke="#c8001e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
