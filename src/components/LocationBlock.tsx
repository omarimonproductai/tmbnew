interface Props {
  radius: number;
  onRadiusChange: (r: number) => void;
}

// Just the radius control: the "La meva ubicació" row was dropped since the
// map already labels the user with a "Tu" marker. Location errors surface as
// the map hint, not here.
export function LocationBlock({ radius, onRadiusChange }: Props) {
  return (
    <div className="location-block">
      <div className="radius-row">
        <label htmlFor="radius">Radi</label>
        <input
          type="range"
          id="radius"
          min={100}
          max={1500}
          step={50}
          value={radius}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
        />
        <span className="radius-value">{formatRadius(radius)}</span>
      </div>
    </div>
  );
}

function formatRadius(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}
