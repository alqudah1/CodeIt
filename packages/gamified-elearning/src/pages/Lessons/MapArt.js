// ── The drawn world of the lesson map ───────────────────────────────────────
//
// Islands, trees, mountains, clouds, a sun, a castle and a signpost, each a
// small inline SVG in CodeIt's own style: flat colour, a 3px ink outline, a
// darker edge for depth. No image files, so nothing to load and every piece
// scales clean at any width. The map lays them out; this file only draws.

const INK = '#35220E';

export function Island({ width = 170, variant = 'meadow', className = '' }) {
  const top = { meadow: '#62D27C', mountain: '#7ED0A8', cloud: '#BFEFD3', castle: '#F2C96B' }[variant] || '#62D27C';
  const light = { meadow: '#9BEBA7', mountain: '#B6EBD0', cloud: '#E6FBEE', castle: '#FFE39A' }[variant] || '#9BEBA7';
  const dirt = { meadow: '#9C6A3A', mountain: '#7A6478', cloud: '#B9C3D9', castle: '#B8773A' }[variant] || '#9C6A3A';
  const dirtDark = { meadow: '#6B4323', mountain: '#4F3F55', cloud: '#8E9AB8', castle: '#7A4A20' }[variant] || '#6B4323';
  return (
    <svg className={`ma-island ${className}`} viewBox="0 0 170 78" width={width} height={(width * 78) / 170} aria-hidden="true" focusable="false">
      <path d="M16 32 C16 8 154 8 154 32 L142 58 C126 76 44 76 28 58 Z" fill={dirt} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 58 C44 76 126 76 142 58 L136 66 C120 78 50 78 34 66 Z" fill={dirtDark} opacity=".55" />
      <path d="M40 48 l6 10 M70 54 l4 12 M104 54 l-3 12 M130 48 l-6 10" stroke={dirtDark} strokeWidth="3" strokeLinecap="round" opacity=".6" />
      <ellipse cx="85" cy="32" rx="69" ry="20" fill={top} stroke={INK} strokeWidth="3" />
      <ellipse cx="85" cy="28" rx="50" ry="10" fill={light} opacity=".7" />
      <path d="M44 24 q3 -6 6 0 M118 22 q3 -6 6 0 M70 18 q3 -6 6 0" stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".55" />
    </svg>
  );
}

export function Tree({ size = 54, className = '', dark = false }) {
  const leaf = dark ? '#2F9E5A' : '#3FBF6B';
  const leafLight = dark ? '#4FC27A' : '#7BE39A';
  return (
    <svg className={`ma-tree ${className}`} viewBox="0 0 54 70" width={size} height={(size * 70) / 54} aria-hidden="true" focusable="false">
      <rect x="22" y="44" width="10" height="24" rx="3" fill="#8A5A2B" stroke={INK} strokeWidth="3" />
      <circle cx="27" cy="30" r="20" fill={leaf} stroke={INK} strokeWidth="3" />
      <circle cx="16" cy="38" r="12" fill={leaf} stroke={INK} strokeWidth="3" />
      <circle cx="39" cy="38" r="12" fill={leaf} stroke={INK} strokeWidth="3" />
      <circle cx="27" cy="30" r="20" fill={leaf} />
      <circle cx="22" cy="24" r="8" fill={leafLight} />
    </svg>
  );
}

export function Bush({ size = 40, className = '' }) {
  return (
    <svg className={`ma-bush ${className}`} viewBox="0 0 40 24" width={size} height={(size * 24) / 40} aria-hidden="true" focusable="false">
      <circle cx="12" cy="14" r="9" fill="#4CC779" stroke={INK} strokeWidth="2.5" />
      <circle cx="28" cy="14" r="9" fill="#4CC779" stroke={INK} strokeWidth="2.5" />
      <circle cx="20" cy="10" r="10" fill="#4CC779" stroke={INK} strokeWidth="2.5" />
      <circle cx="20" cy="10" r="10" fill="#4CC779" />
      <circle cx="17" cy="7" r="4" fill="#8BE8A4" />
    </svg>
  );
}

export function Mountains({ width = 420, className = '' }) {
  return (
    <svg className={`ma-mountains ${className}`} viewBox="0 0 420 160" width={width} height={(width * 160) / 420} aria-hidden="true" focusable="false">
      <path d="M0 160 L70 60 L120 110 L190 20 L260 110 L310 70 L420 160 Z" fill="#8F7BC7" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M190 20 L215 56 L203 52 L190 66 L177 52 L165 56 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M70 60 L88 84 L78 80 L70 92 L62 80 L52 84 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M310 70 L326 92 L317 88 L310 100 L303 88 L294 92 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M120 110 L190 20 L260 110 Z" fill="#A693DA" opacity=".55" />
    </svg>
  );
}

export function Cloud({ width = 110, className = '' }) {
  return (
    <svg className={`ma-cloud ${className}`} viewBox="0 0 110 56" width={width} height={(width * 56) / 110} aria-hidden="true" focusable="false">
      <path d="M22 48 a16 16 0 0 1 4 -31 a20 20 0 0 1 38 -8 a18 18 0 0 1 30 14 a14 14 0 0 1 -2 25 Z" fill="#FFFFFF" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M28 44 h58" stroke="#DCEBFF" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function Sun({ size = 96, className = '' }) {
  const rays = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <svg className={`ma-sun ${className}`} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true" focusable="false">
      {rays.map((deg) => (
        <path key={deg} d="M60 6 l8 16 h-16 Z" fill="#FFC93C" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" transform={`rotate(${deg} 60 60)`} />
      ))}
      <circle cx="60" cy="60" r="32" fill="#FFC93C" stroke={INK} strokeWidth="3" />
      <circle cx="52" cy="52" r="9" fill="#FFE59A" />
    </svg>
  );
}

export function Castle({ width = 150, className = '', lit = false }) {
  const wall = lit ? '#FFD66B' : '#D9CBB8';
  const wallDark = lit ? '#E6B43F' : '#B7A48C';
  const roof = lit ? '#FF6B6B' : '#8F7BC7';
  return (
    <svg className={`ma-castle ${className}`} viewBox="0 0 150 120" width={width} height={(width * 120) / 150} aria-hidden="true" focusable="false">
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

export function Signpost({ title, line, icon, className = '', style }) {
  return (
    <div className={`ma-sign ${className}`} style={style} aria-hidden="true">
      <div className="ma-sign__board">
        {icon && <span className="ma-sign__icon">{icon}</span>}
        <span className="ma-sign__text"><b>{title}</b><small>{line}</small></span>
      </div>
      <div className="ma-sign__post" />
    </div>
  );
}

export function Gem({ size = 28, className = '' }) {
  return (
    <svg className={`ma-gem ${className}`} viewBox="0 0 28 28" width={size} height={size} aria-hidden="true" focusable="false">
      <path d="M8 4 h12 l6 8 -12 13 -12 -13 Z" fill="#7EE0FF" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M8 4 l6 8 h-12 Z M14 12 l6 -8 6 8 Z" fill="#D7F6FF" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
