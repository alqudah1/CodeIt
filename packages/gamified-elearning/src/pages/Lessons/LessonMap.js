import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import { lessonSummaries } from './lessonRegistry';
import './LessonMap.css';

const FALLBACK_LESSONS = lessonSummaries();
const LESSON_META = Object.fromEntries(
  FALLBACK_LESSONS.map(lesson => [lesson.id, { shortDesc: lesson.summary }])
);

const LessonMap = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [lessons, setLessons] = useState(FALLBACK_LESSONS);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const nextRef = useRef(null);

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

  const getStatus = (id) => {
    if (isCompleted(id)) return 'completed';
    if (isAvailable(id)) return 'available';
    return 'locked';
  };

  const nextLesson = lessons.find((l) => isAvailable(l.id) && !isCompleted(l.id));

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleLessonClick = (lesson) => {
    const status = getStatus(lesson.id);
    if (status === 'locked') {
      showToast(`Complete Lesson ${lesson.id - 1} to unlock this one.`);
      return;
    }
    navigate(`/lesson/${lesson.id}`);
  };

  const scrollToNext = () => {
    if (nextRef.current) {
      nextRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="lm-page">
      <Header />

      {toast && <div className="lm-toast" role="alert">{toast}</div>}

      <div className="lm-container">
        {/* ── Page header ───────────────────────────────── */}
        {/* Back, title and how-far-through on as few rows as they fit on.
            Stacked, on a 390px phone, they were 186px — three separate rows of
            page furniture above the lessons themselves. */}
        <div className="lm-header">
          <div className="lm-header__top">
            <button className="lm-back-btn" onClick={() => navigate('/MainPage')}>
              ← Back
            </button>
            <h1 className="lm-title">Lessons</h1>
          </div>
          {/* "Complete each lesson to unlock the next. Earn XP and level up
              your Python skills!" — every card below carries a padlock, an XP
              figure and a number. The sentence explained the picture to
              someone already looking at it, and cost 130px above the map. */}

          <div className="lm-stats-row">
            <span className="lm-stat-chip">
              {loading ? '…' : `${completedIds.length} / ${lessons.length} done`}
            </span>
            {!loading && nextLesson && (
              <button className="lm-continue-btn" onClick={scrollToNext}>
                {completedIds.length === 0 ? 'Unlock Lesson 1' : `Advance to Lesson ${nextLesson.id}`}
              </button>
            )}
          </div>
        </div>

        {/* ── Lesson path ───────────────────────────────── */}
        <div className="lm-path" aria-label="Lesson progression map">
          {lessons.map((lesson, idx) => {
            const status = getStatus(lesson.id);
            const meta = LESSON_META[lesson.id] || { emoji: '📖', shortDesc: '' };
            const isNext = nextLesson && nextLesson.id === lesson.id;

            return (
              <div key={lesson.id} className="lm-node-wrap">
                {/* Connector line between nodes */}
                {idx > 0 && (
                  <div
                    className={`lm-connector${isCompleted(lesson.id - 1) ? ' lm-connector--done' : ''}`}
                    aria-hidden="true"
                  />
                )}

                {/* ── Lesson card ────────────────────────────────────────────
                    A real anchor, not a div that calls navigate().

                    Thirty-one lesson pages are generated at build time and all
                    thirty-one are in the sitemap, so they are discoverable. But
                    nothing on this site linked to a single one of them: the
                    cards were divs with an onClick, which no crawler follows and
                    no middle-click opens in a new tab. A page a sitemap declares
                    and nothing links to is a page nothing vouches for.

                    Locked lessons still get an href. The lesson page renders
                    perfectly well on its own, and a child who taps one gets the
                    same toast as before because the click is intercepted here —
                    the href is for the crawler and for the middle click, not a
                    way around the gate. */}
                <Link
                  to={`/lesson/${lesson.id}`}
                  ref={isNext ? nextRef : null}
                  className={`lm-card lm-card--${status}${isNext ? ' lm-card--next' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleLessonClick(lesson); }}
                  tabIndex={status === 'locked' ? -1 : 0}
                  aria-label={`Lesson ${lesson.id}: ${lesson.title}. ${status}`}
                >
                  {/* Number bubble */}
                  <div className={`lm-emoji lm-emoji--${status}`} aria-hidden="true">
                    {lesson.id}
                  </div>

                  {/* Content */}
                  <div className="lm-card-body">
                    <div className="lm-card-toprow">
                      <span className="lm-lesson-num">Lesson {lesson.id}</span>
                      <span className={`lm-badge lm-badge--${status}`}>
                        {status === 'completed' ? 'Complete'
                          : status === 'available' ? 'Unlock'
                          : 'Locked'}
                      </span>
                    </div>
                    <h3 className="lm-card-title">{lesson.title}</h3>
                    <p className="lm-card-desc">{meta.shortDesc}</p>
                    <span className="lm-xp">{lesson.xp} XP</span>
                  </div>

                  {/* Arrow indicator */}
                  {status !== 'locked' && (
                    <span className="lm-arrow" aria-hidden="true">›</span>
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* ── All done banner ───────────────────────────── */}
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
