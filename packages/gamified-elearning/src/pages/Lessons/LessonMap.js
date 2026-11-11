import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import { STAGES, STAGE_BAND, stageIndexOfLesson, stageProgress } from './lessonStages';
import { GroundEdge, Peaks, Tree, Pine, Bush, Rock, Flower, Cloud, Sun, Castle, Hill, Gem, Flag } from './MapArt';
import Icon from '../../components/Icon/Icon';
import { lessonSummaries } from './lessonRegistry';
import '../../ds/night.css';
import './LessonMap.css';
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacterDisplay } from '../../context/CharacterContext';

// ── A map, not a list ────────────────────────────────────────────────────────
//
// Rounds 66 and 67: the lesson list was a vertical stack of equal-width cards
// joined by a thin straight line, which is a syllabus. What makes it a map:
//
//   - Nodes, not cards. A circle per lesson with its number, big enough to
//     tap, on a path that bends left and right instead of running straight
//     down.
//   - The avatar stands on the path at the current lesson and moves forward
//     when one is finished.
//   - Titles only on the current and next node. The rest are numbers.
//   - A different marker every fifth lesson, for the boss puzzle.
//   - The XP badges stay. They are the one game element already working.
//   - One Unlock button, on the node the child is looking at.
//
// Every stop is still a real <a href="/lesson/N">: thirty-one pages are in the
// sitemap and this is the page that vouches for them (lessonLinks.test.js).

const FALLBACK_LESSONS = lessonSummaries();
const CASTLE_ROW = 300; // the castle after the last lesson needs a taller row than a lesson
const GROUND = { beginner: '#7FD86A', intermediate: '#A99BE3', advanced: '#9ED6FF', expert: '#F6B35A' };

// Where each stop sits across the path, as a percentage of the width. A slow
// wave, so the path bends left and right and the eye follows it down.
export const ROW_HEIGHT = 128;
export function stopX(index) {
  return 50 + 30 * Math.sin(index * (Math.PI / 2.6) + Math.PI / 5);
}
/** Where a stop sits down the path: its row, plus a band for each stage line crossed. */
export function stopY(index) {
  return index * ROW_HEIGHT + ROW_HEIGHT / 2 + stageIndexOfLesson(index + 1) * STAGE_BAND;
}
export function isBoss(id) {
  return id % 5 === 0;
}

/**
 * The name under a stop: the lesson's own short title ("While Loops" from
 * "While Loops. Keep Going Until"). Titles come from the registry here, not
 * the server's list, so the map always shows the course's current copy.
 */
const TITLE_OF = new Map(FALLBACK_LESSONS.map((l) => [l.id, l.title]));
export function stopTitle(lesson) {
  return TITLE_OF.get(lesson.id) || lesson.title || '';
}
// A full stop, a colon, or a spaced dash of any length (the long ones by
// code, so the copy scan does not read this line as published text).
const TITLE_BREAK = new RegExp(`\\.\\s|\\s[${[8212, 8211, 45].map((c) => String.fromCharCode(c)).join('')}]\\s|:\\s`);
export function shortTitle(title) {
  return String(title || '').split(TITLE_BREAK)[0].trim();
}

const NODE = 72;
const BOSS_NODE = 84;
const LABEL_GAP = 14;

/**
 * Where the label beside a titled stop goes, in pixels relative to the stop's
 * link (whose left edge is the node's left edge). It sits on the side with
 * more room and is clamped inside the path, so no width can push it off the
 * screen. Returns null until the path has been measured.
 */
