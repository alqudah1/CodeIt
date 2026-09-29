import React from 'react';
import { WORLD_W, unitBounds, freeSide } from '../worldLayout';
import { Robot } from './pieces';

// ── The land the road runs through ───────────────────────────────────────────
//
// Drawn once as SVG behind the road: three kinds of land that repeat up the
// world (meadow, river country, evening hills), each with its own props.
// Everything idles: the windmill turns, water ripples, lantern light
// breathes, flags wave, fireflies blink. Props are placed relative to each
// unit's bounds so the world grows with the curriculum.

export function Defs() {
  return (
    <defs>
      <radialGradient id="wfox" cx=".4" cy=".3"><stop offset="0" stopColor="#FFB25A" /><stop offset="1" stopColor="#E86E12" /></radialGradient>
      <linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9B8" /><stop offset="1" stopColor="#E9DDF7" /></linearGradient>
      <linearGradient id="wwater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5AC8FA" /><stop offset="1" stopColor="#2E9FE0" /></linearGradient>
      <symbol id="wpine" viewBox="0 0 60 90"><rect x="26" y="66" width="8" height="22" rx="3" fill="#7A4A22" /><path d="M30 6 L54 44 H6z" fill="#2E8B4A" /><path d="M30 6 L30 44 H6z" fill="#3FA65C" /><path d="M30 28 L58 70 H2z" fill="#2E8B4A" /><path d="M30 28 L30 70 H2z" fill="#3FA65C" /></symbol>
      <symbol id="woak" viewBox="0 0 70 84"><rect x="31" y="56" width="9" height="26" rx="4" fill="#7A4A22" /><ellipse cx="35" cy="40" rx="30" ry="24" fill="#3B9E4E" /><ellipse cx="26" cy="32" rx="22" ry="18" fill="#5BBE5E" /><ellipse cx="44" cy="30" rx="20" ry="17" fill="#79D06A" /><circle cx="20" cy="46" r="3" fill="#FF6B6B" /><circle cx="48" cy="50" r="3" fill="#FF6B6B" /><circle cx="36" cy="22" r="3" fill="#FF6B6B" /></symbol>
      <symbol id="wbush" viewBox="0 0 64 34"><ellipse cx="18" cy="22" rx="17" ry="12" fill="#3B9E4E" /><ellipse cx="40" cy="20" rx="20" ry="14" fill="#5BBE5E" /><ellipse cx="30" cy="14" rx="12" ry="9" fill="#79D06A" /></symbol>
      <symbol id="wflower" viewBox="0 0 20 20"><circle cx="10" cy="5" r="3.2" /><circle cx="15" cy="9" r="3.2" /><circle cx="13" cy="15" r="3.2" /><circle cx="7" cy="15" r="3.2" /><circle cx="5" cy="9" r="3.2" /><circle cx="10" cy="10" r="2.6" fill="#FFC800" /></symbol>
      <symbol id="wrock" viewBox="0 0 40 26"><path d="M4 22 q-4 -10 8 -16 q10 -8 22 -2 q8 6 2 18z" fill="#9AA5A8" /><path d="M8 20 q0 -10 10 -13 q8 -3 14 2 q-8 0 -14 4 q-6 3 -10 7z" fill="#C4CDCF" /></symbol>
      <symbol id="wcloud" viewBox="0 0 120 50"><ellipse cx="60" cy="36" rx="56" ry="13" fill="#fff" /><circle cx="36" cy="28" r="17" fill="#fff" /><circle cx="64" cy="20" r="22" fill="#fff" /><circle cx="90" cy="28" r="15" fill="#fff" /><ellipse cx="60" cy="42" rx="52" ry="7" fill="#DCEBF5" /></symbol>
      <symbol id="wgrass" viewBox="0 0 30 16"><path d="M4 16 q2 -10 6 -14 q0 8 2 14z M12 16 q3 -12 9 -16 q-3 9 -3 16z M20 16 q4 -8 9 -10 q-4 6 -5 10z" fill="#4CAF50" /></symbol>
      <symbol id="wlantern" viewBox="0 0 30 90"><rect x="13" y="30" width="4" height="60" fill="#5A3A1E" /><rect x="6" y="6" width="18" height="26" rx="4" fill="#FFB84D" stroke="#5A3A1E" strokeWidth="3" /><rect x="10" y="0" width="10" height="6" rx="2" fill="#5A3A1E" /><rect x="10" y="10" width="10" height="18" rx="3" fill="#FFF1B8" className="wa-shine" /></symbol>
    </defs>
  );
}

