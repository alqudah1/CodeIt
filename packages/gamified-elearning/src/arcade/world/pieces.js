import React from 'react';
import { WORLD_W } from '../worldLayout';

// ── The things that stand on the road ────────────────────────────────────────
//
// Stones are flat tops on a thick dark side, so they read as objects you can
// press. Locked stones wear the unit colour in a lighter tint, never grey:
// the road ahead should look like somewhere worth going. Chests and
// trophies are prizes on the road, visible before they are earned.

const ICONS = {
  star: (x, y, c) => <path d={`M${x} ${y - 14} l4.2 8.6 9.5 1.4 -6.9 6.7 1.6 9.4 -8.4 -4.5 -8.4 4.5 1.6 -9.4 -6.9 -6.7 9.5 -1.4z`} fill={c} />,
  tick: (x, y, c) => <path d={`M${x - 12} ${y} l8 8 16 -16`} fill="none" stroke={c} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />,
  lock: (x, y, c) => <g><rect x={x - 9} y={y - 3} width="18" height="14" rx="4" fill={c} /><path d={`M${x - 5} ${y - 3} v-4 a5 5 0 0 1 10 0 v4`} fill="none" stroke={c} strokeWidth="3.5" /></g>,
  crown: (x, y, c) => <path d={`M${x - 16} ${y + 8} l-3 -20 10 9 9 -14 9 14 10 -9 -3 20z`} fill={c} />,
};

export function Stone({ item, status, progress = 0, onPress, onOpen }) {
  const { x, y, unit, boss, title } = item;
  const locked = status === 'ahead';
  const r = status === 'next' ? 40 : boss ? 37 : 33;
  const top = locked ? unit.tint : unit.colour, side = locked ? unit.tintD : unit.dark;
  const icon = boss ? ICONS.crown(x, y, locked ? '#fff' : '#FFF1B8') : status === 'done' ? ICONS.tick(x, y, '#fff') : status === 'next' ? ICONS.star(x, y + 2, '#fff') : ICONS.lock(x, y, '#fff');
  const label = `Lesson ${item.id}: ${item.fullTitle || title}${status === 'done' ? ', done' : status === 'next' ? ', start' : ''}`;
  // the sign hangs under the stone, kept inside the world
  const tw = title.length * 7.6 + 18;
  const lx = Math.max(8 + tw / 2, Math.min(WORLD_W - 8 - tw / 2, x));
  const ly = y + r * 0.86 + 16;
  // progress ring: how far into the lesson the child got (0..1)
  const ang = Math.max(0.02, Math.min(0.999, progress)) * Math.PI * 2 - Math.PI / 2;
  const ex = x + Math.cos(ang) * 52, ey = y + 4 + Math.sin(ang) * 46;
  return (
    <g className={`wnode wnode--${status}${boss ? ' wnode--boss' : ''}`} data-id={item.id}>
      {status === 'next' && (
        <g>
          <ellipse className="wa-ring" cx={x} cy={y + 4} rx="54" ry="48" fill={unit.colour} opacity=".22" />
          <ellipse cx={x} cy={y + 4} rx="52" ry="46" fill="none" stroke="#FFF6E0" strokeWidth="8" />
          {progress > 0 && <path d={`M${x} ${y - 42} A52 46 0 ${progress > 0.5 ? 1 : 0} 1 ${ex} ${ey}`} fill="none" stroke={unit.colour} strokeWidth="8" strokeLinecap="round" />}
        </g>
      )}
      <g className="wstone" role="button" tabIndex={0} aria-label={label} onPointerDown={onPress} onClick={(e) => onOpen(item.id, e)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(item.id, e); }}>
        <ellipse cx={x} cy={y + 10} rx={r + 6} ry={r * 0.86 + 4} fill="#000" opacity=".12" />
        <ellipse cx={x} cy={y + 9} rx={r} ry={r * 0.86} fill={side} />
        <ellipse cx={x} cy={y} rx={r} ry={r * 0.86} fill={top} />
        <ellipse cx={x - r * 0.25} cy={y - r * 0.35} rx={r * 0.45} ry={r * 0.2} fill="#fff" opacity=".3" />
        {icon}
      </g>
      {status === 'next' && (
        <g className="wa-bob wstart" aria-hidden="true">
          <rect x={x - 38} y={y - 84} width="76" height="30" rx="12" fill="#fff" stroke="#E5E5E5" strokeWidth="2.5" />
          <path d={`M${x - 8} ${y - 54} l8 8 8 -8z`} fill="#fff" stroke="#E5E5E5" strokeWidth="2.5" /><rect x={x - 8} y={y - 58} width="16" height="6" fill="#fff" />
          <text x={x} y={y - 64} textAnchor="middle" fontSize="14" fontWeight="900" fill={unit.colour} letterSpacing="1">START</text>
        </g>
      )}
      <rect x={lx - tw / 2} y={ly} width={tw} height="24" rx="8" fill="rgba(255,255,255,.85)" />
      <text className="wlabel" x={lx} y={ly + 17} textAnchor="middle" fontSize="13" fontWeight="900" fill={locked ? '#7A6A5A' : '#3A2A1A'}>{title}</text>
    </g>
  );
}

