import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../../pages/pythoneditor/PythonEditor';
import Header from '../../pages/Header/Header';
import ProgressBar from '../../pages/ProgressBar/progressBar';
import './InteractiveLessonTemplate.css';
import { trackStaticLessonCompletion } from '../../utils/progressTracker';
import { useProgress } from '../../context/ProgressContext';
import { AuthContext } from '../../context/AuthContext';

/**
 * InteractiveLessonTemplate
 *
 * Reusable component for Lessons 2–10. Accepts a `lessonData` prop shaped as:
 * {
 *   id: Number,
 *   title: String,
 *   subtitle: String,
 *   emoji: String,
 *   story: String[],          // 2–4 story panel strings
 *   concepts: { icon, title, body }[],
 *   checkpoints: {
 *     id, title, description, initialCode, successPattern, hint, xp
 *   }[]
 * }
 */
const InteractiveLessonTemplate = ({ lessonData }) => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const { user } = useContext(AuthContext) || {};
  const firstName = (user?.name || 'Coder').split(' ')[0];

  const confettiRef = useRef(null);

  // Calm mode: suppresses confetti/audio
  const [calmMode, setCalmMode] = useState(false);

  // Story panel navigation
  const [storyIdx, setStoryIdx] = useState(0);

  // Per-checkpoint state: done[], hints shown[]
  const totalCps = lessonData?.checkpoints?.length || 0;
  const [cpDone, setCpDone] = useState(() => Array(totalCps).fill(false));
  const [cpHints, setCpHints] = useState(() => Array(totalCps).fill(false));

  // Guard: only fire DB completion once
  const hasMarkedComplete = useRef(false);

  // ── Confetti canvas resize ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Confetti helper ─────────────────────────────────────────────────────────
  const triggerConfetti = (durationMs = 1200) => {
    if (calmMode) return;
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e'];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: 3 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3,
      g: 0.05 + Math.random() * 0.05,
      a: 1,
    }));
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.a -= 0.005;
        ctx.globalAlpha = Math.max(p.a, 0);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (ts - start < durationMs) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(step);
  };

  // ── DB completion (fires once on first checkpoint success) ──────────────────
  const handleFirstSuccess = () => {
    if (hasMarkedComplete.current) return;
    hasMarkedComplete.current = true;
    markLessonComplete(lessonData.id);
    trackStaticLessonCompletion(lessonData.id).catch((err) =>
      console.error(`Lesson ${lessonData.id} completion error:`, err)
    );
  };

  // ── Checkpoint output handler ───────────────────────────────────────────────
  const handleCpOutput = (idx, cp, output) => {
    const passed = cp.successPattern.test(output.trim());
    if (passed) {
      // Mark done
      setCpDone((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      // Hide hint if previously shown
      setCpHints((prev) => {
        const next = [...prev];
        next[idx] = false;
        return next;
      });
      // Confetti on first success for this checkpoint
      triggerConfetti(1200);
      // DB completion guard
      handleFirstSuccess();
    } else {
      // Show hint
      setCpHints((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
    }
  };

  // ── Footer / quiz navigation ────────────────────────────────────────────────
  const anyDone = cpDone.some(Boolean);
  const doneCount = cpDone.filter(Boolean).length;

  const goToQuiz = () => {
    if (!anyDone) return;
    // Ensure completion is tracked even if goToQuiz fires before a cp succeeded
    // (should already be tracked, but guard just in case)
    if (!hasMarkedComplete.current) {
      hasMarkedComplete.current = true;
      markLessonComplete(lessonData.id);
      trackStaticLessonCompletion(lessonData.id).catch((err) =>
        console.error(`Lesson ${lessonData.id} completion error:`, err)
      );
    }
    navigate(`/quiz/${lessonData.id}`, {
      state: { source: 'lesson', lessonId: lessonData.id },
    });
  };

  // ── Guard: missing prop ─────────────────────────────────────────────────────
  if (!lessonData) {
    return <div style={{ padding: '2rem' }}>No lesson data provided.</div>;
  }

  const { id, title, subtitle, emoji, story = [], concepts = [], checkpoints = [] } = lessonData;

  return (
    <div className="il-lesson">
      {/* Confetti canvas (fixed overlay, pointer-events: none) */}
      <canvas ref={confettiRef} className="il-confetti" />

      {/* Fixed Header + ProgressBar */}
      <div className="il-fixed-header">
        <Header />
        <ProgressBar currentStep="lesson" />
      </div>

      {/* Scrollable body */}
      <div className="il-scroll-body">
        <div className="il-lesson-wrapper">

          {/* ── Hero ──────────────────────────────────────────── */}
          <div className="il-hero">
            <span className="il-emoji" role="img" aria-label="lesson emoji">{emoji}</span>
            <div>
              <span className="il-pill">Lesson {id}</span>
              <h1 className="il-title">{title}</h1>
              {subtitle && <p className="il-subtitle">{subtitle}</p>}
            </div>
            <div className="il-calm-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={calmMode}
                  onChange={(e) => setCalmMode(e.target.checked)}
                />
                {' '}Calm mode
              </label>
            </div>
          </div>

          {/* ── Story panels ──────────────────────────────────── */}
          {story.length > 0 && (
            <div className="il-story-card">
              <p className="il-story-text">{story[storyIdx]}</p>
              <div className="il-story-nav">
                <button
                  type="button"
                  onClick={() => setStoryIdx((i) => Math.max(0, i - 1))}
                  disabled={storyIdx === 0}
                  aria-label="Previous story panel"
                >
                  ◀ Prev
                </button>
                <span className="il-story-counter">{storyIdx + 1} / {story.length}</span>
                <button
                  type="button"
                  onClick={() => setStoryIdx((i) => Math.min(story.length - 1, i + 1))}
                  disabled={storyIdx === story.length - 1}
                  aria-label="Next story panel"
                >
                  Next ▶
                </button>
              </div>
            </div>
          )}

          {/* ── Concept cards ─────────────────────────────────── */}
          {concepts.length > 0 && (
            <div className="il-concepts">
              {concepts.map((concept, i) => (
                <div key={i} className="il-concept-card">
                  <span className="il-concept-icon" role="img" aria-label={concept.title}>
                    {concept.icon}
                  </span>
                  <h3 className="il-concept-title">{concept.title}</h3>
                  <p className="il-concept-body">{concept.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Progress strip ────────────────────────────────── */}
          <div className="il-progress-strip">
            <span className="il-progress-label">
              Checkpoints: {doneCount}/{checkpoints.length}
            </span>
            {checkpoints.map((_, i) => (
              <span
                key={i}
                className={`il-cp-dot ${cpDone[i] ? 'il-cp-dot--done' : ''}`}
                title={cpDone[i] ? 'Done' : 'Not done'}
              >
                {cpDone[i] ? '✅' : '⭕'}
              </span>
            ))}
          </div>

          {/* ── Checkpoints ───────────────────────────────────── */}
          {checkpoints.map((cp, i) => (
            <div
              key={cp.id}
              className={`il-checkpoint ${cpDone[i] ? 'il-checkpoint--done' : ''}`}
            >
              <div className="il-cp-header">
                <div className="il-cp-num">{i + 1}</div>
                <div>
                  <h2 className="il-cp-title">{cp.title}</h2>
                  <p className="il-cp-desc">{cp.description}</p>
                </div>
                {cpDone[i] && (
                  <span className="il-cp-check" aria-label="Completed">✅</span>
                )}
              </div>

              {cp.xp && (
                <div className="il-cp-xp">+{cp.xp} XP</div>
              )}

              <PythonEditor
                initialCode={cp.initialCode}
                onOutput={(out) => handleCpOutput(i, cp, out)}
              />

              {cpHints[i] && cp.hint && (
                <div className="il-hint">
                  💡 {cp.hint}
                </div>
              )}
            </div>
          ))}

          {/* ── Footer ────────────────────────────────────────── */}
          <div className="il-footer">
            {anyDone && (
              <p className="il-footer-greeting">
                Great work, {firstName}! You're ready for the quiz.
              </p>
            )}
            <button
              type="button"
              className="il-quiz-btn"
              onClick={goToQuiz}
              disabled={!anyDone}
              title={anyDone ? `Go to Quiz ${id}` : 'Complete at least one checkpoint first'}
            >
              Ready for Quiz {id} 🎯
            </button>
            {!anyDone && (
              <p className="il-footer-hint">
                Complete at least one checkpoint to unlock the quiz.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractiveLessonTemplate;
