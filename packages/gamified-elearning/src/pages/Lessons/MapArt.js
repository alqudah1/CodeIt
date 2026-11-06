// ── The drawn world of the lesson map ───────────────────────────────────────
//
// Ground edges, peaks, trees, rocks, flowers, clouds, a sun and a castle,
// each a small inline SVG in CodeIt's own style: flat colour, a 3px ink
// outline, a darker edge for depth. No image files, so nothing to load and
// every piece scales clean at any width. The map lays them out; this file
// only draws.

const INK = '#35220E';

/** The wavy top edge of a land, laid over the land before it. Stretches to any width. */
export function GroundEdge({ fill, className = '' }) {
  return (
    <svg className={`ma-edge ${className}`} viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 60 L0 34 C 80 10 160 10 250 30 S 420 56 520 30 S 700 4 800 26 S 940 48 1000 30 L1000 60 Z" fill={fill} stroke={INK} strokeWidth="4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** A line of snowy peaks along the top of the mountain land. Stretches to any width. */
export function Peaks({ className = '' }) {
  return (
    <svg className={`ma-peaks ${className}`} viewBox="0 0 1000 150" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 150 L0 96 L70 50 L130 92 L220 18 L310 92 L380 60 L460 110 L560 30 L650 96 L720 66 L800 110 L880 40 L950 90 L1000 70 L1000 150 Z" fill="#8F7BC7" stroke={INK} strokeWidth="4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M220 18 L250 44 L236 40 L220 56 L204 40 L190 44 Z M560 30 L588 56 L574 52 L560 68 L546 52 L532 56 Z M880 40 L906 64 L893 60 L880 76 L867 60 L854 64 Z" fill="#FFFFFF" stroke={INK} strokeWidth="4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <path d="M0 150 L0 120 L1000 100 L1000 150 Z" fill="#7F6BB8" opacity=".5" />
    </svg>
  );
}

export function Tree({ size = 54, className = '', dark = false, style }) {
  const leaf = dark ? '#2F9E5A' : '#3FBF6B';
  const leafLight = dark ? '#4FC27A' : '#7BE39A';
  return (
    <svg className={`ma-tree ${className}`} style={style} viewBox="0 0 54 70" width={size} height={(size * 70) / 54} aria-hidden="true" focusable="false">
      <rect x="22" y="44" width="10" height="24" rx="3" fill="#8A5A2B" stroke={INK} strokeWidth="3" />
      <circle cx="27" cy="30" r="20" fill={leaf} stroke={INK} strokeWidth="3" />
      <circle cx="16" cy="38" r="12" fill={leaf} stroke={INK} strokeWidth="3" />
      <circle cx="39" cy="38" r="12" fill={leaf} stroke={INK} strokeWidth="3" />
      <circle cx="27" cy="30" r="20" fill={leaf} />
      <circle cx="22" cy="24" r="8" fill={leafLight} />
    </svg>
  );
}

export function Pine({ size = 50, className = '', style }) {
  return (
    <svg className={`ma-pine ${className}`} style={style} viewBox="0 0 50 72" width={size} height={(size * 72) / 50} aria-hidden="true" focusable="false">
      <rect x="21" y="52" width="8" height="18" rx="3" fill="#8A5A2B" stroke={INK} strokeWidth="3" />
      <path d="M25 4 L44 32 H32 L47 54 H3 L18 32 H6 Z" fill="#2F9E5A" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M25 4 L36 20 L25 18 L14 20 Z" fill="#5FD38A" />
    </svg>
  );
}

export function Bush({ size = 40, className = '', style }) {
  return (
    <svg className={`ma-bush ${className}`} style={style} viewBox="0 0 40 24" width={size} height={(size * 24) / 40} aria-hidden="true" focusable="false">
      <circle cx="12" cy="14" r="9" fill="#4CC779" stroke={INK} strokeWidth="2.5" />
      <circle cx="28" cy="14" r="9" fill="#4CC779" stroke={INK} strokeWidth="2.5" />
      <circle cx="20" cy="10" r="10" fill="#4CC779" stroke={INK} strokeWidth="2.5" />
      <circle cx="20" cy="10" r="10" fill="#4CC779" />
      <circle cx="17" cy="7" r="4" fill="#8BE8A4" />
    </svg>
  );
}

export function Rock({ size = 44, className = '', style, tone = '#B9ACD6' }) {
  return (
    <svg className={`ma-rock ${className}`} style={style} viewBox="0 0 44 30" width={size} height={(size * 30) / 44} aria-hidden="true" focusable="false">
      <path d="M4 26 L10 10 L22 4 L36 10 L41 26 Z" fill={tone} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M10 10 L22 4 L26 14 L14 18 Z" fill="#FFFFFF" opacity=".45" />
    </svg>
  );
}

export function Flower({ size = 22, className = '', style, petal = '#FF6B9D' }) {
  return (
    <svg className={`ma-flower ${className}`} style={style} viewBox="0 0 22 22" width={size} height={size} aria-hidden="true" focusable="false">
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse key={deg} cx="11" cy="5" rx="3.6" ry="5" fill={petal} stroke={INK} strokeWidth="1.8" transform={`rotate(${deg} 11 11)`} />
      ))}
      <circle cx="11" cy="11" r="3.4" fill="#FFD93C" stroke={INK} strokeWidth="1.8" />
    </svg>
  );
}

