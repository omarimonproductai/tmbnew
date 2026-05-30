interface Props {
  electric: boolean;
  mecanic: boolean;
  onElectricChange: (v: boolean) => void;
  onMecanicChange: (v: boolean) => void;
}

// Two compact chips (electric / mechanical). Both can be deselected — when
// both are off the Bicing layer is hidden. Kept small ("que ocupi molt poc"):
// icon + short label.
export function BicingFilters({
  electric,
  mecanic,
  onElectricChange,
  onMecanicChange,
}: Props) {
  return (
    <div className="bicing-chips" role="group" aria-label="Filtre Bicing per tipus de bici">
      <button
        type="button"
        className={`bicing-chip bicing-chip--elec${electric ? ' active' : ''}`}
        aria-pressed={electric}
        onClick={() => onElectricChange(!electric)}
        title={electric ? 'Amaga Bicing elèctric' : 'Mostra Bicing elèctric'}
      >
        <span className="bicing-chip__ic" aria-hidden="true">⚡</span>
        <span className="bicing-chip__t">Elèc</span>
      </button>
      <button
        type="button"
        className={`bicing-chip bicing-chip--mec${mecanic ? ' active' : ''}`}
        aria-pressed={mecanic}
        onClick={() => onMecanicChange(!mecanic)}
        title={mecanic ? 'Amaga Bicing mecànic' : 'Mostra Bicing mecànic'}
      >
        <span className="bicing-chip__ic" aria-hidden="true">🚲</span>
        <span className="bicing-chip__t">Mec</span>
      </button>
    </div>
  );
}
