interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchInput({ value, onChange }: Props) {
  return (
    <div className="search-box">
      <input
        type="search"
        placeholder="Cerca línia..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Cerca de línia per nom o codi"
      />
    </div>
  );
}
