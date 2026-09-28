import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCharacterDisplay } from '../context/CharacterContext';
import CharacterAvatar from '../components/CharacterAvatar/CharacterAvatar';
import { ENDPOINTS } from '../config/api';
import { lessonSummaries, TOTAL_LESSONS } from '../pages/Lessons/lessonRegistry';
import { layoutNodes, worldHeight, trailPath, statusFor, nextLesson, isBoss, WORLD_W } from './worldLayout';
import { createParticles } from './kit/particles';
import { play } from './kit/sound';
import { haptic } from './kit/haptic';
import Mascot from './Mascot';
import Key from './kit/Key';
import './World.css';

// ── The world: where a child's lessons live ──────────────────────────────────
//
// Not a list. A place: a painted sky that drifts on its own, a winding path
// up the world, one lit node with the child's own avatar standing on it, a
// daily chest beside it, and Pixel in the corner watching. The view opens
// scrolled to the lit node, so the first thing on screen is the next thing
// to do.

function useSky(canvasRef, active) {
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !active) return undefined;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 1, H = 1, raf = 0; const t0 = performance.now();
    const clouds = Array.from({ length: 6 }, (_, i) => ({ x: Math.random() * 400, y: 40 + i * 70 + Math.random() * 30, s: 0.7 + Math.random() * 0.8, v: 0.08 + Math.random() * 0.12 }));
    const flies = Array.from({ length: 16 }, () => ({ x: Math.random(), y: 0.3 + Math.random() * 0.65, p: Math.random() * 6.28, r: 1.5 + Math.random() * 1.5 }));
    const size = () => { const r = canvas.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height); const d = Math.min(2, window.devicePixelRatio || 1); canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const cloud = (x, y, s, a) => { ctx.fillStyle = `rgba(255,255,255,${a})`; for (const [dx, dy, r] of [[0, 0, 22], [24, -8, 28], [52, 0, 22], [26, 8, 24]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 6.28); ctx.fill(); } };
    const draw = (now) => {
      const t = (now - t0) / 1000;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#CFEBFF'); g.addColorStop(0.55, '#FFF1D6'); g.addColorStop(1, '#FFE0B8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W - 56, 56); ctx.rotate(t * 0.15); ctx.fillStyle = 'rgba(255,201,60,.35)';
      for (let i = 0; i < 12; i += 1) { ctx.rotate(Math.PI / 6); ctx.fillRect(-6, -110, 12, 110); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(W - 56, 56, 30, 0, 6.28); ctx.fillStyle = '#FFC93C'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#35220E'; ctx.stroke();
      clouds.forEach((c, i) => { if (!reduced) c.x += c.v * (i % 2 ? 1 : 0.6); if (c.x > W + 80) c.x = -100; cloud(c.x, c.y * (H / 620), c.s, i % 2 ? 0.95 : 0.7); });
      ctx.fillStyle = '#CFF0E1'; ctx.beginPath(); ctx.moveTo(0, H * 0.62); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.62 + Math.sin(x / 55 + t * 0.2) * 10 + Math.sin(x / 23) * 4); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      ctx.fillStyle = '#A9E3C8'; ctx.beginPath(); ctx.moveTo(0, H * 0.78); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * 0.78 + Math.cos(x / 40 - t * 0.25) * 8); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      flies.forEach((f) => { if (!reduced) f.p += 0.02; const x = f.x * W + Math.sin(f.p) * 14, y = f.y * H + Math.cos(f.p * 0.7) * 10; ctx.fillStyle = `rgba(255,201,60,${0.4 + Math.sin(f.p * 2) * 0.35})`; ctx.beginPath(); ctx.arc(x, y, f.r + Math.sin(f.p * 3), 0, 6.28); ctx.fill(); });
      raf = reduced ? 0 : requestAnimationFrame(draw);
    };
    size(); window.addEventListener('resize', size); raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', size); };
  }, [canvasRef, active]);
}

// The chest sits off the path, on the side the trail is not about to use.
function chestSpot(nodes, n) {
  const after = nodes[n.id] || n;
  const x = Math.max(40, Math.min(WORLD_W - 40, n.x + (after.x >= n.x ? -110 : 110)));
  return { x, y: n.y + 60 };
}

