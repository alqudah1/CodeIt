import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDPOINTS } from '../../config/api';
import Header from '../Header/Header';
import './LessonMap.css';

const LESSON_META = {
  1:  { emoji: '🐍', shortDesc: 'Print statements & your first Python program' },
  2:  { emoji: '📦', shortDesc: 'Variables, strings, numbers & data types' },
  3:  { emoji: '🔄', shortDesc: 'Build reusable functions and repeat with loops' },
  4:  { emoji: '🔀', shortDesc: 'Make decisions with if, elif, else' },
  5:  { emoji: '📋', shortDesc: 'Work with lists, strings & string methods' },
  6:  { emoji: '📚', shortDesc: 'Key-value pairs with dictionaries & sets' },
  7:  { emoji: '📁', shortDesc: 'Read and write files on disk' },
  8:  { emoji: '🛡️', shortDesc: 'Handle errors gracefully with try/except' },
  9:  { emoji: '🏗️', shortDesc: 'Classes, objects & object-oriented programming' },
  10: { emoji: '🧩', shortDesc: 'Import and use Python modules & libraries' },
};

const FALLBACK_LESSONS = [
  { id: 1,  title: 'Hello Python!',                       xp: 100 },
  { id: 2,  title: 'Storing Information with Variables',   xp: 120 },
  { id: 3,  title: 'Loops & Functions',                   xp: 130 },
  { id: 4,  title: 'Making Decisions with Conditionals',  xp: 130 },
  { id: 5,  title: 'Lists & Strings',                     xp: 140 },
  { id: 6,  title: 'Dictionaries & Sets',                 xp: 150 },
  { id: 7,  title: 'File Handling',                       xp: 150 },
  { id: 8,  title: 'Exception Handling',                  xp: 160 },
  { id: 9,  title: 'Object-Oriented Programming',         xp: 170 },
  { id: 10, title: 'Modules & Libraries',                 xp: 180 },
];

const LessonMap = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState(FALLBACK_LESSONS);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const nextRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || '';
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
  }, []);

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
      showToast(`🔒 Finish Lesson ${lesson.id - 1} first!`);
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
          <h1 className="lm-title">📘 Lessons Map</h1>
          <p className="lm-subtitle">
            Complete each lesson to unlock the next. Earn XP and level up your Python skills!
          </p>

          <div className="lm-stats-row">
            <span className="lm-stat-chip">
              {loading ? '…' : `${completedIds.length} / ${lessons.length} completed`}
            </span>
            {!loading && nextLesson && (
              <button className="lm-continue-btn" onClick={scrollToNext}>
                {completedIds.length === 0 ? '🚀 Start Learning' : `▶ Continue → Lesson ${nextLesson.id}`}
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
                  {/* Emoji bubble */}
                  <div className={`lm-emoji lm-emoji--${status}`} aria-hidden="true">
                    {status === 'locked' ? '🔒' : meta.emoji}
                  </div>

                  {/* Content */}
                  <div className="lm-card-body">
                    <div className="lm-card-toprow">
                      <span className="lm-lesson-num">Lesson {lesson.id}</span>
                      <span className={`lm-badge lm-badge--${status}`}>
                        {status === 'completed' ? '✅ Done'
                          : status === 'available' ? '▶ Start'
                          : '🔒 Locked'}
                      </span>
                    </div>
                    <h3 className="lm-card-title">{lesson.title}</h3>
                    <p className="lm-card-desc">{meta.shortDesc}</p>
                    <span className="lm-xp">⭐ {lesson.xp} XP</span>
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
            🎉 You've completed all lessons! You're a Python champion!
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonMap;
