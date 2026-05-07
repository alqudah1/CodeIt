import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import './LessonMap.css';

const LESSON_META = {
  1:  { shortDesc: 'Write your first Python program using print()' },
  2:  { shortDesc: 'Store names, numbers, and messages in variables' },
  3:  { shortDesc: 'Work with text using quotes, len(), and string methods' },
  4:  { shortDesc: 'Make decisions in code with if, elif, and else' },
  5:  { shortDesc: 'Repeat code automatically using for i in range()' },
  6:  { shortDesc: 'Loop over characters and sequences with for loops' },
  7:  { shortDesc: 'Create and use Python lists — index, append, and len()' },
  8:  { shortDesc: 'Combine loops and lists to process collections of data' },
  9:  { shortDesc: 'Write reusable functions using def, parameters, and return' },
  10: { shortDesc: 'Put it all together — functions, loops, and lists in one program' },
  11: { shortDesc: 'Integers, floats, and arithmetic operators' },
  12: { shortDesc: 'True/False values and comparison operators' },
  13: { shortDesc: 'Combine conditions with and, or, and not' },
  14: { shortDesc: 'Convert between int, float, str, and bool' },
  15: { shortDesc: 'Build clean output with f-strings and format specifiers' },
  16: { shortDesc: 'strip, replace, split, join, find, and count' },
};

const FALLBACK_LESSONS = [
  { id: 1,  title: 'Hello Python',                          xp: 50  },
  { id: 2,  title: 'Storing Info with Variables',           xp: 50  },
  { id: 3,  title: 'Strings',                               xp: 50  },
  { id: 4,  title: 'Making Decisions with If Statements',   xp: 50  },
  { id: 5,  title: 'Simple Repetition',                     xp: 50  },
  { id: 6,  title: 'For Loops',                             xp: 50  },
  { id: 7,  title: 'Basic Lists',                           xp: 50  },
  { id: 8,  title: 'Loops with Lists',                      xp: 50  },
  { id: 9,  title: 'Basic Functions',                       xp: 50  },
  { id: 10, title: 'Combining Concepts',                    xp: 50  },
  { id: 11, title: 'Numbers & Arithmetic',                  xp: 50  },
  { id: 12, title: 'Booleans & Comparisons',                xp: 50  },
  { id: 13, title: 'Logical Operators',                     xp: 50  },
  { id: 14, title: 'Type Casting',                          xp: 50  },
  { id: 15, title: 'String Formatting',                     xp: 50  },
  { id: 16, title: 'String Methods',                        xp: 50  },
];

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
        <div className="lm-header">
          <button className="lm-back-btn" onClick={() => navigate('/MainPage')}>
            ← Back to Dashboard
          </button>
          <h1 className="lm-title">Lessons Map</h1>
          <p className="lm-subtitle">
            Complete each lesson to unlock the next. Earn XP and level up your Python skills!
          </p>

          <div className="lm-stats-row">
            <span className="lm-stat-chip">
              {loading ? '…' : `${completedIds.length} of ${lessons.length} lessons complete`}
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

                {/* Lesson card */}
                <div
                  ref={isNext ? nextRef : null}
                  className={`lm-card lm-card--${status}${isNext ? ' lm-card--next' : ''}`}
                  onClick={() => handleLessonClick(lesson)}
                  role="button"
                  tabIndex={status === 'locked' ? -1 : 0}
                  onKeyDown={(e) => e.key === 'Enter' && handleLessonClick(lesson)}
                  aria-label={`Lesson ${lesson.id}: ${lesson.title} — ${status}`}
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
                </div>
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
