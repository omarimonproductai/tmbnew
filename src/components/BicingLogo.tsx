interface Props {
  size?: number;
  className?: string;
}

// Inline Bicing logo (from public/bicing-logo.svg) rendered with currentColor
// so it adapts to the surrounding context (white on the red header, red on a
// white pill, white on the red station badge…).
export function BicingLogo({ size = 18, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(0,300) scale(0.05,-0.05)" fill="currentColor" stroke="none">
        <path d="M2662 5976 c-2509 -279 -3552 -3386 -1726 -5139 1649 -1583 4406 -787 4965 1433 509 2023 -1163 3937 -3239 3706z m-857 -937 c176 -49 297 -362 427 -1109 39 -220 92 -512 118 -650 26 -137 54 -297 61 -355 21 -157 27 -154 356 168 290 284 806 699 1046 840 153 90 414 85 563 -11 126 -80 253 -249 355 -474 40 -87 92 -194 115 -238 51 -97 71 -373 50 -690 -15 -235 -53 -363 -221 -750 l-104 -240 -243 -240 c-133 -132 -285 -291 -337 -354 -166 -201 -309 -218 -653 -80 -289 115 -502 275 -750 559 l-126 144 -86 -91 c-104 -111 -189 -157 -345 -186 -202 -37 -190 -48 -189 166 0 226 -15 291 -232 952 -95 291 -185 609 -209 740 -98 525 -147 756 -184 867 -143 430 -171 742 -76 844 139 149 468 242 664 188z" />
        <path d="M3590 3132 c-195 -91 -475 -386 -574 -602 -45 -99 211 -410 551 -669 232 -176 254 -177 428 -14 185 173 173 631 -27 1053 -138 292 -187 322 -378 232z" />
      </g>
    </svg>
  );
}
