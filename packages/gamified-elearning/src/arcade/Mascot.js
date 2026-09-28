import React, { useEffect, useRef } from 'react';

// ── Pixel, alive ─────────────────────────────────────────────────────────────
//
// The child's guide, drawn as SVG and driven by one animation frame loop:
// it breathes, blinks on its own irregular clock, turns its eyes toward the
// pointer, and takes a mood (`happy`, `hmm`, `lean`) from whatever the child
// just did. A Rive character will replace the drawing; the states stay.

const MOUTH = {
  base: 'M34 55 q8 6 16 0',
  happy: 'M32 54 q10 10 20 0',
  hmm: 'M34 57 q8 -5 16 0',
  lean: 'M34 55 q8 6 16 0',
};

export default function Mascot({ mood = 'base', size = 84, className = '', onClick }) {
  const root = useRef(null);
  const state = useRef({ look: { x: 0, y: 0 }, target: { x: 0, y: 0 }, blinkAt: 0, blinking: 0 });

  useEffect(() => {
    const el = root.current; if (!el) return undefined;
    const s = state.current;
    const eyes = [el.querySelector('.mz-eL'), el.querySelector('.mz-eR')];
    const pupils = [el.querySelector('.mz-pL'), el.querySelector('.mz-pR')];
    const body = el.querySelector('.mz-body');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      s.target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 140));
      s.target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / 140));
    };
    window.addEventListener('pointermove', onMove);
    let raf = 0;
    const tick = (now) => {
      if (!reduced) {
        const br = 1 + Math.sin(now / 600) * 0.025;
        body.style.transform = `scaleY(${br}) translateY(${(br - 1) * -20}px)`;
        if (!s.blinkAt) s.blinkAt = now + 1500;
        if (now > s.blinkAt) { s.blinking = 1; s.blinkAt = now + 2200 + Math.random() * 2600; }
        if (s.blinking) { s.blinking += 1; const ry = s.blinking < 5 ? 0.9 : 6; eyes.forEach((e) => e.setAttribute('ry', ry)); if (s.blinking > 8) s.blinking = 0; }
      }
      s.look.x += (s.target.x - s.look.x) * 0.12; s.look.y += (s.target.y - s.look.y) * 0.12;
      pupils[0].setAttribute('cx', 34 + s.look.x * 2.4); pupils[0].setAttribute('cy', 43 + s.look.y * 2);
      pupils[1].setAttribute('cx', 52 + s.look.x * 2.4); pupils[1].setAttribute('cy', 43 + s.look.y * 2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); };
  }, []);

  useEffect(() => {
    const el = root.current; if (!el) return;
    const jump = el.querySelector('.mz-jump');
    jump.style.transition = 'transform .28s cubic-bezier(.3,1.6,.4,1)';
    jump.style.transform = mood === 'happy' ? 'translateY(-10px) scale(1.06)' : mood === 'lean' ? 'translateX(-8px) rotate(6deg)' : '';
  }, [mood]);

  return (
    <svg ref={root} className={`mascot ${className}`} width={size} height={size} viewBox="0 0 84 84" aria-hidden="true" onClick={onClick} data-mood={mood}>
      <ellipse cx="42" cy="78" rx="24" ry="4" fill="rgba(53,34,14,.15)" />
      <g className="mz-jump">
        <g className="mz-body" style={{ transformOrigin: '42px 70px' }}>
          <rect x="16" y="18" width="52" height="52" rx="16" fill="#3EB7F8" stroke="#35220E" strokeWidth="3" />
          <ellipse className="mz-eL" cx="33" cy="42" rx="6" ry="6" fill="#fff" stroke="#35220E" strokeWidth="2" />
          <ellipse className="mz-eR" cx="51" cy="42" rx="6" ry="6" fill="#fff" stroke="#35220E" strokeWidth="2" />
          <circle className="mz-pL" cx="34" cy="43" r="2.6" fill="#35220E" />
          <circle className="mz-pR" cx="52" cy="43" r="2.6" fill="#35220E" />
          <path className="mz-mouth" d={MOUTH[mood] || MOUTH.base} fill="none" stroke="#35220E" strokeWidth="3" strokeLinecap="round" />
          <rect x="28" y="6" width="28" height="14" rx="7" fill="#FF7A00" stroke="#35220E" strokeWidth="3" />
          <circle cx="42" cy="6" r="4" fill="#FFC93C" stroke="#35220E" strokeWidth="2" />
        </g>
      </g>
    </svg>
  );
}
