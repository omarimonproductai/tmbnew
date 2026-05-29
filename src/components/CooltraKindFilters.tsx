interface Props {
  motos: boolean;
  bikes: boolean;
  onMotosChange: (v: boolean) => void;
  onBikesChange: (v: boolean) => void;
}

// Filter pills shown beneath the main Cooltra map button. Each one mirrors
// the look of its map marker (outer accent ring + inner brand fill) and
// holds the matching vehicle silhouette in white. Off state dims + slashes.
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
        <span className="cooltra-glyph cooltra-glyph--moto cooltra-glyph--white" />
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
        <span className="cooltra-glyph cooltra-glyph--bike cooltra-glyph--white" />
        {!bikes && <Slash />}
      </button>
    </>
  );
}

function Slash() {
  return (
    <svg className="cooltra-kind-btn__slash" viewBox="0 0 40 40" aria-hidden="true">
      <line x1="8" y1="32" x2="32" y2="8" stroke="#c8001e" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
