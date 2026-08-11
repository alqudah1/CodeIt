import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CodeRunnerPython from '../CodeRunnerPython';
import Header from '../../pages/Header/Header';
import LessonGuide from '../LessonGuide/LessonGuide';
import CharacterAvatar from '../CharacterAvatar/CharacterAvatar';
import './InteractiveLessonTemplate.css';
import { trackExerciseCompletion, trackStaticLessonCompletion } from '../../utils/progressTracker';
import { getJourneyNext } from '../../pages/Journey/journeyNext';
import { useProgress } from '../../context/ProgressContext';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { useSEO } from '../../hooks/useSEO';
import { API_BASE_URL } from '../../config/api';
import { getNextUnlock, getNextUnlockLabel } from '../../data/unlocks';
import { usePlayerProgress } from '../../hooks/usePlayerProgress';

const TYPE_LABEL  = { concept: 'Learn', example: 'Example', tryit: 'Try It', challenge: 'Challenge' };
const TYPE_COLOR  = { concept: 'concept', example: 'example', tryit: 'tryit', challenge: 'challenge' };

function childStepsFor(stepType, isDone) {
  if (isDone) return [
    'You did it!',
    'Press the big Next button below to keep going.',
  ];
  if (stepType === 'concept') return [
    'Look at the example in the box.',
    'When you are ready, press the big “Got It — Next Step” button below.',
  ];
  if (stepType === 'example') return [
    'You do not need to type yet.',
    'Find the orange “Run” button above the code and click it once.',
    'Look in the Output box for the computer’s answer.',
  ];
  if (stepType === 'tryit') return [
    'Click inside the white code box.',
    'Change the words between the quote marks. Ask for help with the keyboard if you need it.',
    'Click the orange “Run” button, then press “Submit Answer”.',
  ];
  return [
    'Click inside the white code box and change one message at a time.',
    'Click the orange “Run” button to check what you made.',
    'When it works, press “Submit Answer”.',
  ];
}

const LESSON_BUILDER_PROMPTS = {
  1:  'Build a project that displays a welcome message and shows text on the screen.',
  2:  'Build a website that uses variables to store and display a name, score, and fun message.',
  3:  'Build a project that works with text — display names, format messages, and show user input.',
  4:  'Build an interactive project that uses conditions to decide what happens when you click a button.',
  5:  'Build a project that uses a loop to create a countdown timer or repeat an action.',
  6:  'Build a text tool that goes through each word or letter and does something with it.',
  7:  'Build a project that uses a list to store and display multiple items like names or scores.',
  8:  'Build a project that loops through a list to display and process a collection of items.',
  9:  'Build a project with buttons where each button calls a different function to do something.',
  10: 'Build a mini-game that combines functions, loops, and lists all in one project.',
  11: 'Build a calculator or math quiz that uses numbers and arithmetic operations.',
  12: 'Build a quiz game that uses true or false questions and comparison operators.',
  13: 'Build a logic puzzle that uses and, or, and not conditions to decide answers.',
  14: 'Build a converter tool that transforms between different types like numbers and text.',
  15: 'Build a project that displays nicely formatted messages using templates and variables.',
  16: 'Build a text tool that cleans and transforms user text in different ways.',
};

