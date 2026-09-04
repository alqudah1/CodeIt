import { useEffect, useRef, useState } from 'react';
import './LiveFrame.css';

// ── A project, running, at whatever size the page gives it ──────────────────
//
// The shelf used to render each project in a fixed 132px frame with a
// hard-coded scale. That is fine for one thumbnail and wrong for "their
// stuff, big, running, first". This measures its own box and scales a
// phone-sized document (390 wide) to fill it, so the same component draws a
// full-width hero on a phone and a card in a row on a desktop.
//
// It is deliberately not interactive: a reminder, not the place you play.
// The link around it opens the project where it gets the whole screen.

export const BASE_WIDTH = 390;

export default function LiveFrame({ code, title, className = '' }) {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setBox({ width: rect.width, height: rect.height });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Before the first measurement (and in a renderer with no layout) the
  // document is drawn at its own size and clipped by the box; the first
  // effect corrects it before anyone sees it.
  const measured = box.width > 0;
  const scale = measured ? box.width / BASE_WIDTH : 1;
  const frameHeight = measured ? Math.round(box.height / scale) : Math.round(BASE_WIDTH * 0.79);

  return (
    <span ref={boxRef} className={`liveframe ${className}`.trim()} aria-hidden="true">
      <iframe
        className="liveframe__doc shelf__preview"
        title={title}
        aria-hidden="true"
        tabIndex={-1}
        srcDoc={code}
        sandbox="allow-scripts"
        loading="lazy"
        scrolling="no"
        style={{ width: BASE_WIDTH, height: frameHeight, transform: `scale(${scale})` }}
      />
    </span>
  );
}