export default function World() {
  const { token } = useContext(AuthContext) || {};
  const { character } = useCharacterDisplay();
  const navigate = useNavigate();
  const lessons = useMemo(() => lessonSummaries(), []);
  const [completed, setCompleted] = useState([]);
  const [loaded, setLoaded] = useState(!token);
  const [mood, setMood] = useState('base');
  const skyRef = useRef(null), fxRef = useRef(null), scrollRef = useRef(null), fx = useRef(null);
  useSky(skyRef, true);

  useEffect(() => {
    if (!token) return undefined;
    let live = true;
    fetch(ENDPOINTS.lessons.progress, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live && d?.completedLessons) setCompleted(d.completedLessons.map(Number)); })
      .catch(() => {})
      .finally(() => { if (live) setLoaded(true); });
    return () => { live = false; };
  }, [token]);

  useEffect(() => { fx.current = createParticles(fxRef.current); return () => fx.current?.destroy(); }, []);

  const nodes = useMemo(() => layoutNodes(lessons.length), [lessons.length]);
  const next = nextLesson(completed, lessons.length);
  const height = worldHeight(lessons.length);

  // Open on the lit node. The path is drawn bottom-up, so "up" is "later".
  useEffect(() => {
    if (!loaded) return;
    const el = scrollRef.current; if (!el) return;
    const node = nodes.find((n) => n.id === next);
    const scale = el.clientWidth / WORLD_W;
    const y = (height - node.y) * scale;
    el.scrollTo({ top: Math.max(0, y - el.clientHeight * 0.55), behavior: 'auto' });
  }, [loaded, next, nodes, height]);

  function cheer(x, y) { setMood('happy'); setTimeout(() => setMood('base'), 900); if (fx.current) fx.current.burst(x, y, 30, true); }

  function openLesson(id, e) {
    if (e) { const r = fxRef.current.getBoundingClientRect(); cheer(e.clientX - r.left, e.clientY - r.top); }
    setTimeout(() => navigate(`/lesson/${id}`), 220);
  }

  const doneCount = completed.length;
  const trailAll = trailPath(nodes);
  const trailDone = trailPath(nodes, Math.max(1, next));

  return (
    <div className="world" data-next={next}>
      <canvas ref={skyRef} className="world__sky" aria-hidden="true" />
      <div className="world__hud">
        <h1 className="world__title">Python Path</h1>
        <span className="world__count" aria-label={`${doneCount} of ${lessons.length} lessons done`}>{doneCount} / {lessons.length}</span>
      </div>
      <div className="world__scroll" ref={scrollRef}>
        <div className="world__map" style={{ aspectRatio: `${WORLD_W} / ${height}` }}>
          <svg className="world__trail" viewBox={`0 0 ${WORLD_W} ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <g transform={`translate(0 ${height}) scale(1 -1)`}>
              <path d={trailAll} fill="none" stroke="#35220E" strokeWidth="5" strokeDasharray="1 14" strokeLinecap="round" opacity=".45" />
              <path d={trailDone} fill="none" stroke="#17C08B" strokeWidth="7" strokeLinecap="round" className="world__trail-done" />
            </g>
          </svg>
          {nodes.map((n) => {
            const lesson = lessons[n.id - 1];
            const status = statusFor(n.id, completed);
            const boss = isBoss(n.id);
            const left = `${(n.x / WORLD_W) * 100}%`, top = `${((height - n.y) / height) * 100}%`;
            const titled = Math.abs(n.id - next) <= 1;
            return (
              <React.Fragment key={n.id}>
                <button
                  type="button"
                  className={`wnode wnode--${status}${boss ? ' wnode--boss' : ''}`}
                  style={{ left, top, animationDelay: `${(n.id % 4) * -0.8}s` }}
                  aria-label={`Lesson ${n.id}: ${lesson.title}${status === 'done' ? ', done' : status === 'next' ? ', start' : ''}`}
                  onPointerDown={() => { play('tap'); haptic('tap'); }}
                  onClick={(e) => openLesson(n.id, e)}
                >
                  {status === 'next' ? (
                    <><span className="wnode__start">Start</span><span className="wnode__you"><CharacterAvatar character={character} compact size={boss ? 56 : 50} /></span></>
                  ) : boss ? '★' : n.id}
                </button>
                {titled && (
                  <span className={`wlabel${n.x > WORLD_W / 2 ? ' wlabel--left' : ''}`} style={{ left, top }}>
                    {boss ? 'Boss: ' : ''}{lesson.title}
                  </span>
                )}
                {status === 'next' && (
                  <svg className="wchest" style={{ left: `${(chestSpot(nodes, n).x / WORLD_W) * 100}%`, top: `${((height - chestSpot(nodes, n).y) / height) * 100}%` }} viewBox="0 0 56 48" aria-label="Daily chest" role="img" onClick={(e) => { play('chest'); haptic('chest'); const r = fxRef.current.getBoundingClientRect(); cheer(e.clientX - r.left, e.clientY - r.top); }}>
                    <rect x="3" y="18" width="50" height="27" rx="6" fill="#FFC93C" stroke="#35220E" strokeWidth="3" />
                    <path d="M3 22a25 15 0 0 1 50 0v2H3z" fill="#FF7A00" stroke="#35220E" strokeWidth="3" />
                    <rect x="23" y="20" width="10" height="12" rx="2" fill="#35220E" />
                  </svg>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <Mascot className="world__mascot" mood={mood} onClick={() => { play('good'); cheer(0, 0); }} />
      <div className="world__cta">
        <Key onClick={() => openLesson(next)}>{completed.includes(next) ? 'Play again' : `${next === 1 ? 'Start' : 'Continue'}: ${lessons[next - 1].title}`}</Key>
      </div>
      <canvas ref={fxRef} className="world__fx" aria-hidden="true" />
    </div>
  );
}

export { TOTAL_LESSONS };
