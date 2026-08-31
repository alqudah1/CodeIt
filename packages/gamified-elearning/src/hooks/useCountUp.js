import { useEffect, useRef, useState } from 'react';

// ── Numbers that arrive, instead of appearing ───────────────────────────────
//
// Part of the juice pass: a stat that counts up to its value reads as
// something happening to YOU; a stat that just sits there reads as a
// database. One hook, used by the level card, the trophy stats and the quiz
// result, so every number in the product arrives the same way.
//
// Two honesty rules: the animation never shows a value higher than the real
// one, and anyone who asks their device for reduced motion gets the real
// number immediately.

export default function useCountUp(target, { duration = 700 } = {}) {
  const value = Number(target) || 0;
  const [shown, setShown] = useState(() => prefersStill() ? value : 0);
  const raf = useRef(null);

  useEffect(() => {
    if (prefersStill() || value <= 0) { setShown(value); return undefined; }
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t) * (1 - t); // ease-out cubic
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return shown;
}

function prefersStill() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
