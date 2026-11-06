export function TenRouterMark({ className = '' }) {
  return (
    <svg
      width="1024"
      height="1024"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="tenrouter-bg" x1="0" y1="0" x2="0.8" y2="1">
          <stop stopColor="#24211f" />
          <stop offset="1" stopColor="#121211" />
        </linearGradient>
        <linearGradient id="tenrouter-copper" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f39463" />
          <stop offset="1" stopColor="#ce6032" />
        </linearGradient>
      </defs>
      <rect x="62" y="62" width="900" height="900" rx="202" fill="url(#tenrouter-bg)" />
      <rect
        x="63.5"
        y="63.5"
        width="897"
        height="897"
        rx="200.5"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.09"
        strokeWidth="3"
      />
      <g
        fill="none"
        stroke="url(#tenrouter-copper)"
        strokeWidth="62"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M256 403 336 339V685M256 685H416" />
        <rect x="505" y="339" width="244" height="346" rx="122" />
        <path d="M581 565 673 459M608 459H673V524" strokeWidth="35" />
      </g>
    </svg>
  );
}