const Use = ({ id, x, y, w, h, ...rest }) => <use href={`#${id}`} x={x} y={y} width={w} height={h} {...rest} />;

function Windmill({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="66" rx="60" ry="20" fill="#B0DA98" /><path d="M-22 64 L-14 8 H14 L22 64z" fill="#F2E3C8" /><path d="M0 8 L14 8 L22 64 H0z" fill="#D8C4A0" /><path d="M-18 10 q18 -14 36 0z" fill="#E0503A" /><rect x="-5" y="44" width="10" height="20" rx="4" fill="#5A3A1E" /><rect x="-5" y="20" width="10" height="9" rx="2" fill="#8FD3F4" />
      <g transform="translate(0 16)"><g className="wa-spin"><path d="M0 0 L-4 -46 H4z M0 0 L46 -4 V4z M0 0 L4 46 H-4z M0 0 L-46 4 V-4z" fill="#8B5A2B" /><path d="M-1 -44 h-12 v30 h12z" fill="#fff" stroke="#8B5A2B" strokeWidth="2" /><path d="M44 -1 v-12 h-30 v12z" fill="#fff" stroke="#8B5A2B" strokeWidth="2" /><path d="M1 44 h12 v-30 h-12z" fill="#fff" stroke="#8B5A2B" strokeWidth="2" /><path d="M-44 1 v12 h30 v-12z" fill="#fff" stroke="#8B5A2B" strokeWidth="2" /><circle r="5" fill="#5A3A1E" /></g></g>
    </g>
  );
}

function Castle({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cy="86" rx="150" ry="22" fill="#CFBDE8" /><rect x="-92" y="20" width="184" height="66" rx="6" fill="#DCCBEF" /><rect x="-92" y="20" width="184" height="10" fill="#C9B4E4" />
      {[-84, -56, -28, 0, 28, 56].map((bx) => <rect key={bx} x={bx} y="8" width="16" height="16" fill="#DCCBEF" />)}
      <rect x="-118" y="-30" width="52" height="116" rx="8" fill="#E6D8F5" /><rect x="66" y="-30" width="52" height="116" rx="8" fill="#E6D8F5" /><path d="M-122 -30 l30 -34 30 34z" fill="#A560E8" /><path d="M62 -30 l30 -34 30 34z" fill="#A560E8" /><rect x="-24" y="-60" width="48" height="146" rx="8" fill="#F0E6FA" /><path d="M-30 -60 l30 -40 30 40z" fill="#CE82FF" /><rect x="-14" y="40" width="28" height="46" rx="14" fill="#7A4A22" />
      <rect x="-8" y="-20" width="16" height="22" rx="8" fill="#FFF1B8" className="wa-shine" /><rect x="-100" y="10" width="14" height="20" rx="7" fill="#FFF1B8" className="wa-shine" /><rect x="86" y="10" width="14" height="20" rx="7" fill="#FFF1B8" className="wa-shine" />
      <rect x="-1" y="-124" width="2" height="26" fill="#5A3A1E" /><g className="wa-flag"><path d="M1 -124 l26 6 -26 6z" fill="#FF4B4B" /></g><rect x="-93" y="-88" width="2" height="26" fill="#5A3A1E" /><g className="wa-flag"><path d="M-91 -88 l22 5 -22 5z" fill="#FFC800" /></g><rect x="91" y="-88" width="2" height="26" fill="#5A3A1E" /><g className="wa-flag"><path d="M93 -88 l22 5 -22 5z" fill="#1CB0F6" /></g>
    </g>
  );
}