const LESSON_SEO = {
  1:  { title: 'Hello Python',                            desc: 'Write your first Python print statement and make the computer say something. Free beginner lesson — runs in your browser.'              },
  2:  { title: 'Variables in Python',                    desc: 'Learn how to store names, numbers, and messages in Python variables. Free beginner Python lesson on CodeIt — no download needed.'   },
  3:  { title: 'Python Strings',                         desc: 'Explore Python strings — concatenation, .upper(), .lower(), and len(). Free interactive lesson for beginners, runs in browser.'       },
  4:  { title: 'If Statements in Python',                desc: 'Learn to make decisions in code with Python if statements and conditionals. Free beginner lesson — no install required.'              },
  5:  { title: 'For Loops with range()',                 desc: 'Repeat code automatically with Python for loops and range(). Free beginner lesson — write and run code in your browser.'               },
  6:  { title: 'For Loops over Strings',                 desc: 'Loop over every character in a string using Python for loops. Free interactive coding lesson for beginners on CodeIt.'                },
  7:  { title: 'Python Lists',                           desc: 'Create and use Python lists — indexing, .append(), and len(). Free beginner lesson — code runs in your browser, no install needed.'  },
  8:  { title: 'Loops with Lists in Python',             desc: 'Combine Python loops and lists to process collections of data. Free beginner coding lesson — runs instantly in your browser.'         },
  9:  { title: 'Python Functions',                       desc: 'Write reusable Python functions with def, parameters, and return values. Free interactive lesson for beginners on CodeIt.'            },
  10: { title: 'Combining Python Concepts',              desc: 'Put it all together — functions, loops, and lists in one Python project. Final free beginner lesson on CodeIt.'                       },
  11: { title: 'Numbers and Arithmetic',                desc: 'Learn Python integer and float arithmetic — add, subtract, multiply, divide, floor division, and modulo. Free beginner lesson on CodeIt.'    },
  12: { title: 'Booleans and Comparisons',              desc: 'Understand Python True/False values and comparison operators like ==, !=, <, >. Free interactive beginner lesson — runs in your browser.'   },
  13: { title: 'Logical Operators in Python',           desc: 'Combine conditions with Python and, or, and not. Free beginner lesson — write and test logical expressions in your browser.'                 },
  14: { title: 'Type Casting in Python',                desc: 'Convert between int, float, str, and bool in Python. Free beginner coding lesson — no install needed, runs in your browser.'                },
  15: { title: 'String Formatting with f-Strings',      desc: 'Build polished Python output using f-strings and format specifiers. Free interactive beginner lesson — runs directly in your browser.'       },
  16: { title: 'Python String Methods',                 desc: 'Clean and transform text with strip(), replace(), split(), join(), find(), and count(). Free Python beginner lesson on CodeIt.'              },
};

// JSON-LD: inject LearningResource + HowTo schema per lesson for Google Rich Snippets
function useLessonJsonLd(lessonData, seoTitle, seoDesc) {
  useEffect(() => {
    if (!lessonData?.id || !seoTitle) return;
    const BASE = 'https://codeitlearn.com';
    const id   = `lesson-jsonld-${lessonData.id}`;
    document.getElementById(id)?.remove();

    const howToSteps = (lessonData.steps || []).map((step, i) => ({
      '@type':  'HowToStep',
      position: i + 1,
      name:     step.title || `Step ${i + 1}`,
      text:     step.body  || step.description || step.title || '',
    }));

    const schema = [
      {
        '@context': 'https://schema.org',
        '@type':    'LearningResource',
        name:        seoTitle,
        description: seoDesc,
        url:         `${BASE}/lesson/${lessonData.id}`,
        educationalLevel: 'Beginner',
        inLanguage:  'en',
        isAccessibleForFree: true,
        isPartOf: {
          '@type': 'Course',
          name:    'Python for Beginners — 16 Free Interactive Lessons',
          url:     `${BASE}/lessons`,
        },
        provider: { '@type': 'Organization', name: 'CodeIt', url: BASE },
      },
      howToSteps.length > 0 && {
        '@context': 'https://schema.org',
        '@type':    'HowTo',
        name:       seoTitle,
        description: seoDesc,
        step:        howToSteps,
      },
    ].filter(Boolean);

    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id   = id;
    el.text = JSON.stringify(schema);
    document.head.appendChild(el);

    return () => { document.getElementById(id)?.remove(); };
  }, [lessonData, seoTitle, seoDesc]);
}

