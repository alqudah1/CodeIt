import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import Icon from '../../components/Icon/Icon';
import { lessonSummaries } from './lessonRegistry';
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

// Where each stop sits across the path, as a percentage of the width. A slow
// wave, so the path bends left and right and the eye follows it down.
export const ROW_HEIGHT = 108;
export function stopX(index) {
  return 50 + 30 * Math.sin(index * (Math.PI / 2.6) + Math.PI / 5);
}
export function isBoss(id) {
  return id % 5 === 0;
}

const NODE = 64;
const BOSS_NODE = 78;
const LABEL_GAP = 12;

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
  const pts = Array.from({ length: n }, (_, i) => [stopX(i), i * ROW_HEIGHT + ROW_HEIGHT / 2]);
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cy = (y0 + y1) / 2;
    d += ` C ${x0.toFixed(2)} ${cy} ${x1.toFixed(2)} ${cy} ${x1.toFixed(2)} ${y1}`;
  }
  return d;
}

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

  const trail = useMemo(() => trailPath(lessons.length), [lessons.length]);
  const walked = useMemo(() => trailPath(lessons.length, hereIndex + 1), [lessons.length, hereIndex]);
  const height = lessons.length * ROW_HEIGHT;

  return (
    <div className="lm-page">
      <Header />

      {asking && (
        <div className="lm-ask" role="dialog" aria-modal="true" aria-labelledby="lm-ask-title">
          <div className="lm-ask__card">
            <p className="lm-ask__kicker">Lesson {asking.id}</p>
            <h2 id="lm-ask-title">{asking.title}</h2>
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
            <button className="lm-back-btn" onClick={() => navigate('/MainPage')}>
              ← Back
            </button>
            <h1 className="lm-title">Lessons</h1>
          </div>
          <div className="lm-stats-row">
            <span className="lm-stat-chip">
              {loading ? '…' : `${completedIds.length} / ${lessons.length} done`}
            </span>
          </div>
        </div>

        {/* ── The path ─────────────────────────────────────────────────── */}
        <div className="lm-path" aria-label="Lesson progression map" style={{ height }} ref={pathRef}>
          <svg
            className="lm-trail"
            viewBox={`0 0 100 ${height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path className="lm-trail__all" d={trail} vectorEffect="non-scaling-stroke" />
            {hereIndex > 0 && <path className="lm-trail__done" d={walked} vectorEffect="non-scaling-stroke" />}
          </svg>

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
                  style={{ top: idx * ROW_HEIGHT, left: `${x}%` }}
                >
                  {/* A real anchor, so the crawler and a middle click get
                      the page. The click is intercepted so a stop ahead of
                      the child can ask first. */}
                  <Link
                    to={`/lesson/${lesson.id}`}
                    ref={isHere ? hereRef : null}
                    className={`lm-card lm-card--${status}${isHere ? ' lm-card--next' : ''}`}
                    onClick={(e) => { e.preventDefault(); handleLessonClick(lesson); }}
                    aria-label={`Lesson ${lesson.id}: ${lesson.title}. ${status === 'ahead' ? 'ahead of you' : status}${boss ? '. Boss puzzle' : ''}`}
                  >
                    <span className={`lm-node lm-node--${status}${boss ? ' lm-node--boss' : ''}`} aria-hidden="true">
                      {isHere ? (
                        <span className="lm-you">
                          <CharacterAvatar character={character} compact size={boss ? 62 : 54} />
                        </span>
                      ) : status === 'completed' && !boss ? (
                        <Icon name="check" size={26} strokeWidth={3} />
                      ) : boss ? (
                        <Icon name="star" size={30} />
                      ) : (
                        lesson.id
                      )}
                    </span>
                    {isHere && <span className="lm-you__flag" aria-hidden="true">YOU</span>}
                    <span className={`lm-xp lm-xp--${status}`}>{lesson.xp} XP</span>

                    {titled && (
                      <span className="lm-label" style={placed ? placed.style : undefined}>
                        <span className="lm-label__num">{boss ? `Boss puzzle · Lesson ${lesson.id}` : `Lesson ${lesson.id}`}</span>
                        <span className="lm-label__title">{lesson.title}</span>
                        {isHere ? (
                          <span className={`lm-badge lm-badge--${status}`}>
                            {status === 'completed' ? 'Play again' : 'Start'}
                          </span>
                        ) : (
                          <span className="lm-label__next">Next</span>
                        )}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
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
