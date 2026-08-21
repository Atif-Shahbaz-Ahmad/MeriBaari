/** Default botanical panel shown until a `hero.*` image is added to `web/public/`. */
export function HeroFallbackArt() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 640 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1B3A4B" />
          <stop offset="55%" stopColor="#2F6F6A" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="hero-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9EC9C1" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect width="640" height="800" fill="url(#hero-sky)" />
      <g fill="url(#hero-leaf)">
        <ellipse cx="80" cy="120" rx="140" ry="70" transform="rotate(-28 80 120)" opacity="0.7" />
        <ellipse cx="520" cy="90" rx="170" ry="80" transform="rotate(18 520 90)" opacity="0.55" />
        <ellipse cx="300" cy="240" rx="200" ry="90" transform="rotate(-12 300 240)" opacity="0.45" />
        <ellipse cx="90" cy="420" rx="180" ry="85" transform="rotate(22 90 420)" opacity="0.6" />
        <ellipse cx="540" cy="390" rx="190" ry="95" transform="rotate(-20 540 390)" opacity="0.5" />
        <ellipse cx="250" cy="620" rx="210" ry="100" transform="rotate(14 250 620)" opacity="0.55" />
        <ellipse cx="560" cy="680" rx="160" ry="80" transform="rotate(-8 560 680)" opacity="0.45" />
      </g>
      <g fill="none" stroke="#F8FAFC" strokeOpacity="0.22" strokeWidth="10">
        <path d="M-20 260c90 20 140-40 210-20s110 70 200 40 150-10 250 40" />
        <path d="M-10 520c80-30 150 20 230 10s140-60 230-20 160 50 220 20" />
      </g>
    </svg>
  );
}