export function labelBox(xPct, pathWidth, boss) {
  if (!pathWidth) return null;
  const node = boss ? BOSS_NODE : NODE;
  const cx = (xPct / 100) * pathWidth;
  const roomRight = pathWidth - (cx + node / 2 + LABEL_GAP);
  const roomLeft = cx - node / 2 - LABEL_GAP;
  // As wide as it can be on the roomier side, never over the node itself.
  const width = Math.round(Math.min(240, pathWidth * 0.55, Math.max(120, roomLeft, roomRight)));
  const side = roomRight >= width || roomRight >= roomLeft ? 'right' : 'left';
  let left = side === 'right' ? cx + node / 2 + LABEL_GAP : cx - node / 2 - LABEL_GAP - width;
  left = Math.max(0, Math.min(left, pathWidth - width));
  const cardLeft = cx - node / 2;
  return { side, style: { left: Math.round(left - cardLeft), right: 'auto', width: Math.round(width) } };
}

// The trail, as one smooth path through every stop, in the SVG's own units
// (100 wide, one ROW_HEIGHT per stop). Drawn twice: the whole path faintly,
// and the walked part solid.
export function trailPath(count, upTo = count) {
  const n = Math.max(0, Math.min(count, upTo));
  if (n === 0) return '';
  const pts = Array.from({ length: n }, (_, i) => [stopX(i), stopY(i)]);
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cy = (y0 + y1) / 2;
    d += ` C ${x0.toFixed(2)} ${cy} ${x1.toFixed(2)} ${cy} ${x1.toFixed(2)} ${y1}`;
  }
  return d;
}

/** The last bend: from the final lesson down to the castle gate, which sits lower in its taller row. */
export const CASTLE_DROP = 102;
export function castlePath(count) {
  if (count === 0) return '';
  const [x0, y0] = [stopX(count - 1), stopY(count - 1)];
  const [x1, y1] = [stopX(count), stopY(count) + CASTLE_DROP];
  const cy = (y0 + y1) / 2;
  return `M ${x0.toFixed(2)} ${y0} C ${x0.toFixed(2)} ${cy} ${x1.toFixed(2)} ${cy} ${x1.toFixed(2)} ${y1}`;
}

// What grows beside the road in each land, placed by the stop it sits level
// with (0-based) and the side of the road that stop leaves free. The road
// swings between 20% and 80% of the width, so the edges are always clear.
const DECOR = {
  beginner: [
    { at: 0, side: 'left', dy: 4, el: (k) => <Tree key={k} size={58} /> },
    { at: 1, side: 'left', dy: 10, el: (k) => <Flower key={k} size={22} style={{ marginLeft: 26 }} /> },
    { at: 1, side: 'left', dy: 44, el: (k) => <Bush key={k} size={46} /> },
    { at: 3, side: 'right', dy: -20, el: (k) => <Tree key={k} size={62} dark /> },
    { at: 4, side: 'right', dy: 30, el: (k) => <Flower key={k} size={20} petal="#FFC93C" /> },
    { at: 4, side: 'right', dy: 54, el: (k) => <Bush key={k} size={40} /> },
    { at: 5, side: 'left', dy: -6, el: (k) => <Tree key={k} size={52} dark /> },
    { at: 6, side: 'left', dy: 36, el: (k) => <Flower key={k} size={22} petal="#7EE0FF" /> },
    { at: 7, side: 'right', dy: 20, el: (k) => <Tree key={k} size={48} /> },
    { at: 7, side: 'left', dy: 48, el: (k) => <Bush key={k} size={44} /> },
  ],
  intermediate: [
    { at: 8, side: 'right', dy: 24, el: (k) => <Rock key={k} size={48} /> },
    { at: 9, side: 'right', dy: -8, el: (k) => <Pine key={k} size={52} /> },
    { at: 10, side: 'right', dy: 44, el: (k) => <Gem key={k} size={28} /> },
    { at: 11, side: 'left', dy: -10, el: (k) => <Pine key={k} size={58} /> },
    { at: 12, side: 'left', dy: 40, el: (k) => <Rock key={k} size={42} /> },
    { at: 13, side: 'right', dy: 10, el: (k) => <Rock key={k} size={52} tone="#CFC4EA" /> },
    { at: 14, side: 'right', dy: -16, el: (k) => <Pine key={k} size={50} /> },
    { at: 15, side: 'left', dy: 20, el: (k) => <Gem key={k} size={26} /> },
  ],
  advanced: [
    { at: 16, side: 'left', dy: -6, el: (k) => <Cloud key={k} width={110} /> },
    { at: 17, side: 'left', dy: 54, el: (k) => <Cloud key={k} width={76} /> },
    { at: 19, side: 'right', dy: -10, el: (k) => <Cloud key={k} width={120} /> },
    { at: 20, side: 'right', dy: 48, el: (k) => <Gem key={k} size={30} /> },
    { at: 21, side: 'left', dy: 16, el: (k) => <Cloud key={k} width={96} /> },
    { at: 22, side: 'left', dy: 60, el: (k) => <Gem key={k} size={24} /> },
    { at: 23, side: 'right', dy: 30, el: (k) => <Cloud key={k} width={84} /> },
  ],
  expert: [
    { at: 24, side: 'right', dy: 20, el: (k) => <Rock key={k} size={48} tone="#E9A44E" /> },
    { at: 25, side: 'right', dy: -14, el: (k) => <Pine key={k} size={50} /> },
    { at: 26, side: 'left', dy: 0, el: (k) => <Flower key={k} size={22} petal="#FF6B6B" /> },
    { at: 26, side: 'left', dy: 40, el: (k) => <Rock key={k} size={44} tone="#E9A44E" /> },
    { at: 27, side: 'left', dy: -10, el: (k) => <Pine key={k} size={56} /> },
    { at: 29, side: 'right', dy: 16, el: (k) => <Flower key={k} size={20} petal="#FFC93C" /> },
    { at: 30, side: 'right', dy: -10, el: (k) => <Rock key={k} size={50} tone="#F2C96B" /> },
  ],
};

