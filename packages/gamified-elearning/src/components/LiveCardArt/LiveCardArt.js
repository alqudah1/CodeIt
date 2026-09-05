import { useEffect, useRef, useState } from 'react';
import LiveFrame from '../../pages/Home/LiveFrame';
import './LiveCardArt.css';

// ── Card art that is the game, not an icon of a game ─────────────────────────
//
// Rounds 68 to 71: a grid of twelve Explore cards with the same controller
// glyph looked like one card twelve times, and the studio's starter shelf
// had the same problem. The home page had already solved it: "Pick one and
// it is yours" shows catch-the-stars actually running.
//
// Twenty live iframes on a phone will not work, so:
//
//   1. Only what is on screen animates. An IntersectionObserver starts a
//      card's frame when it scrolls into view and tears it down when it
//      leaves. At most MAX_RUNNING at once, never twelve.
//   2. Everything else keeps its icon. The icon is the resting state and the
//      loading state.
//   3. The preview is not interactive (LiveFrame sets pointer-events: none),
//      so a tap goes to the card, not into the game.
//   4. prefers-reduced-motion keeps the static icon.

export const MAX_RUNNING = 3;
const running = new Set();
const waiting = new Set();

function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

// Cards that are visible but had no slot get one when a slot frees.
function release(id) {
  running.delete(id);
  const next = waiting.values().next().value;
  if (next) { waiting.delete(next); next(); }
}

export default function LiveCardArt({ code, loadCode, title, placeholder, className = '' }) {
  const boxRef = useRef(null);
  const idRef = useRef({});
  const [visible, setVisible] = useState(false);
  const [live, setLive] = useState(false);
  const [doc, setDoc] = useState(typeof code === 'string' ? code : '');

  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof IntersectionObserver === 'undefined' || reducedMotion()) return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '0px', threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Take a slot while visible; give it back when not.
  useEffect(() => {
    const id = idRef.current;
    if (!visible) {
      waiting.delete(id.wake);
      if (running.has(id)) release(id);
      setLive(false);
      return undefined;
    }
    let cancelled = false;
    const start = () => { if (!cancelled) { running.add(id); setLive(true); } };
    if (running.size < MAX_RUNNING) start();
    else { id.wake = start; waiting.add(start); }
    return () => {
      cancelled = true;
      waiting.delete(id.wake);
      if (running.has(id)) release(id);
    };
  }, [visible]);

  // Code that has to be fetched is fetched once, and only for a card that is
  // actually about to run.
  useEffect(() => {
    if (!live || doc || !loadCode) return undefined;
    let alive = true;
    Promise.resolve(loadCode()).then((html) => { if (alive && typeof html === 'string' && html) setDoc(html); }).catch(() => {});
    return () => { alive = false; };
  }, [live, doc, loadCode]);

  useEffect(() => { if (typeof code === 'string') setDoc(code); }, [code]);

  const showLive = live && Boolean(doc);
  return (
    <span ref={boxRef} className={`livecard${showLive ? ' livecard--live' : ''} ${className}`.trim()}>
      <span className="livecard__rest" aria-hidden="true">{placeholder}</span>
      {showLive && <LiveFrame className="livecard__frame" code={doc} title={title} />}
    </span>
  );
}