export function Cloud({ width = 110, className = '', style }) {
  return (
    <svg className={`ma-cloud ${className}`} style={style} viewBox="0 0 110 56" width={width} height={(width * 56) / 110} aria-hidden="true" focusable="false">
      <path d="M22 48 a16 16 0 0 1 4 -31 a20 20 0 0 1 38 -8 a18 18 0 0 1 30 14 a14 14 0 0 1 -2 25 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 44 h58" stroke="#DCEBFF" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function Sun({ size = 96, className = '', style }) {
  const rays = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <svg className={`ma-sun ${className}`} style={style} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" focusable="false">
      {rays.map((deg) => (
        <path key={deg} d="M60 6 l8 16 h-16 Z" fill="#FFC93C" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" transform={`rotate(${deg} 60 60)`} />
      ))}
      <circle cx="60" cy="60" r="32" fill="#FFC93C" stroke={INK} strokeWidth="3" />
      <circle cx="52" cy="52" r="9" fill="#FFE59A" />
    </svg>
  );
}

export function Castle({ width = 150, className = '', lit = false, style }) {
  const wall = lit ? '#FFD66B' : '#E9DCC6';
  const wallDark = lit ? '#E6B43F' : '#C4B096';
  const roof = lit ? '#FF6B6B' : '#8F7BC7';
  return (
    <svg className={`ma-castle ${className}`} style={style} viewBox="0 0 150 120" width={width} height={(width * 120) / 150} aria-hidden="true" focusable="false">
      <rect x="18" y="40" width="26" height="70" fill={wall} stroke={INK} strokeWidth="3" />
      <rect x="106" y="40" width="26" height="70" fill={wall} stroke={INK} strokeWidth="3" />
      <path d="M12 42 L31 10 L50 42 Z" fill={roof} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M100 42 L119 10 L138 42 Z" fill={roof} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="40" y="58" width="70" height="52" fill={wall} stroke={INK} strokeWidth="3" />
      <path d="M40 58 v-12 h10 v12 M60 58 v-12 h10 v12 M80 58 v-12 h10 v12 M100 58 v-12 h10 v12" fill={wall} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="40" y="82" width="70" height="28" fill={wallDark} opacity=".45" />
      <path d="M64 110 v-22 a11 11 0 0 1 22 0 v22 Z" fill="#6B4323" stroke={INK} strokeWidth="3" />
      <rect x="26" y="60" width="9" height="13" rx="4" fill="#35220E" />
      <rect x="114" y="60" width="9" height="13" rx="4" fill="#35220E" />
      <path d="M31 10 v-8 h16 l-5 4 5 4 h-16" fill="#FF7A00" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M119 10 v-8 h16 l-5 4 5 4 h-16" fill="#FF7A00" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      {lit && <path d="M75 70 l4 8 h-8 Z" fill="#FFF4C2" />}
    </svg>
  );
}

/** The hill the castle stands on. */
export function Hill({ width = 260, className = '', style }) {
  return (
    <svg className={`ma-hill ${className}`} style={style} viewBox="0 0 260 90" width={width} height={(width * 90) / 260} aria-hidden="true" focusable="false">
      <path d="M0 90 C 40 20 220 20 260 90 Z" fill="#F2C96B" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 80 C 70 40 190 40 230 80 Z" fill="#FFE39A" opacity=".7" />
    </svg>
  );
}

export function Gem({ size = 28, className = '', style }) {
  return (
    <svg className={`ma-gem ${className}`} style={style} viewBox="0 0 28 28" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M8 4 h12 l6 8 -12 13 -12 -13 Z" fill="#7EE0FF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M8 4 l6 8 h-12 Z M14 12 l6 -8 6 8 Z" fill="#D7F6FF" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

/** A pennant on a pole, planted beside a boss stop. */
export function Flag({ size = 40, className = '', style, color = '#FF6B6B' }) {
  return (
    <svg className={`ma-flag ${className}`} style={style} viewBox="0 0 40 60" width={size} height={(size * 60) / 40} aria-hidden="true" focusable="false">
      <rect x="6" y="4" width="5" height="54" rx="2.5" fill="#8A5A2B" stroke={INK} strokeWidth="2.5" />
      <path d="M11 6 L36 14 L11 24 Z" fill={color} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