const InteractiveLessonTemplate = ({ lessonData }) => {
  // Extract id before hooks so useState / useEffect can reference it correctly
  const lessonId = lessonData?.id ?? null;

  const navigate   = useNavigate();
  const location   = useLocation();
  const { markLessonComplete } = useProgress();
  const { user, token } = useContext(AuthContext) || {};
  const { character } = useCharacter();
  const { xp, level, xpToNext } = usePlayerProgress(token);
  const firstName  = (user?.name || 'Coder').split(' ')[0];

  const seo = LESSON_SEO[lessonId] || {};
  const seoTitle = seo.title ? `Lesson ${lessonData.id}: ${seo.title} — Python for Beginners | CodeIt` : undefined;
  useSEO({
    title:       seoTitle,
    description: seo.desc,
    canonical:   lessonData?.id ? `/lesson/${lessonData.id}` : undefined,
  });
  useLessonJsonLd(lessonData, seoTitle, seo.desc);

  const confettiRef       = useRef(null);
  const hasMarkedComplete = useRef(false);

  const [stepIdx,     setStepIdx]     = useState(0);
  const [stepsDone,      setStepsDone]      = useState({});  // { [idx]: true }
  const [stepHintCounts, setStepHintCounts] = useState({});  // { [idx]: number revealed }
  const [lastOutputs,    setLastOutputs]    = useState({});  // { [idx]: string } — output from last Run
  const [feedback,       setFeedback]       = useState({});  // { [idx]: 'incorrect' | null }

  // ── Gate: lesson N requires lesson N-1 complete (logged-in users only) ──
  const [gateStatus, setGateStatus] = useState(lessonId === 1 ? 'open' : 'checking');

  // ── Completion screen ──────────────────────────────────────────────────
  const [completionData, setCompletionData] = useState(null); // { xpEarned, nextRoute }

  // ── Confetti canvas resize ──────────────────────────────────
  useEffect(() => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Gate: enforce lesson N requires lesson N-1 complete ─────
  // Only runs for logged-in users on lessons 2+.
  // Unauthenticated visitors may freely preview any lesson.
  useEffect(() => {
    if (lessonId <= 1) { setGateStatus('open'); return; }
    if (!user || !token) { setGateStatus('open'); return; }
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/lessons/progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        const completed = (data?.completedLessons || []).map(Number);
        setGateStatus(completed.includes(lessonId - 1) ? 'open' : 'locked');
      })
      .catch(() => { if (!cancelled) setGateStatus('open'); }); // fail open on network error
    return () => { cancelled = true; };
  }, [lessonId, user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerConfetti = (durationMs = 1200) => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx    = canvas.getContext('2d');
    const colors = ['#FE582A', '#FED340', '#06d6a0', '#4cc9f0', '#b5179e'];
    const parts  = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      r: 3 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4, vy: 2 + Math.random() * 3,
      g: 0.05 + Math.random() * 0.05, a: 1,
    }));
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach(p => {
        p.vy += p.g; p.x += p.vx; p.y += p.vy; p.a -= 0.005;
        ctx.globalAlpha = Math.max(p.a, 0);
        ctx.fillStyle   = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      if (ts - start < durationMs) requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(tick);
  };

  if (!lessonData) return <div style={{ padding: '2rem' }}>No lesson data provided.</div>;

  const { id, title, steps = [] } = lessonData;
  const totalSteps    = steps.length;
  const currentStep   = steps[stepIdx];
  const isLastStep    = stepIdx === totalSteps - 1;
  const isCurrentDone = !!stepsDone[stepIdx];
  const anyCodeDone          = steps.some((s, i) => s.type !== 'concept' && stepsDone[i]);
  const stepsCompletedCount  = Object.values(stepsDone).filter(Boolean).length;
  const progressPct          = totalSteps > 0 ? Math.round((stepsCompletedCount / totalSteps) * 100) : 0;

  const markStepDone = (idx) => {
    const step = steps[idx];
    if (step && step.type !== 'concept' && !stepsDone[idx]) {
      trackExerciseCompletion(
        id,
        idx,
        step.title || `${TYPE_LABEL[step.type] || 'Coding'} exercise ${idx + 1}`
      ).catch(err => console.error(`Exercise ${id}:${idx} completion error:`, err));
    }
    setStepsDone(prev => ({ ...prev, [idx]: true }));
  };

  // Returns hints array for a step — supports both hints:[] and legacy hint:string
  const getStepHints = (step) => step?.hints || (step?.hint ? [step.hint] : []);

  // ── Code output handler — fires on every Run ───────────────
  // Stores the latest output so Submit can validate it.
  // Example steps (observational) auto-pass on any non-empty output.
  const handleCodeOutput = (idx, step, output) => {
    setLastOutputs(prev => ({ ...prev, [idx]: output }));
    setFeedback(prev => ({ ...prev, [idx]: null })); // clear stale feedback on re-run

    if (step.type === 'example') {
      // Example steps: just run the pre-written code → auto-pass
      if (output && !stepsDone[idx]) {
        markStepDone(idx);
        triggerConfetti(900);
      }
    }
  };

  // ── Submit handler — explicit validation ────────────────────
  const submitAnswer = (idx, step) => {
    const output = lastOutputs[idx] ?? '';
    const passed = step.successPattern.test(output.trim());

    if (passed) {
      setFeedback(prev => ({ ...prev, [idx]: null }));
      markStepDone(idx);
      setStepHintCounts(prev => ({ ...prev, [idx]: 0 }));
      triggerConfetti(1400);
    } else {
      setFeedback(prev => ({ ...prev, [idx]: 'incorrect' }));
      // Reveal next hint on each wrong submission
      const maxHints = getStepHints(step).length;
      setStepHintCounts(prev => ({
        ...prev,
        [idx]: Math.min((prev[idx] || 0) + 1, maxHints),
      }));
    }
  };

  // ── Navigation ──────────────────────────────────────────────
  const advanceStep = () => {
    const next = stepIdx + 1;
    setStepIdx(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConceptNext = () => {
    markStepDone(stepIdx);
    if (!isLastStep) advanceStep();
    else goToQuiz();
  };

  const handleCodeNext = () => {
    if (!isLastStep) advanceStep();
    else goToQuiz();
  };

  const goPrev = () => {
    if (stepIdx > 0) {
      setStepIdx(i => i - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToQuiz = async () => {
    // Await lesson completion so the DB is updated before the quiz gate check runs
    let xpEarned = 0;
    if (!hasMarkedComplete.current) {
      hasMarkedComplete.current = true;
      markLessonComplete(id);
      try {
        const result = await trackStaticLessonCompletion(id);
        xpEarned = result?.alreadyCompleted ? 0 : (result?.xpEarned ?? 0);
      } catch (err) {
        console.error(`Lesson ${id} completion error:`, err);
        // Show completion screen anyway — don't strand the student on a network blip
      }
    }
    const params      = new URLSearchParams(location.search);
    const fromJourney = params.get('from') === 'journey';
    const nodeId      = params.get('node');
    const nextRoute   = (fromJourney && nodeId)
      ? getJourneyNext(nodeId)
      : `/quiz/${id}`;
    setCompletionData({ xpEarned, quizId: id, nextRoute, fromJourney });
  };

  // Can the current step be proceeded past?
  const canProceed = currentStep?.type === 'concept' || isCurrentDone;

  // Next-button label
  const nextLabel = () => {
    if (isLastStep) {
      if (canProceed) return `Complete Lesson — Unlock Quiz ${id}`;
      return 'Complete this step to advance';
    }
    if (currentStep?.type === 'concept') return 'Got It — Next Step';
    if (canProceed) return 'Step Complete — Next';
    if (currentStep?.type === 'example') return 'Run the code to continue';
    return 'Submit your answer to advance';
  };

  const handleNextClick = () => {
    if (!canProceed) return;
    if (currentStep?.type === 'concept') handleConceptNext();
    else if (isLastStep) goToQuiz();
    else handleCodeNext();
  };

  // ── Gate screen — locked lesson ──────────────────────────────
  if (gateStatus === 'locked') {
    return (
      <div className="sl-lesson">
        <div className="sl-fixed-header"><Header /></div>
        <div className="sl-gate-screen">
          <div className="sl-gate-card">
            <div className="sl-gate-card__icon">
              <span aria-hidden="true">L</span>
            </div>
            <h2 className="sl-gate-card__title">Lesson {id} is locked</h2>
            <p className="sl-gate-card__body">
              You need to complete <strong>Lesson {id - 1}</strong> before you can start this one.
              Each lesson builds on the one before it.
            </p>
            <div className="sl-gate-card__actions">
              <button
                className="sl-gate-card__btn sl-gate-card__btn--primary"
                onClick={() => navigate(`/lesson/${id - 1}`)}
              >
                Go to Lesson {id - 1}
              </button>
              <button
                className="sl-gate-card__btn sl-gate-card__btn--ghost"
                onClick={() => navigate('/lessons')}
              >
                View All Lessons
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Completion screen ─────────────────────────────────────────
  if (completionData) {
    return (
      <div className="sl-lesson">
        <div className="sl-fixed-header"><Header /></div>
        <div className="sl-completion-screen">
          <div className="sl-completion-card">
            {character && (
              <div className="sl-completion-card__avatar">
                <CharacterAvatar character={character} size={88} />
              </div>
            )}
            <div className="sl-completion-card__badge">Lesson Complete</div>
            <h2 className="sl-completion-card__title">
              Lesson {id} done, {firstName}!
            </h2>
            <p className="sl-completion-card__sub">
              {title} — finished.
            </p>
            {completionData.xpEarned > 0 && (
              <div className="sl-completion-card__xp">
                +{completionData.xpEarned} XP earned
              </div>
            )}
            {(() => {
              const nu = getNextUnlock(level);
              if (!nu) return null;
              if (xpToNext > 0 && xpToNext <= 150) {
                return (
                  <p className="sl-completion-card__level-hint sl-completion-card__level-hint--urgent">
                    Only {xpToNext} XP to reach Level {level + 1}!
                  </p>
                );
              }
              return (
                <p className="sl-completion-card__level-hint">
                  Next reward: {getNextUnlockLabel(nu)} unlocks at Level {nu.atLevel}
                </p>
              );
            })()}
            <p className="sl-completion-card__cta-hint">
              {completionData.fromJourney
                ? 'Head back to the Journey Map to continue your path.'
                : `Quiz ${completionData.quizId} is now unlocked. Test what you just learned.`}
            </p>
            <div className="sl-completion-card__actions">
              <button
                className="sl-completion-card__btn sl-completion-card__btn--primary"
                onClick={() => navigate(completionData.nextRoute)}
              >
                {completionData.fromJourney ? 'Back to Journey' : `Start Quiz ${completionData.quizId}`}
              </button>
              {LESSON_BUILDER_PROMPTS[id] && (
                <button
                  className="sl-completion-card__btn sl-completion-card__btn--builder"
                  onClick={() => navigate(`/builder?prompt=${encodeURIComponent(LESSON_BUILDER_PROMPTS[id])}`)}
                >
                  Use this in Project Studio
                </button>
              )}
              <button
                className="sl-completion-card__btn sl-completion-card__btn--ghost"
                onClick={() => navigate('/lessons')}
              >
                All Lessons
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sl-lesson">
      {/* Confetti */}
      <canvas ref={confettiRef} className="sl-confetti" />

      {/* Fixed header: global nav + compact lesson strip */}
      <div className="sl-fixed-header">
        <Header />
        <div className="sl-lesson-strip">
          <button className="sl-strip__back" onClick={() => navigate('/lessons')} aria-label="Back to lessons">
            &#8592; Lessons
          </button>
          <div className="sl-strip__center">
            <span className="sl-strip__title">Lesson {id} &middot; {title}</span>
            <div
              className="sl-strip__bar-track"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Lesson progress: ${progressPct}%`}
            >
              <div className="sl-strip__bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          {user && (
            <div className="sl-strip__xp">
              <span className="sl-strip__xp-lv">Lv.{level}</span>
              <span className="sl-strip__xp-val">{(xp || 0).toLocaleString()} XP</span>
            </div>
          )}
        </div>
      </div>

      <div className="sl-body">

        {/* ── Journey path: Lesson → Quiz → Puzzle ─────── */}
        <div className="sl-journey-path" aria-label="Your learning path">
          <div className="sl-jp-node sl-jp-node--active">
            <div className="sl-jp-dot">L</div>
            <span className="sl-jp-label">Lesson {id}</span>
          </div>
          <div className="sl-jp-connector" aria-hidden="true" />
          <div className="sl-jp-node sl-jp-node--upcoming">
            <div className="sl-jp-dot">Q</div>
            <span className="sl-jp-label">Quiz {id}</span>
          </div>
          <div className="sl-jp-connector" aria-hidden="true" />
          <div className="sl-jp-node sl-jp-node--upcoming">
            <div className="sl-jp-dot">P</div>
            <span className="sl-jp-label">Puzzle</span>
          </div>
        </div>

        {/* ── Main step card ───────────────────────────── */}
        <div className={`sl-card sl-card--${currentStep?.type || 'concept'}`}>

          {/* Card head: type tag + step counter */}
          <div className="sl-card__head">
            <div className="sl-card__tags">
              <span className={`sl-tag sl-tag--${TYPE_COLOR[currentStep?.type] || 'concept'}`}>
                {TYPE_LABEL[currentStep?.type] || 'Step'}
              </span>
              {isCurrentDone && <span className="sl-tag sl-tag--done">Done</span>}
            </div>
            <span className="sl-card__step-num">{stepIdx + 1} / {totalSteps}</span>
          </div>

          {/* Step title */}
          <h2 className="sl-card__title">{currentStep?.title}</h2>

          <aside className="sl-now" aria-live="polite" aria-label="What to do now">
            <span className="sl-now__eyebrow">What to do now</span>
            <ol>
              {childStepsFor(currentStep?.type, isCurrentDone).map((instruction, index) => (
                <li key={instruction}><b>{index + 1}</b><span>{instruction}</span></li>
              ))}
            </ol>
          </aside>

          {/* ────── CONCEPT step ───────────────────────── */}
          {currentStep?.type === 'concept' && (
            <div className="sl-concept">
              <p className="sl-concept__body">{currentStep.body}</p>
              {currentStep.highlight && (
                <div className="sl-concept__highlight">
                  <span className="sl-concept__highlight-label">Key idea</span>
                  <pre>{currentStep.highlight}</pre>
                </div>
              )}
              {currentStep.code && (
                <div className="sl-concept__code-wrap">
                  <div className="sl-terminal-bar">
                    <span className="sl-terminal-dots"><i /><i /><i /></span>
                    <span className="sl-terminal-lang">Python</span>
                    <span className="sl-terminal-ro">read only</span>
                  </div>
                  <pre className="sl-concept__code"><code>{currentStep.code}</code></pre>
                </div>
              )}
            </div>
          )}

          {/* ────── CODE steps (example / tryit / challenge) ── */}
          {currentStep?.type !== 'concept' && (
            <div className="sl-code-step">
              <p className="sl-code-step__desc">{currentStep?.description}</p>

              {/* All code-step editors mounted; only current one shown */}
              <div className="sl-editors">
                {steps.map((step, i) => {
                  if (step.type === 'concept') return null;
                  return (
                    <div
                      key={step.id || i}
                      className={i === stepIdx ? 'sl-editor-wrap' : 'sl-editor-wrap sl-editor-wrap--hidden'}
                      aria-hidden={i !== stepIdx}
                    >
                      <div className="sl-terminal-bar">
                        <span className="sl-terminal-dots"><i /><i /><i /></span>
                        <span className="sl-terminal-lang">Python</span>
                      </div>
                      <CodeRunnerPython
                        starterCode={step.code}
                        title={step.title}
                        onOutput={(out) => handleCodeOutput(i, step, out)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* ── Submit Answer (tryit / challenge only) ── */}
              {(currentStep?.type === 'tryit' || currentStep?.type === 'challenge') && !isCurrentDone && (
                <button
                  className="sl-submit-btn"
                  onClick={() => submitAnswer(stepIdx, currentStep)}
                  disabled={!lastOutputs[stepIdx]}
                  title={!lastOutputs[stepIdx] ? 'Run your code first, then submit' : ''}
                >
                  {!lastOutputs[stepIdx] ? 'Run your code first' : 'Submit Answer'}
                </button>
              )}

              {/* ── Incorrect feedback ───────────────────── */}
              {feedback[stepIdx] === 'incorrect' && !isCurrentDone && (
                <div className="sl-feedback sl-feedback--incorrect">
                  <span className="sl-feedback__icon" aria-hidden="true">✗</span>
                  <div>
                    <strong>Not quite.</strong> Check your output above and try again.
                  </div>
                </div>
              )}

              {/* ── Hint — progressive reveal ────────────── */}
              {!isCurrentDone && (() => {
                const hints = getStepHints(currentStep);
                if (!hints.length) return null;
                const count = stepHintCounts[stepIdx] || 0;
                return (
                  <div className="sl-hints">
                    {count > 0 && (
                      <div className="sl-hint">
                        <span className="sl-hint__label">
                          Hint{hints.length > 1 ? ` ${count}` : ''}
                        </span>
                        <span>{hints[count - 1]}</span>
                      </div>
                    )}
                    {count < hints.length && currentStep?.type !== 'example' && (
                      <button
                        type="button"
                        className="sl-hint-btn"
                        onClick={() => setStepHintCounts(prev => ({
                          ...prev,
                          [stepIdx]: (prev[stepIdx] || 0) + 1,
                        }))}
                      >
                        {count === 0 ? 'Show Hint' : 'Next Hint'}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Success */}
              {isCurrentDone && (
                <div className="sl-success">
                  <span>
                    <strong>
                      {isLastStep
                        ? `Lesson ${id} complete, ${firstName}! Quiz ${id} is now unlocked.`
                        : 'Step complete. Advance to the next one.'}
                    </strong>
                    {currentStep?.xp && (
                      <span className="sl-success__xp">+{currentStep.xp} XP earned</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ────── Navigation ─────────────────────────── */}
          <div className="sl-nav">
            <button
              className="sl-nav__back"
              onClick={goPrev}
              disabled={stepIdx === 0}
            >
              Back
            </button>

            <button
              className={isLastStep ? 'sl-nav__continue' : 'sl-nav__next'}
              onClick={handleNextClick}
              disabled={!canProceed}
            >
              {nextLabel()}
            </button>
          </div>
        </div>

        {/* ── Finish early: visible once at least one code step is done ── */}
        {anyCodeDone && !isLastStep && (
          <div className="sl-skip-row">
            <button className="sl-skip-btn" onClick={goToQuiz}>
              Finish lesson and go to Quiz {id}
            </button>
          </div>
        )}

        {/* ── Use this in AI Builder ─────────────────────────── */}
        {LESSON_BUILDER_PROMPTS[id] && (
          <div className="sl-builder-link">
            <span className="sl-builder-link__label">Want to see this in action?</span>
            <a
              href={`/builder?prompt=${encodeURIComponent(LESSON_BUILDER_PROMPTS[id])}`}
              className="sl-builder-link__btn"
            >
              Use this in Project Studio
            </a>
          </div>
        )}

      </div>

      {/* ── Character guide — fixed bottom-right ── */}
      <LessonGuide
        stepType={currentStep?.type}
        isCurrentDone={isCurrentDone}
        isLastStep={isLastStep}
      />
    </div>
  );
};

export default InteractiveLessonTemplate;
