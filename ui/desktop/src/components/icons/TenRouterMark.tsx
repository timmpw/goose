// The 10router brand, drawn from the monogram kit's vector sources (no font
// needed): the «10» mark with the gap at the foot of the zero, and the
// «router» wordmark. The mark takes the brand blue var(--brand) in every
// theme; the wordmark takes currentColor, so the logo reads on light and
// dark alike.

const MARK = (
  <>
    <path d="M0 29 55 0H102V246H40V64L0 84Z" />
    <path d="M227 246H196C154 246 120 212 120 170V76C120 34 154 0 196 0H292C334 0 368 34 368 76V170C368 212 334 246 292 246H259V190H288C301 190 312 179 312 166V80C312 67 301 56 288 56H200C187 56 176 67 176 80V166C176 179 187 190 200 190H227Z" />
  </>
);

const WORDMARK = (
  <>
    <path transform="translate(0.0000 0)" d="M1004 815Q957 837 910.5 847.5Q864 858 817 858Q679 858 604.5 769.5Q530 681 530 516V0H172V1120H530V936Q599 1046 688.5 1096.5Q778 1147 903 1147Q921 1147 942.0 1145.5Q963 1144 1003 1139Z" />
    <path transform="translate(985.0000 0)" d="M705 891Q586 891 523.5 805.5Q461 720 461 559Q461 398 523.5 312.5Q586 227 705 227Q822 227 884.0 312.5Q946 398 946 559Q946 720 884.0 805.5Q822 891 705 891ZM705 1147Q994 1147 1156.5 991.0Q1319 835 1319 559Q1319 283 1156.5 127.0Q994 -29 705 -29Q415 -29 251.5 127.0Q88 283 88 559Q88 835 251.5 991.0Q415 1147 705 1147Z" />
    <path transform="translate(2367.0000 0)" d="M160 436V1120H520V1008Q520 917 519.0 779.5Q518 642 518 596Q518 461 525.0 401.5Q532 342 549 315Q571 280 606.5 261.0Q642 242 688 242Q800 242 864.0 328.0Q928 414 928 567V1120H1286V0H928V162Q847 64 756.5 17.5Q666 -29 557 -29Q363 -29 261.5 90.0Q160 209 160 436Z" />
    <path transform="translate(3800.0000 0)" d="M563 1438V1120H932V864H563V389Q563 311 594.0 283.5Q625 256 717 256H901V0H594Q382 0 293.5 88.5Q205 177 205 389V864H27V1120H205V1438Z" />
    <path transform="translate(4754.0000 0)" d="M1290 563V461H453Q466 335 544.0 272.0Q622 209 762 209Q875 209 993.5 242.5Q1112 276 1237 344V68Q1110 20 983.0 -4.5Q856 -29 729 -29Q425 -29 256.5 125.5Q88 280 88 559Q88 833 253.5 990.0Q419 1147 709 1147Q973 1147 1131.5 988.0Q1290 829 1290 563ZM922 682Q922 784 862.5 846.5Q803 909 707 909Q603 909 538.0 850.5Q473 792 457 682Z" />
    <path transform="translate(6118.0000 0)" d="M1004 815Q957 837 910.5 847.5Q864 858 817 858Q679 858 604.5 769.5Q530 681 530 516V0H172V1120H530V936Q599 1046 688.5 1096.5Q778 1147 903 1147Q921 1147 942.0 1145.5Q963 1144 1003 1139Z" />
  </>
);

interface BrandProps {
  className?: string;
  title?: string;
}

// Logo is the full lockup — the mark plus the «router» wordmark.
export function TenRouterLogo({ className = '', title = '10router' }: BrandProps) {
  return (
    <svg
      viewBox="40 36 1344 258"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="var(--brand)" transform="translate(40 40)">
        {MARK}
      </g>
      <g fill="currentColor" transform="translate(448 286) scale(0.1318359375 -0.1318359375)">
        {WORDMARK}
      </g>
    </svg>
  );
}

// Mark is the «10» alone, for tight spots — tray-scale UI, loading rows.
export function TenRouterMark({ className = '', title = '10router' }: BrandProps) {
  return (
    <svg
      viewBox="0 0 368 246"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="var(--brand)">{MARK}</g>
    </svg>
  );
}