export function Fox({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} className="wfox" aria-hidden="true">
      <g className="wa-breathe"><ellipse cy="46" rx="34" ry="8" fill="#000" opacity=".15" />
        <g className="wa-tail"><path d="M22 26 q34 -4 36 -34 q6 16 -6 30 q-10 12 -30 10z" fill="#E86E12" /><path d="M46 -6 q6 10 0 20" fill="none" stroke="#FFE1B3" strokeWidth="6" strokeLinecap="round" /></g>
        <ellipse cy="26" rx="26" ry="22" fill="#E86E12" /><ellipse cy="30" rx="16" ry="14" fill="#FFF0DC" />
        <ellipse cx="-14" cy="44" rx="9" ry="5" fill="#C95A0E" /><ellipse cx="14" cy="44" rx="9" ry="5" fill="#C95A0E" />
        <g className="wa-arm" style={{ animationDelay: '1s' }}><rect x="-30" y="14" width="12" height="24" rx="6" fill="#E86E12" /></g>
        <g transform="translate(0 -8)"><ellipse rx="30" ry="27" fill="url(#wfox)" /><path d="M-26 -8 L-22 -36 L-4 -16z M26 -8 L22 -36 L4 -16z" fill="#E86E12" /><path d="M-20 -12 L-18 -28 L-9 -17z M20 -12 L18 -28 L9 -17z" fill="#FFD1A6" /><ellipse cy="12" rx="18" ry="13" fill="#FFF0DC" />
          <g className="wa-eye"><ellipse cx="-10" cy="1" rx="5.5" ry="6.5" fill="#fff" /><ellipse cx="-9" cy="2" rx="3" ry="3.8" fill="#2A1A0A" /><circle cx="-8" cy="0" r="1.2" fill="#fff" /></g>
          <g className="wa-eye" style={{ animationDelay: '.1s' }}><ellipse cx="10" cy="1" rx="5.5" ry="6.5" fill="#fff" /><ellipse cx="11" cy="2" rx="3" ry="3.8" fill="#2A1A0A" /><circle cx="12" cy="0" r="1.2" fill="#fff" /></g>
          <path d="M-16 -8 q4 -3 8 0 M8 -8 q4 -3 8 0" fill="none" stroke="#B0521A" strokeWidth="2" strokeLinecap="round" /><ellipse cy="10" rx="3.5" ry="2.5" fill="#3A2A1A" /><path d="M-6 15 q6 6 12 0" fill="none" stroke="#3A2A1A" strokeWidth="2.5" strokeLinecap="round" /><circle cx="-18" cy="9" r="4" fill="#FF8FA3" opacity=".7" /><circle cx="18" cy="9" r="4" fill="#FF8FA3" opacity=".7" /></g>
      </g>
    </g>
  );
}

function Lake({ x, y }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx="92" ry="40" fill="#8FD3F4" /><ellipse cx={x} cy={y} rx="80" ry="32" fill="url(#wwater)" />
      <g className="wa-ripple"><path d={`M${x - 50} ${y - 6} q10 -4 20 0 t20 0`} fill="none" stroke="#D5F1FF" strokeWidth="3" strokeLinecap="round" opacity=".8" /><path d={`M${x - 10} ${y + 10} q10 -4 20 0 t20 0`} fill="none" stroke="#D5F1FF" strokeWidth="3" strokeLinecap="round" opacity=".8" /></g>
      <g transform={`translate(${x + 10} ${y - 2})`}><path d="M-8 4 q8 -12 22 -4 q-6 6 -22 4z" fill="#fff" /><path d="M-6 2 q2 -14 -4 -16 q10 2 8 10" fill="#fff" /><path d="M-10 -14 l-6 2 6 3z" fill="#FF9600" /><circle cx="-6" cy="-12" r="1.2" fill="#3A2A1A" /></g>
    </g>
  );
}