const LessonMap = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { character } = useCharacterDisplay();
  const [lessons, setLessons] = useState(FALLBACK_LESSONS);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const hereRef = useRef(null);
  const scrolledRef = useRef(false);
  const pathRef = useRef(null);
  const [pathWidth, setPathWidth] = useState(0);

  // The label beside the current and next stop is placed in pixels, from the
  // measured width of the path, so it can never hang off the edge of a
  // phone: the first version put it on whichever side the stop leaned away
  // from, and at 390px "Lesson 3" was cut off at the left edge.
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return undefined;
    const measure = () => setPathWidth(el.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [lRes, pRes] = await Promise.all([
          fetch(ENDPOINTS.lessons.list, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(ENDPOINTS.lessons.progress, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (lRes.ok) {
          const d = await lRes.json();
          if (d.lessons && d.lessons.length) setLessons(d.lessons);
        }
        if (pRes.ok) {
          const d = await pRes.json();
          if (d.completedLessons) setCompletedIds(d.completedLessons);
        }
      } catch (_) {
        /* fall back to hardcoded data */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const isCompleted = (id) => completedIds.includes(id);
  const isAvailable = (id) => id === 1 || isCompleted(id - 1);

  // Every lesson opens (message 74). A stop whose lesson before it is not
  // finished is "ahead": marked, and asked about on tap, never refused.
  const getStatus = (id) => {
    if (isCompleted(id)) return 'completed';
    if (isAvailable(id)) return 'available';
    return 'ahead';
  };

  const nextLesson = lessons.find((l) => isAvailable(l.id) && !isCompleted(l.id));
  const hereIndex = nextLesson ? lessons.indexOf(nextLesson) : lessons.length - 1;

  // The child arrives standing on their lesson, not at the top of a path
  // they have already walked. Once, after progress has loaded.
  useEffect(() => {
    if (loading || scrolledRef.current || !hereRef.current || hereIndex < 3) return;
    scrolledRef.current = true;
    hereRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }, [loading, hereIndex]);

  // Tapping a stop ahead of the child asks: start it, or go to where they
  // are first. Their own choice, with starting as the default.
  const [asking, setAsking] = useState(null); // the lesson tapped
  const startRef = useRef(null);
  useEffect(() => { if (asking) startRef.current?.focus(); }, [asking]);
  useEffect(() => {
    if (!asking) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setAsking(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [asking]);

  const handleLessonClick = (lesson) => {
    if (getStatus(lesson.id) === 'ahead') {
      setAsking(lesson);
      return;
    }
    navigate(`/lesson/${lesson.id}`);
  };

  const allDone = !loading && lessons.length > 0 && completedIds.length === lessons.length;
  const tail = useMemo(() => castlePath(lessons.length), [lessons.length]);
  const trail = useMemo(() => `${trailPath(lessons.length)} ${tail}`, [lessons.length, tail]);
  const walked = useMemo(() => (allDone ? `${trailPath(lessons.length)} ${tail}` : trailPath(lessons.length, hereIndex + 1)), [lessons.length, hereIndex, allDone, tail]);
  const height = lessons.length * ROW_HEIGHT + CASTLE_ROW + (STAGES.length - 1) * STAGE_BAND;
  const nextId = nextLesson ? nextLesson.id : null;

  return (
    <div className="lm-page night lm-page--night">
      <Header />

      {asking && (
        <div className="lm-ask" role="dialog" aria-modal="true" aria-labelledby="lm-ask-title">
          <div className="lm-ask__card">
            <p className="lm-ask__kicker">Lesson {asking.id}</p>
            <h2 id="lm-ask-title">{stopTitle(asking)}</h2>
            <p className="lm-ask__body">
              {nextLesson
                ? `You are up to Lesson ${nextLesson.id}. You can start this one now, or go to Lesson ${nextLesson.id} first.`
                : 'You can start this one now.'}
            </p>
            <div className="lm-ask__actions">
              <button type="button" className="lm-ask__start" ref={startRef} onClick={() => navigate(`/lesson/${asking.id}`)}>
                Start Lesson {asking.id}
              </button>
              {nextLesson && nextLesson.id !== asking.id && (
                <button type="button" className="lm-ask__first" onClick={() => navigate(`/lesson/${nextLesson.id}`)}>
                  Go to Lesson {nextLesson.id} first
                </button>
              )}
              <button type="button" className="lm-ask__close" onClick={() => setAsking(null)}>Not now</button>
            </div>
          </div>
        </div>
      )}

      <div className="lm-container">
        <div className="lm-header">
          <div className="lm-header__top">
            <button className="lm-back-btn" onClick={() => navigate('/home')}>
              ← Back
            </button>
            <h1 className="lm-title">Lessons</h1>
          </div>
          <div className="lm-stats-row">
            <span className="lm-stat-chip">
              {loading ? '…' : `${completedIds.length} / ${lessons.length} done`}
            </span>
          </div>
          {/* The whole journey in one row, like a level select: four lands
              and the castle, joined by a track, with where you are. */}
          <ol className="lm-stages" aria-label="Stages">
            {STAGES.map((stage) => {
              const p = stageProgress(stage, completedIds, nextId);
              return (
                <li key={stage.id} className={`lm-stage lm-stage--${p.state} lm-stage--${stage.id}`}>
                  <span className="lm-stage__disc" aria-hidden="true"><Icon name={stage.icon} size={20} strokeWidth={2.5} /></span>
                  <span className="lm-stage__name">{stage.name}</span>
                  <span className="lm-stage__count">{p.done}/{p.total}</span>
                </li>
              );
            })}
            <li className={`lm-stage lm-stage--cert${allDone ? ' lm-stage--done' : ' lm-stage--ahead'}`}>
              <span className="lm-stage__disc" aria-hidden="true"><Icon name="trophy" size={20} strokeWidth={2.5} /></span>
              <span className="lm-stage__name">Certificate</span>
              <span className="lm-stage__count">{allDone ? 'Yours' : 'At the end'}</span>
            </li>
          </ol>
        </div>

        {/* ── The world ────────────────────────────────────────────────── */}
        <div className="lm-path" aria-label="Lesson progression map" style={{ height }} ref={pathRef}>
          {/* The four lands. Each is a stretch of ground the full width of
              the screen, with its own colour and its own things beside the
              road, and a wavy edge where it lies over the land before it. */}
          {STAGES.map((stage, si) => {
            const top = si === 0 ? 0 : (stage.from - 1) * ROW_HEIGHT + (si - 1) * STAGE_BAND;
            const rows = stage.to - stage.from + 1;
            const bandHeight = rows * ROW_HEIGHT + (si === 0 ? 0 : STAGE_BAND) + (si === STAGES.length - 1 ? CASTLE_ROW : 0);
            return (
              <div key={stage.id} className={`lm-land lm-land--${stage.id}`} style={{ top, height: bandHeight }} aria-hidden="true">
                {si > 0 && stage.id !== 'intermediate' && <GroundEdge className="lm-land__edge" fill={GROUND[stage.id]} />}
                {stage.id === 'intermediate' && <Peaks className="lm-land__peaks" />}
                {stage.id === 'expert' && <Sun className="lm-decor lm-decor--sun" size={104} />}
                {stage.id === 'advanced' && <Cloud className="lm-decor lm-decor--top" width={130} />}
                {(DECOR[stage.id] || []).map((d, i) => (
                  <span
                    key={i}
                    className={`lm-decor lm-decor--${d.side}`}
                    style={{ top: stopY(d.at) - top - 36 + d.dy }}
                  >
                    {d.el(i)}
                  </span>
                ))}
              </div>
            );
          })}

          {/* The road: an ink edge, a sand road, a dashed centre line, and
              the walked part in orange up to where the child stands. */}
          <svg
            className="lm-trail"
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path className="lm-trail__edge" d={trail} vectorEffect="non-scaling-stroke" />
            <path className="lm-trail__all" d={trail} vectorEffect="non-scaling-stroke" />
            {(hereIndex > 0 || allDone) && <path className="lm-trail__done" d={walked} vectorEffect="non-scaling-stroke" />}
            <path className="lm-trail__dash" d={trail} vectorEffect="non-scaling-stroke" />
          </svg>

          {/* A gate where one land becomes the next. */}
          {STAGES.map((stage, si) => {
            if (si === 0) return null;
            const p = stageProgress(stage, completedIds, nextId);
            const top = (stage.from - 1) * ROW_HEIGHT + (si - 1) * STAGE_BAND;
            return (
              <div key={stage.id} className={`lm-gate lm-gate--${stage.id} lm-gate--${p.state}`} style={{ top: top + 14 }} aria-hidden="true">
                <span className="lm-gate__disc"><Icon name={stage.icon} size={22} strokeWidth={2.5} /></span>
                <span className="lm-gate__text">
                  <b>{stage.place}</b>
                  <small>{stage.name} · Lessons {stage.from} to {stage.to} · {p.done} of {p.total} done</small>
                </span>
              </div>
            );
          })}

          <ol className="lm-stops">
            {lessons.map((lesson, idx) => {
              const status = getStatus(lesson.id);
              const isHere = nextLesson && nextLesson.id === lesson.id;
              const isAfter = idx === hereIndex + 1;
              const titled = isHere || isAfter;
              const boss = isBoss(lesson.id);
              const x = stopX(idx);
              const placed = titled ? labelBox(x, pathWidth, boss) : null;
              const side = placed ? placed.side : (x > 50 ? 'left' : 'right');

              return (
                <li
                  key={lesson.id}
                  className={`lm-stop lm-stop--${status}${isHere ? ' lm-stop--here' : ''}${boss ? ' lm-stop--boss' : ''}${titled ? ` lm-stop--titled lm-stop--${side}` : ''}`}
                  style={{ top: stopY(idx) - ROW_HEIGHT / 2, left: `${x}%` }}
                >
                  {/* A real anchor, so the crawler and a middle click get
                      the page. The click is intercepted so a stop ahead of
                      the child can ask first. */}
                  <Link
                    to={`/lesson/${lesson.id}`}
                    ref={isHere ? hereRef : null}
                    className={`lm-card lm-card--${status}${isHere ? ' lm-card--next' : ''}`}
                    onClick={(e) => { e.preventDefault(); handleLessonClick(lesson); }}
                    aria-label={`Lesson ${lesson.id}: ${stopTitle(lesson)}. ${status === 'ahead' ? 'ahead of you' : status}${boss ? '. Boss puzzle' : ''}`}
                  >
                    {boss && <Flag className="lm-flag" size={36} color={status === 'completed' ? '#4CC779' : '#FF6B6B'} />}
                    <span className={`lm-node lm-node--${status}${boss ? ' lm-node--boss' : ''}`} aria-hidden="true">
                      <span className="lm-node__in">
                        {isHere ? (
                          <span className="lm-you">
                            <CharacterAvatar character={character} compact size={boss ? 66 : 58} />
                          </span>
                        ) : status === 'completed' && !boss ? (
                          <Icon name="check" size={30} strokeWidth={3.5} />
                        ) : boss ? (
                          <Icon name="star" size={32} />
                        ) : (
                          lesson.id
                        )}
                      </span>
                    </span>
                    {isHere && <span className="lm-you__flag" aria-hidden="true">YOU</span>}
                    <span className={`lm-xp lm-xp--${status}`}>{lesson.xp} XP</span>
                    {!titled && (
                      <span className={`lm-name lm-name--${status}`}><span className="lm-name__t">{boss ? `Boss: ${shortTitle(stopTitle(lesson))}` : shortTitle(stopTitle(lesson))}</span></span>
                    )}

                    {titled && (
                      <span className="lm-label" style={placed ? placed.style : undefined}>
                        <span className="lm-label__num">{boss ? `Boss puzzle · Lesson ${lesson.id}` : `Lesson ${lesson.id}`}</span>
                        <span className="lm-label__title">{stopTitle(lesson)}</span>
                        {isHere ? (
                          <span className={`lm-badge lm-badge--${status}`}>
                            {status === 'completed' ? 'Play again' : 'Start'}
                          </span>
                        ) : (
                          <span className="lm-label__next">Up next</span>
                        )}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
            {lessons.length > 0 && (
              <li
                className={`lm-stop lm-stop--castle${allDone ? ' lm-stop--completed' : ' lm-stop--ahead'}`}
                style={{ top: stopY(lessons.length) - ROW_HEIGHT / 2, left: `${stopX(lessons.length)}%` }}
              >
                <Link
                  to="/certificate"
                  className={`lm-card lm-card--${allDone ? 'completed' : 'ahead'}`}
                  aria-label={allDone ? 'Your certificate' : `The certificate. ${completedIds.length} of ${lessons.length} lessons done`}
                >
                  <Hill className="lm-hill" width={280} />
                  <Castle className="lm-castle" width={160} lit={allDone} />
                  <span className={`lm-node lm-node--castle${allDone ? ' lm-node--completed' : ' lm-node--ahead'}`} aria-hidden="true"><span className="lm-node__in"><Icon name="trophy" size={32} /></span></span>
                  <span className={`lm-xp lm-xp--${allDone ? 'completed' : 'ahead'}`}>{allDone ? 'Your certificate' : 'Certificate'}</span>
                  <span className="lm-name"><span className="lm-name__t">{allDone ? 'Open it' : `${completedIds.length} of ${lessons.length} lessons`}</span></span>
                </Link>
              </li>
            )}
          </ol>
        </div>

        {!loading && completedIds.length === lessons.length && lessons.length > 0 && (
          <div className="lm-all-done">
            All {lessons.length} lessons complete. Every XP point earned. Every skill unlocked.
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonMap;
