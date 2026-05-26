interface Props {
  active: boolean;
  onToggle: () => void;
  size?: number;
  label?: string;
}

export function FavStar({ active, onToggle, size = 22, label }: Props) {
  return (
    <button
      type="button"
      className={`fav-star${active ? ' on' : ''}`}
      aria-pressed={active}
      aria-label={label ?? (active ? 'Treure dels favorits' : 'Afegir als favorits')}
      title={active ? 'Treure dels favorits' : 'Afegir als favorits'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 1.8}
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.96 6.1 20.5l1.1-6.47-4.7-4.58 6.5-.95z" />
      </svg>
    </button>
  );
}