export function River({ y }) {
  return (
    <g>
      <path d={`M0 ${y - 24} q60 -14 120 0 t120 0 t120 0 t60 0 v50 q-60 14 -120 0 t-120 0 t-120 0 t-60 0z`} fill="#8FD3F4" />
      <path d={`M0 ${y - 18} q60 -12 120 0 t120 0 t120 0 t60 0 v38 q-60 12 -120 0 t-120 0 t-120 0 t-60 0z`} fill="url(#wwater)" />
      <g className="wa-ripple">{[30, 120, 250, 330].map((x) => <path key={x} d={`M${x} ${y + (x % 3) * 4} q10 -4 20 0 t20 0`} fill="none" stroke="#D5F1FF" strokeWidth="3" strokeLinecap="round" opacity=".8" />)}</g>
    </g>
  );
}

export function Bridge({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-40" y="-40" width="80" height="80" rx="10" fill="#B07A44" />
      {[-32, -20, -8, 4, 16, 28].map((yy) => <rect key={yy} x="-38" y={yy} width="76" height="9" rx="3" fill="#D9A76A" />)}
      <rect x="-44" y="-44" width="8" height="88" rx="3" fill="#7A4A22" /><rect x="36" y="-44" width="8" height="88" rx="3" fill="#7A4A22" />
    </g>
  );
}

/** Where a unit's river crosses the road, if it is river country. */
export function riverFor(items, unit) {
  if (unit.land !== 'river') return null;
  const chest = items.find((i) => i.unit === unit && i.kind === 'chest');
  const road = items.filter((i) => i.kind !== 'banner');
  const prev = road[road.indexOf(chest) - 1];
  return { y: chest.y + 54, bridgeX: (chest.x + prev.x) / 2 };
}

const LAND_FILL = { meadow: '#BFE3A8', river: '#CFEBB0', evening: '#E9DDF7' };

export function Ground({ items, units, height }) {
  // one rect per unit, then hill silhouettes in the lower land's colour rising into the upper one
  return (
    <g>
      <rect width={WORLD_W} height={height} fill={LAND_FILL[units[0].land]} />
      {units.map((u, i) => {
        const { bottom } = unitBounds(items, u);
        return <rect key={u.index} width={WORLD_W} height={bottom + 40} fill={LAND_FILL[u.land]} />;
      })}
      {units.slice(1).map((u, i) => {
        const below = units[i]; const { bottom } = unitBounds(items, u);
        return <g key={u.index}><ellipse cx="60" cy={bottom + 44} rx="200" ry="46" fill={LAND_FILL[below.land]} /><ellipse cx="340" cy={bottom + 44} rx="220" ry="38" fill={LAND_FILL[below.land]} /></g>;
      })}
      <rect width={WORLD_W} height={unitBounds(items, units[units.length - 1]).top + 140} fill="url(#wsky)" />
      {[[40, 170, 260, 60, '#CFBDE8'], [360, 160, 220, 50, '#D8C8EE'], [40, 200, 200, 60, '#E9DDF7'], [330, 210, 220, 50, '#E9DDF7']].map(([cx, dy, rx, ry, c]) => <ellipse key={cx + dy} cx={cx} cy={unitBounds(items, units[units.length - 1]).top + dy} rx={rx} ry={ry} fill={c} />)}
    </g>
  );
}

