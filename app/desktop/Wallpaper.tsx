import type {CSSProperties} from 'react';

export type SkyPhase = 'night' | 'dawn' | 'day' | 'golden' | 'dusk';

/** Hour in Tashkent (UTC+5, no daylight saving), as a fraction: 13.5 = 1:30 PM. */
export function tashkentHour(date = new Date()) {
  return ((date.getUTCHours() + 5) % 24) + date.getUTCMinutes() / 60;
}

export function skyPhase(hour: number): SkyPhase {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'golden';
  if (hour >= 19 && hour < 21) return 'dusk';
  return 'night';
}

type Palette = {
  sky: [string, string, string];
  hillBack: [string, string];
  hillMain: [string, string];
  hillFront: [string, string];
  light: {x: number; y: number; r: number; color: string; glow: string};
  clouds: number;
  stars: number;
  haze: string;
};

const PALETTES: Record<SkyPhase, Palette> = {
  night: {
    sky: ['#06122e', '#13306a', '#2f548f'],
    hillBack: ['#1b3b32', '#122a24'],
    hillMain: ['#22502f', '#12301c'],
    hillFront: ['#1c4527', '#0e2615'],
    light: {x: 1240, y: 170, r: 30, color: '#f4f1df', glow: '#7f9be0'},
    clouds: 0.18,
    stars: 1,
    haze: '#3a5f9a',
  },
  dawn: {
    sky: ['#355aa6', '#b994c4', '#ffc79d'],
    hillBack: ['#5f8a55', '#3f6a3a'],
    hillMain: ['#6a9e3e', '#3e7428'],
    hillFront: ['#5a8f34', '#2f6020'],
    light: {x: 330, y: 560, r: 60, color: '#fff2c9', glow: '#ffb27a'},
    clouds: 0.75,
    stars: 0.15,
    haze: '#ffd2b0',
  },
  day: {
    sky: ['#1d6fd6', '#5aa8ec', '#bfe3fb'],
    hillBack: ['#7fbf62', '#4f9a3c'],
    hillMain: ['#6fc04a', '#2f8a2a'],
    hillFront: ['#61b13f', '#2a7a24'],
    light: {x: 1180, y: 120, r: 54, color: '#fffbe6', glow: '#ffffff'},
    clouds: 1,
    stars: 0,
    haze: '#d8efff',
  },
  golden: {
    sky: ['#3d6cc4', '#e8a96a', '#ffd994'],
    hillBack: ['#8aa65a', '#5e8a3a'],
    hillMain: ['#88b13e', '#4f8126'],
    hillFront: ['#7aa236', '#40701f'],
    light: {x: 1320, y: 520, r: 64, color: '#fff0c2', glow: '#ffb050'},
    clouds: 0.85,
    stars: 0,
    haze: '#ffe1a8',
  },
  dusk: {
    sky: ['#1c2a66', '#7c4a8c', '#f08a5d'],
    hillBack: ['#3f5a45', '#2a4234'],
    hillMain: ['#3f6a33', '#223f1f'],
    hillFront: ['#365c2c', '#1b331a'],
    light: {x: 1380, y: 600, r: 58, color: '#ffd7a8', glow: '#ff7a59'},
    clouds: 0.55,
    stars: 0.5,
    haze: '#f2a07a',
  },
};

// Fixed pseudo-random star field so server and browser render the same sky.
const STARS = Array.from({length: 90}, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.6789;
  return {x: (a - Math.floor(a)) * 1600, y: (b - Math.floor(b)) * 520, r: i % 9 === 0 ? 1.6 : i % 3 === 0 ? 1.1 : 0.7, d: (i % 7) * 0.6};
});

export default function Wallpaper({phase}: {phase: SkyPhase}) {
  const p = PALETTES[phase];
  return (
    <svg className={`wallpaper phase-${phase}`} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]}/>
          <stop offset="0.55" stopColor={p.sky[1]}/>
          <stop offset="1" stopColor={p.sky[2]}/>
        </linearGradient>
        <radialGradient id="wp-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.light.glow} stopOpacity="0.75"/>
          <stop offset="1" stopColor={p.light.glow} stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="wp-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.hillBack[0]}/><stop offset="1" stopColor={p.hillBack[1]}/></linearGradient>
        <radialGradient id="wp-main" cx="0.42" cy="0.08" r="0.9">
          <stop offset="0" stopColor={p.hillMain[0]}/>
          <stop offset="1" stopColor={p.hillMain[1]}/>
        </radialGradient>
        <radialGradient id="wp-front" cx="0.3" cy="0.05" r="1">
          <stop offset="0" stopColor={p.hillFront[0]}/>
          <stop offset="1" stopColor={p.hillFront[1]}/>
        </radialGradient>
        <linearGradient id="wp-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.haze} stopOpacity="0"/><stop offset="1" stopColor={p.haze} stopOpacity="0.55"/></linearGradient>
        <mask id="wp-crescent" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1000">
          <rect width="1600" height="1000" fill="#fff"/>
          <circle cx={p.light.x + 14} cy={p.light.y - 10} r={p.light.r * 0.88} fill="#000"/>
        </mask>
        <filter id="wp-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
        <filter id="wp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.09 0"/>
        </filter>
      </defs>

      <rect width="1600" height="1000" fill="url(#wp-sky)"/>

      {p.stars > 0 && (
        <g className="wp-stars" opacity={p.stars}>
          {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" style={{animationDelay: `${s.d}s`} as CSSProperties}/>)}
        </g>
      )}

      <circle cx={p.light.x} cy={p.light.y} r={p.light.r * 5} fill="url(#wp-glow)"/>
      <circle cx={p.light.x} cy={p.light.y} r={p.light.r} fill={p.light.color} mask={phase === 'night' ? 'url(#wp-crescent)' : undefined}/>

      <g className="wp-clouds" opacity={p.clouds} filter="url(#wp-blur)">
        <ellipse cx="300" cy="190" rx="210" ry="38" fill="#fff" opacity="0.85"/>
        <ellipse cx="420" cy="165" rx="140" ry="34" fill="#fff" opacity="0.7"/>
        <ellipse cx="930" cy="250" rx="260" ry="34" fill="#fff" opacity="0.6"/>
        <ellipse cx="1420" cy="330" rx="200" ry="30" fill="#fff" opacity="0.55"/>
        <ellipse cx="640" cy="390" rx="300" ry="26" fill="#fff" opacity="0.45"/>
      </g>

      <rect y="420" width="1600" height="260" fill="url(#wp-haze)"/>

      {/* Hills: back ridge, the big Bliss-style hill, and a front slope on the left. */}
      <path d="M0 640 C 260 560 520 600 760 610 C 1010 620 1240 560 1600 590 L1600 1000 L0 1000 Z" fill="url(#wp-back)"/>
      <path d="M-40 1000 L-40 760 C 180 640 470 560 820 560 C 1130 560 1390 640 1640 720 L1640 1000 Z" fill="url(#wp-main)"/>
      <path d="M-60 1000 L-60 820 C 160 760 420 760 640 820 C 790 862 900 930 960 1000 Z" fill="url(#wp-front)" opacity="0.95"/>

      <rect width="1600" height="1000" filter="url(#wp-grain)"/>
    </svg>
  );
}
