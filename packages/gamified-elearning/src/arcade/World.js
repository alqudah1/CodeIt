import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useCharacterDisplay } from '../context/CharacterContext';
import CharacterAvatar from '../components/CharacterAvatar/CharacterAvatar';
import { ENDPOINTS } from '../config/api';
import { lessonUnits, TOTAL_LESSONS } from '../pages/Lessons/lessonRegistry';
import { buildWorld, roadPath, statusFor, nextLesson, WORLD_W, CX } from './worldLayout';
import { Defs, Ground, UnitProps, Sky, Bridge, Finish, riverFor } from './world/Scenery';
import { Stone, Banner, Chest, Trophy } from './world/pieces';
import { createParticles } from './kit/particles';
import { play } from './kit/sound';
import { haptic } from './kit/haptic';
import Mascot from './Mascot';
import Key from './kit/Key';
import './World.css';

// ── The world: where a child's lessons live ──────────────────────────────────
//
// Not a list. A place: one stone road winding up through meadow, river
// country and evening hills, every lesson a stone on it, one stone lit with
// the child's own character beside it, chests and trophies on the road as
// prizes you can see before you earn them, and Pixel in the corner watching.
// The view opens scrolled to the lit stone, so the first thing on screen is
// the next thing to do.

const OPENED_KEY = 'codeit_chests_opened';
const readOpened = () => { try { return JSON.parse(localStorage.getItem(OPENED_KEY) || '[]'); } catch { return []; } };

export default function World() {
  const { token } = useContext(AuthContext) || {};
  const { character } = useCharacterDisplay();
  const navigate = useNavigate();
  const units = useMemo(() => lessonUnits(), []);
  const world = useMemo(() => buildWorld(units), [units]);
  const [completed, setCompleted] = useState([]);
  const [loaded, setLoaded] = useState(!token);
  const [mood, setMood] = useState('base');
  const [opened, setOpened] = useState(readOpened);
  const [toast, setToast] = useState('');
  const fxRef = useRef(null), scrollRef = useRef(null), fx = useRef(null);

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

  const total = TOTAL_LESSONS;
  const next = nextLesson(completed, total);
  const { items, height, road } = world;
  const lit = items.find((i) => i.kind === 'lesson' && i.id === next);

  // Open on the lit stone.
  useEffect(() => {
    if (!loaded) return;
    const el = scrollRef.current; if (!el) return;
    const scale = el.clientWidth / WORLD_W;
    el.scrollTo({ top: Math.max(0, lit.y * scale - el.clientHeight * 0.55), behavior: 'auto' });
  }, [loaded, lit]);

  function cheer(x, y, big) { setMood('happy'); setTimeout(() => setMood('base'), 900); if (fx.current) fx.current.burst(x, y, big ? 50 : 30, true); }
  function at(e) { const r = fxRef.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

  function openLesson(id, e) {
    if (e && e.clientX) cheer(...at(e));
    setTimeout(() => navigate(`/lesson/${id}`), 220);
  }

  function openChest(item, e) {
    if (opened.includes(item.lessonId)) return;
    play('chest'); haptic('chest');
    const nowOpened = [...opened, item.lessonId];
    setOpened(nowOpened); try { localStorage.setItem(OPENED_KEY, JSON.stringify(nowOpened)); } catch { /* private mode */ }
    if (e && e.clientX) cheer(...at(e), true);
    setToast(`${item.emoji} New sticker: ${item.title || item.unit.name}`);
    setTimeout(() => setToast(''), 2600);
  }

  const doneCount = completed.length;
  const litScale = { left: `${((lit.x + (lit.x > CX ? 64 : -64)) / WORLD_W) * 100}%`, top: `${((lit.y - 18) / height) * 100}%` };
  const lastUnit = world.units[world.units.length - 1];

  return (
    <div className="world" data-next={next}>
      <div className="world__hud">
        <h1 className="world__title">Python Road</h1>
        <span className="world__count" aria-label={`${doneCount} of ${total} lessons done`}>{doneCount} / {total}</span>
      </div>
      {toast && <div className="world__toast" role="status">{toast}</div>}
      <div className="world__scroll" ref={scrollRef}>
        <div className="world__map" style={{ aspectRatio: `${WORLD_W} / ${height}` }}>
          <svg className="world__scene" viewBox={`0 0 ${WORLD_W} ${height}`} width="100%" aria-label="Your road through the lessons">
            <Defs />
            <Ground items={items} units={world.units} height={height} />
            <Sky items={items} units={world.units} />
            {world.units.map((u) => <UnitProps key={u.index} items={items} unit={u} isLast={u === lastUnit} />)}
            <Finish items={items} units={world.units} />
            <path d={roadPath(road)} fill="none" stroke="#9C6B3A" strokeWidth="62" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
            <path d={roadPath(road)} fill="none" stroke="#E5C58F" strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" />
            <path d={roadPath(road)} fill="none" stroke="#F3DDB0" strokeWidth="8" strokeDasharray="2 18" strokeLinecap="round" opacity=".9" />
            {world.units.map((u) => { const r = riverFor(items, u); return r ? <Bridge key={u.index} x={r.bridgeX} y={r.y} /> : null; })}
            {items.map((it) => {
              if (it.kind === 'banner') return <Banner key={`b${it.unit.index}`} item={it} />;
              if (it.kind === 'lesson') return <Stone key={`l${it.id}`} item={it} status={statusFor(it.id, completed, total)} onPress={() => { play('tap'); haptic('tap'); }} onOpen={openLesson} />;
              if (it.kind === 'chest') {
                const lessonDone = completed.includes(it.lessonId);
                const lesson = items.find((i) => i.kind === 'lesson' && i.id === it.lessonId);
                const state = !lessonDone ? 'locked' : opened.includes(it.lessonId) ? 'open' : 'ready';
                return <Chest key={`c${it.lessonId}`} item={{ ...it, emoji: lesson.emoji, title: lesson.title }} state={state} onOpen={openChest} />;
              }
              return <Trophy key={`t${it.unit.index}`} item={it} won={it.unit.lessonIds.every((id) => completed.includes(id))} />;
            })}
          </svg>
          <div className="world__you" style={litScale} aria-hidden="true"><CharacterAvatar character={character} compact size={56} /></div>
        </div>
      </div>
      <Mascot className="world__mascot" mood={mood} onClick={() => { play('good'); cheer(0, 0); }} />
      <div className="world__cta">
        <Key onClick={() => openLesson(next)}>{completed.includes(next) ? 'Play again' : `${next === 1 ? 'Start' : 'Continue'}: ${lit.title}`}</Key>
      </div>
      <canvas ref={fxRef} className="world__fx" aria-hidden="true" />
    </div>
  );
}

export { TOTAL_LESSONS };