/** Props for one unit, placed at fractions of its height and on the side away from the road. */
export function UnitProps({ items, unit, isLast }) {
  const { bottom: b, top: t } = unitBounds(items, unit);
  const h = b - t, road = items.filter((i) => i.kind !== 'banner');
  const at = (f) => b - h * f;
  const side = (f, w = 60) => (freeSide(road, at(f)) === 62 ? 8 : WORLD_W - 8 - w);
  const river = riverFor(items, unit);
  const flower = (f, c, dx = 30) => <Use key={`f${f}`} id="wflower" x={side(f, 16) + dx} y={at(f)} w={16} h={16} fill={c} />;
  if (unit.land === 'meadow') {
    return (
      <g>
        {[0.32, 0.62, 0.9].map((f) => <Use key={f} id="woak" x={side(f, 70)} y={at(f)} w={70} h={84} />)}
        {[0.45, 0.78].map((f) => <Use key={f} id="wbush" x={side(f, 64)} y={at(f)} w={64} h={34} />)}
        {[flower(0.28, '#FF6B6B'), flower(0.5, '#FFFFFF', 50), flower(0.7, '#FF8FA3'), flower(0.84, '#FFFFFF', 46)]}
        {[0.38, 0.72].map((f) => <Use key={f} id="wgrass" x={side(f, 30) + 40} y={at(f)} w={30} h={16} />)}
        <Use id="wrock" x={side(0.56, 40)} y={at(0.56)} w={40} h={26} />
        {h > 700 && <Windmill x={side(0.5, 120) + 60} y={at(0.52)} />}
        <Fox x={side(0.2, 90) + 45} y={at(0.2)} />
      </g>
    );
  }
  if (unit.land === 'river') {
    return (
      <g>
        <Lake x={freeSide(road, at(0.8)) === 62 ? 70 : 320} y={at(0.8)} />
        {river && <River y={river.y} />}
        {[0.3, 0.55, 0.92].map((f) => <Use key={f} id="wpine" x={side(f, 56)} y={at(f)} w={56} h={84} />)}
        <Use id="wbush" x={side(0.42, 64)} y={at(0.42)} w={64} h={34} />
        <Use id="wrock" x={side(0.68, 40)} y={at(0.68)} w={40} h={26} />
        {[flower(0.36, '#FFFFFF'), flower(0.74, '#FF8FA3', 44)]}
        {river && <><Use id="wlantern" x={side(0.5, 30) + 10} y={river.y - 150} w={30} h={90} /><Use id="wlantern" x={side(0.3, 30) + 10} y={river.y + 40} w={30} h={90} /></>}
        <Robot x={side(0.74, 60) + 30} y={at(0.74)} />
      </g>
    );
  }
  return (
    <g>
      {[0.3, 0.58, 0.86].map((f) => <Use key={f} id="woak" x={side(f, 70)} y={at(f)} w={70} h={84} />)}
      {[flower(0.4, '#FFD166'), flower(0.66, '#FFFFFF', 44), flower(0.9, '#FFD166')]}
      {[0.48, 0.76].map((f) => <Use key={f} id="wrock" x={side(f, 40)} y={at(f)} w={40} h={26} />)}
      <Use id="wlantern" x={side(0.36, 30) + 10} y={at(0.36)} w={30} h={90} /><Use id="wlantern" x={side(0.7, 30) + 10} y={at(0.7)} w={30} h={90} />
      {[0.33, 0.5, 0.6, 0.72, 0.8, 0.94].map((f, i) => <g key={f} className="wa-spark" style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2.4s' }}><circle cx={side(f, 8) + (i % 2 ? 40 : 4)} cy={at(f)} r="3" fill="#FFE47A" /><circle cx={side(f, 8) + (i % 2 ? 40 : 4)} cy={at(f)} r="7" fill="#FFE47A" opacity=".3" /></g>)}
    </g>
  );
}

/** The castle at the end of the road, whatever land the last unit is. */
export function Finish({ items, units }) {
  const { top } = unitBounds(items, units[units.length - 1]);
  return <Castle x={195} y={top - 70} />;
}

export function Sky({ items, units }) {
  const top = unitBounds(items, units[units.length - 1]).top;
  return (
    <g>
      {[[-40, 30], [-40, 90]].map(([x, y], i) => <g key={y} className="wa-drift" style={{ animationDelay: `${-i * 21}s` }}><use href="#wcloud" x={x} y={y} width={100 + i * 20} height={42 + i * 8} opacity=".95" /></g>)}
      <g className="wa-fly">{[0, 22, 40].map((x, i) => <g key={x} transform={`translate(${x} ${top + 120 + i * 9})`}><g className="wa-flap" style={{ animationDelay: `${i * 0.1}s` }}><path d="M-8 0 q4 -6 8 0 q4 -6 8 0" fill="none" stroke="#3A2A1A" strokeWidth="2.2" strokeLinecap="round" /></g></g>)}</g>
    </g>
  );
}
