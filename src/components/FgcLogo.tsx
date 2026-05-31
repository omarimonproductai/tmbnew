interface Props {
  size?: number;
  className?: string;
}

// FGC isotype (the two interlocking links) traced from the official logo,
// rendered monochrome with currentColor so it adapts to context like the other
// header icons — white on the red bar, red on the active white pill. The green
// brand square is intentionally dropped (a fixed colour would clash with the
// red header; project rule: mode icons must be monochrome currentColor).
export function FgcLogo({ size = 18, className }: Props) {
  const ratio = 987 / 658;
  return (
    <svg
      width={Math.round(size * ratio)}
      height={size}
      viewBox="0 0 987 658"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(0,658) scale(0.1,-0.1)" fill="currentColor" stroke="none">
        <path d="M2784 6487 c-36 -20 -2013 -1837 -2096 -1926 -342 -364 -553 -843 -598 -1361 -13 -155 -13 -1458 1 -1591 82 -811 706 -1437 1514 -1519 219 -22 1881 -8 1995 17 272 60 492 165 685 329 39 32 487 440 995 905 509 465 1224 1118 1590 1452 366 334 675 621 687 638 23 32 23 35 23 388 0 391 -1 394 -60 423 -44 23 -714 27 -762 5 -15 -7 -717 -635 -1559 -1397 -1780 -1609 -1645 -1496 -1854 -1557 -86 -25 -1545 -33 -1649 -9 -210 49 -383 222 -426 426 -8 40 -10 263 -8 800 4 846 -1 793 93 985 81 164 70 154 1540 1517 770 715 1410 1313 1423 1330 38 53 23 117 -35 147 -33 17 -1470 15 -1499 -2z M6315 6471 c-392 -70 -535 -160 -1155 -727 -234 -214 -971 -887 -1637 -1496 -666 -609 -1215 -1113 -1220 -1120 -13 -20 -16 -696 -3 -740 23 -79 15 -78 434 -78 335 0 374 2 396 17 14 10 279 247 590 528 311 280 1001 904 1534 1385 1136 1026 1079 980 1291 1036 107 29 1567 29 1660 1 189 -58 329 -196 388 -382 35 -110 34 -1481 0 -1618 -41 -159 -118 -307 -215 -414 -24 -26 -670 -629 -1436 -1340 -791 -735 -1397 -1305 -1403 -1320 -13 -36 -3 -76 27 -104 l26 -24 738 -3 c441 -1 748 1 762 7 29 11 1985 1807 2098 1927 330 347 546 821 599 1316 19 167 14 1587 -5 1717 -105 719 -615 1261 -1339 1423 -142 32 -1958 39 -2130 9z" />
      </g>
    </svg>
  );
}