export function Banner({ item }) {
  const { y, unit } = item;
  return (
    <g className="wbanner">
      <rect x="16" y={y - 88} width="358" height="76" rx="18" fill={unit.dark} /><rect x="16" y={y - 94} width="358" height="76" rx="18" fill={unit.colour} />
      <text x="34" y={y - 66} fontSize="13" fontWeight="900" fill="#fff" opacity=".85" letterSpacing="1">UNIT {unit.index}</text>
      <text x="34" y={y - 40} fontSize="20" fontWeight="900" fill="#fff">{unit.name}</text>
      <rect x="296" y={y - 80} width="62" height="48" rx="12" fill="rgba(0,0,0,.18)" /><rect x="296" y={y - 84} width="62" height="48" rx="12" fill="rgba(255,255,255,.28)" />
      <rect x="316" y={y - 74} width="22" height="28" rx="3" fill="#fff" /><path d={`M320 ${y - 66} h14 M320 ${y - 60} h14 M320 ${y - 54} h9`} stroke={unit.colour} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

/** ready: its lesson is done and it has not been opened; open: opened; locked otherwise. */
export function Chest({ item, state, onOpen }) {
  const locked = state === 'locked', open = state === 'open';
  const wood = locked ? '#B8A08A' : '#C98A4B', woodD = locked ? '#8F7A66' : '#8E5A2A', gold = locked ? '#D9CBB0' : '#FFC800', goldD = locked ? '#B8A98C' : '#E5A800';
  return (
    <g className={`wchest wchest--${state}`} transform={`translate(${item.x} ${item.y})`} role={locked ? undefined : 'button'} tabIndex={locked ? undefined : 0} aria-label={locked ? 'Chest, locked' : open ? 'Chest, opened' : 'Chest, tap to open'} onClick={locked ? undefined : (e) => onOpen(item, e)} style={{ cursor: locked ? 'default' : 'pointer' }}>
      <ellipse cy="34" rx="34" ry="9" fill="#000" opacity=".15" />
      <g className="wchest__body">
        <g className="wchest__lid" style={open ? { transform: 'translateY(-16px) rotate(-14deg) scaleY(.85)' } : undefined}><path d="M-30 -2 a30 18 0 0 1 60 0 v8 h-60z" fill={wood} stroke={woodD} strokeWidth="3" /><rect x="-30" y="0" width="60" height="7" fill={gold} stroke={goldD} strokeWidth="2" /></g>
        <rect x="-30" y="6" width="60" height="28" rx="5" fill={wood} stroke={woodD} strokeWidth="3" />
        <rect x="-20" y="-2" width="6" height="36" fill={gold} stroke={goldD} strokeWidth="2" /><rect x="14" y="-2" width="6" height="36" fill={gold} stroke={goldD} strokeWidth="2" />
        <rect x="-7" y="6" width="14" height="14" rx="3" fill={gold} stroke={goldD} strokeWidth="2" /><circle cy="13" r="2" fill={woodD} />
        {state === 'ready' && <><g className="wa-spark"><path d="M-40 -18 l3 -8 3 8 8 3 -8 3 -3 8 -3 -8 -8 -3z" fill="#FFE47A" /></g><g className="wa-spark" style={{ animationDelay: '.8s' }}><path d="M38 -6 l2 -6 2 6 6 2 -6 2 -2 6 -2 -6 -6 -2z" fill="#FFE47A" /></g></>}
        {open && <text y="-14" textAnchor="middle" fontSize="26" className="wchest__sticker">{item.emoji}</text>}
      </g>
    </g>
  );
}

export function Trophy({ item, won }) {
  const c = won ? '#FFC800' : '#D9D2C8', d = won ? '#E5A800' : '#B8AFA3';
  return (
    <g className={`wtrophy${won ? ' wtrophy--won' : ''}`} transform={`translate(${item.x} ${item.y})`} aria-label={`${item.unit.name} trophy${won ? ', won' : ''}`} role="img">
      <ellipse cy="36" rx="34" ry="9" fill="#000" opacity=".15" /><rect x="-18" y="22" width="36" height="12" rx="4" fill={item.unit.dark} /><rect x="-18" y="18" width="36" height="12" rx="4" fill={item.unit.colour} /><rect x="-6" y="6" width="12" height="14" fill={d} />
      <path d="M-26 -26 h52 v14 a26 24 0 0 1 -52 0z" fill={d} /><path d="M-26 -30 h52 v14 a26 24 0 0 1 -52 0z" fill={c} /><path d="M-26 -22 q-16 0 -14 14 q2 12 14 10 M26 -22 q16 0 14 14 q-2 12 -14 10" fill="none" stroke={d} strokeWidth="6" strokeLinecap="round" /><path d="M-12 -20 l5 10 -10 0z" fill="#fff" opacity=".6" />
      {won && <g className="wa-spark"><path d="M30 -34 l2 -6 2 6 6 2 -6 2 -2 6 -2 -6 -6 -2z" fill="#fff" /></g>}
      <rect x="-44" y="46" width="88" height="24" rx="8" fill="rgba(255,255,255,.85)" /><text y="63" textAnchor="middle" fontSize="12" fontWeight="900" fill="#7A6A5A">{won ? 'Unit won' : 'Unit trophy'}</text>
    </g>
  );
}

export function Robot({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true"><g className="wa-float"><ellipse cy="44" rx="24" ry="6" fill="#000" opacity=".12" /><rect x="-22" y="-10" width="44" height="40" rx="12" fill="#1CB0F6" /><rect x="-22" y="20" width="44" height="10" rx="5" fill="#1899D6" /><rect x="-16" y="-2" width="32" height="18" rx="6" fill="#0B2E4A" /><g className="wa-eye"><circle cx="-7" cy="7" r="4" fill="#7CFFB0" /></g><g className="wa-eye" style={{ animationDelay: '.3s' }}><circle cx="7" cy="7" r="4" fill="#7CFFB0" /></g><rect x="-3" y="-22" width="6" height="12" fill="#1899D6" /><circle cy="-24" r="5" fill="#FF4B4B" /><rect x="-30" y="0" width="8" height="20" rx="4" fill="#1899D6" /><rect x="22" y="0" width="8" height="20" rx="4" fill="#1899D6" /></g></g>
  );
}
