import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CodeRunnerPython from '../CodeRunnerPython';
import Header from '../../pages/Header/Header';
import LessonGuide from '../LessonGuide/LessonGuide';
import CharacterAvatar from '../CharacterAvatar/CharacterAvatar';
import './InteractiveLessonTemplate.css';
import { trackExerciseCompletion, trackStaticLessonCompletion } from '../../utils/progressTracker';
import { trackEvent } from '../../utils/trackEvent';
import { getJourneyNext } from '../../pages/Journey/journeyNext';
import { useProgress } from '../../context/ProgressContext';
import { AuthContext } from '../../context/AuthContext';
import { useCharacter } from '../../context/CharacterContext';
import { useSEO } from '../../hooks/useSEO';
import { API_BASE_URL } from '../../config/api';
import { getNextUnlock, getNextUnlockLabel } from '../../data/unlocks';
import { usePlayerProgress } from '../../hooks/usePlayerProgress';
import { TOTAL_LESSONS, builderPromptFor, getLessonEntry, seoFor } from '../../pages/Lessons/lessonRegistry';
import { hasQuiz, loadQuizIds } from '../../utils/quizAvailability';
import { effectiveGuideLevel } from '../../utils/guideLevel';
import { PredictOutput, FillBlank, OrderSteps } from './LessonInteractions';
import {
  blankCount,
  checkCodeStep,
  checkFillBlank,
  checkOrder,
  checkPredict,
  codeFeedback,
  isInteractionStep,
} from './interactionGrading';

const TYPE_LABEL = {
  concept:   'Learn',
  example:   'Example',
  tryit:     'Try It',
  challenge: 'Challenge',
  predict:   'Guess',
  fillblank: 'Build It',
  order:     'Put In Order',
};

const TYPE_COLOR = {
  concept:   'concept',
  example:   'example',
  tryit:     'tryit',
  challenge: 'challenge',
  predict:   'predict',
  fillblank: 'fillblank',
  order:     'order',
};

// XP is only ever displayed from this table, never invented per step, so what a
// child sees on screen is what the server actually banked for them.
const STEP_XP = {
  example:   5,
  predict:   10,
  fillblank: 10,
  order:     10,
  tryit:     15,
  challenge: 20,
};

function xpForStep(step) {
  return step?.type === 'concept' ? 0 : (STEP_XP[step?.type] || 10);
}

// ── Progress that survives a closed laptop ───────────────────────────────────
//
// A lesson used to lose every finished step on refresh. For a child working in
// twenty-minute slots at school that meant starting Lesson 9 from scratch on
// Tuesday. Server progress still decides what counts as complete; this is only
// so the lesson reopens where they left it.
const stepStateKey = (lessonId) => `codeit.lesson.${lessonId}.steps`;

function loadStepState(lessonId) {
  try {
    const raw = window.localStorage.getItem(stepStateKey(lessonId));
    const saved = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== 'object') return null;
    return {
      stepIdx:   Number(saved.stepIdx) || 0,
      stepsDone: saved.stepsDone && typeof saved.stepsDone === 'object' ? saved.stepsDone : {},
      picks:     saved.picks && typeof saved.picks === 'object' ? saved.picks : {},
    };
  } catch {
    // Private browsing, a full quota, a corrupted value — none of which should
    // stop the lesson from opening.
    return null;
  }
}

function saveStepState(lessonId, state) {
  try {
    window.localStorage.setItem(stepStateKey(lessonId), JSON.stringify(state));
  } catch {
    // Nothing to do: progress is a convenience here, not the source of truth.
  }
}

function childStepsFor(stepType, isDone) {
  if (isDone) return [
    'You did it!',
    'Press the big Next button below to keep going.',
  ];
  if (stepType === 'concept') return [
    'Look at the example in the box.',
    'When you are ready, press the big “Got It. Next Step” button below.',
  ];
  if (stepType === 'example') return [
    'You do not need to type yet.',
    'Find the orange “Run” button above the code and click it once.',
    'Look in the Output box for the computer’s answer.',
  ];
  if (stepType === 'predict') return [
    'Read the code in the dark box.',
    'Work out what it will print.',
    'Tap the answer you think is right, then press “Check my answer”.',
  ];
  if (stepType === 'fillblank') return [
    'Some pieces are missing from the code.',
    'Tap a word from the row below to drop it into the yellow gap.',
    'Tap a filled gap to take the word back out.',
  ];
  if (stepType === 'order') return [
    'These lines are in the wrong order.',
    'Use the ↑ and ↓ buttons to move a line up or down.',
    'When the order looks right, press “Check my answer”.',
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

// The builder prompt and the page title used to live in two hardcoded maps here,
// keyed 1..16. A seventeenth lesson would have been routable and invisible to
// Google, with no project to build afterwards. Both now come from the registry.

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
          name:    `Python for Beginners. ${TOTAL_LESSONS} Free Interactive Lessons`,
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

  // The same setting the Studio writes. A child who asked for "Big
  // help" there was still getting small text and dense choices in lessons.
  const guideLevel = effectiveGuideLevel(user);

  const seo = seoFor(lessonId);
  const seoTitle = seo.title ? `Lesson ${lessonData.id}: ${seo.title}. Python for Beginners | CodeIt` : undefined;
  useSEO({
    title:       seoTitle,
    description: seo.desc,
    canonical:   lessonData?.id ? `/lesson/${lessonData.id}` : undefined,
  });
  useLessonJsonLd(lessonData, seoTitle, seo.desc);

  const confettiRef       = useRef(null);
  const hasMarkedComplete = useRef(false);

  // Restored synchronously on first render so the lesson never flashes step 1
  // before jumping to where the student actually was.
  const restored = useRef(loadStepState(lessonId)).current;

  const [stepIdx,     setStepIdx]     = useState(restored?.stepIdx || 0);
  const [stepsDone,      setStepsDone]      = useState(restored?.stepsDone || {}); // { [idx]: true }
  const [stepHintCounts, setStepHintCounts] = useState({});  // { [idx]: number revealed }
  const [lastOutputs,    setLastOutputs]    = useState({});  // { [idx]: string }. output from last Run
  const [lastCode,       setLastCode]       = useState({});  // { [idx]: string }. code from last Run
  const [feedback,       setFeedback]       = useState({});  // { [idx]: 'incorrect' | null }
  const [feedbackText,   setFeedbackText]   = useState({});  // { [idx]: string }. why it was wrong
  const [picks,          setPicks]          = useState(restored?.picks || {}); // non-typing answers
  const [xpToast,        setXpToast]        = useState(null); // { amount, label }

  // Keep the saved position in step with what is on screen.
  useEffect(() => {
    if (!lessonId) return;
    saveStepState(lessonId, { stepIdx, stepsDone, picks });
  }, [lessonId, stepIdx, stepsDone, picks]);

  // ── Gate: lesson N requires lesson N-1 complete (logged-in users only) ──
  const [gateStatus, setGateStatus] = useState(lessonId === 1 ? 'open' : 'checking');

  // ── Completion screen ──────────────────────────────────────────────────
  const [completionData, setCompletionData] = useState(null); // { xpEarned, nextRoute }

  // Which lessons actually end in a quiz. See utils/quizAvailability.js: fifteen
  // of the thirty-one do not, and every one of them used to end on a button
  // promising one.
  const [quizIds, setQuizIds] = useState(null);
  useEffect(() => { loadQuizIds().then(setQuizIds); }, []);
  const quizExists = hasQuiz(quizIds, lessonId);

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
        step.title || `${TYPE_LABEL[step.type] || 'Coding'} exercise ${idx + 1}`,
        xpForStep(step)
      )
        .then(result => {
          // Only celebrate XP the server says it actually banked. Re-doing a
          // step you already finished is fine, it just does not pay twice.
          if (result?.xpEarned > 0) setXpToast({ amount: result.xpEarned, label: TYPE_LABEL[step.type] });
        })
        .catch(err => console.error(`Exercise ${id}:${idx} completion error:`, err));
    }
    setStepsDone(prev => ({ ...prev, [idx]: true }));
  };

  // Returns hints array for a step — supports both hints:[] and legacy hint:string
  const getStepHints = (step) => step?.hints || (step?.hint ? [step.hint] : []);

  // ── Code output handler — fires on every Run ───────────────
  // Stores the latest output so Submit can validate it.
  // Example steps (observational) auto-pass on any non-empty output.
  const handleCodeOutput = (idx, step, output, code) => {
    setLastOutputs(prev => ({ ...prev, [idx]: output }));
    setLastCode(prev => ({ ...prev, [idx]: code || '' }));
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
  /**
   * Grade whatever kind of step this is.
   *
   * Code steps used to be checked with `step.successPattern.test(output)`, and
   * most lessons carried patterns loose enough that running the untouched
   * starter code passed. checkCodeStep also asks whether the concept the step
   * is teaching appears in the code, so "change one word and run" no longer
   * counts as having written a loop.
   */
  const gradeStep = (idx, step) => {
    if (step.type === 'predict')   return { passed: checkPredict(step, picks[idx]) };
    if (step.type === 'fillblank') return { passed: checkFillBlank(step, picks[idx] || []) };
    if (step.type === 'order')     return { passed: checkOrder(step, picks[idx] || []) };
    return checkCodeStep(step, { code: lastCode[idx] || '', output: lastOutputs[idx] ?? '' });
  };

  const submitAnswer = (idx, step) => {
    const result = gradeStep(idx, step);

    if (result.passed) {
      setFeedback(prev => ({ ...prev, [idx]: null }));
      setFeedbackText(prev => ({ ...prev, [idx]: '' }));
      markStepDone(idx);
      setStepHintCounts(prev => ({ ...prev, [idx]: 0 }));
      triggerConfetti(1400);
      return;
    }

    setFeedback(prev => ({ ...prev, [idx]: 'incorrect' }));
    setFeedbackText(prev => ({
      ...prev,
      [idx]: isInteractionStep(step)
        ? (step.wrongHint || 'Not that one. Have another look and try again.')
        : codeFeedback(result, step),
    }));
    // Reveal one more hint on each wrong try, so a stuck child is always moving
    // towards the answer rather than guessing in the dark.
    const maxHints = getStepHints(step).length;
    setStepHintCounts(prev => ({
      ...prev,
      [idx]: Math.min((prev[idx] || 0) + 1, maxHints),
    }));
  };

  // Optional steps are the stretch goal. A child who is tired or out of time
  // can move on without being blocked, and without it looking like failure.
  const skipOptional = (idx) => {
    setStepsDone(prev => ({ ...prev, [idx]: true }));
    setFeedback(prev => ({ ...prev, [idx]: null }));
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
    // A lesson with no quiz sends them to the next lesson, or to the studio if
    // this was the last one. Anything is better than a button that promises a
    // quiz and delivers an error page.
    const afterLesson = quizExists
      ? `/quiz/${id}`
      : (Number(id) < TOTAL_LESSONS ? `/lesson/${Number(id) + 1}` : '/builder');
    const nextRoute   = (fromJourney && nodeId)
      ? getJourneyNext(nodeId)
      : afterLesson;
    setCompletionData({ xpEarned, quizId: id, nextRoute, fromJourney, quizExists });
  };

  // Can the current step be proceeded past?
  // The one project this lesson unlocks. Null on a lesson that has none, and
  // every branch below reads it rather than calling builderPromptFor twice —
  // the button label and the sentence above it must never name different things.
  const lessonPrompt = builderPromptFor(id);
  const studioPrompt = completionData.fromJourney ? null : lessonPrompt;

  const canProceed = currentStep?.type === 'concept' || isCurrentDone;

  // The lesson either side of this one, when there is one. getLessonEntry
  // returns null past the ends, so lesson 1 has no previous and lesson 31 has
  // no next without either being special-cased here.
  const previousLesson = getLessonEntry(Number(id) - 1);
  const nextLesson = getLessonEntry(Number(id) + 1);

  // Next-button label
  const nextLabel = () => {
    if (isLastStep) {
      if (canProceed) return quizExists ? `Complete Lesson. Unlock Quiz ${id}` : 'Finish this lesson';
      return 'Complete this step to advance';
    }
    if (currentStep?.type === 'concept') return 'Got It. Next Step';
    if (canProceed) return 'Step Complete. Next';
    if (currentStep?.type === 'example') return 'Run the code to continue';
    // "Check your answer to advance" is exactly what a child has just done when
    // they get here after a wrong attempt, which reads as a broken screen
    // rather than as an instruction.
    if (isInteractionStep(currentStep)) {
      return feedback[stepIdx] === 'incorrect'
        ? 'Pick a different answer'
        : 'Check your answer to advance';
    }
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
              {title}. finished.
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
            {/* ── The studio door ──
                326 accounts, read from production on 1 Sept: 236 learners
                finished a lesson and 23 ever made a project. Learners reach
                the commodity part of this site and almost never reach the
                part that is ours. The end of a lesson was sending them to
                the next lesson, and the studio sat underneath as the second
                button nobody pressed.

                So when the lesson has something to build, that is the door
                in front. The quiz does not disappear, it moves one place
                down and still says its own name. This is a test with a
                number attached: re-read the milestone table in a week. If
                the build rate moves, this was the bottleneck. If it does
                not, the hypothesis was wrong and we say so. */}
            <p className="sl-completion-card__cta-hint">
              {completionData.fromJourney
                ? 'Head back to the Journey Map to continue your path.'
                : studioPrompt
                  ? `You just learned ${title}. Here is something that uses it: ${studioPrompt}. Go and change it until it is yours.`
                  : completionData.quizExists
                    ? `Quiz ${completionData.quizId} is now unlocked. Test what you just learned.`
                    : 'Nice work. Carry straight on to the next lesson.'}
            </p>
            <div className="sl-completion-card__actions">
              {studioPrompt && (
                <button
                  className="sl-completion-card__btn sl-completion-card__btn--primary sl-completion-card__btn--studio"
                  onClick={() => {
                    void trackEvent('lesson_to_studio', null, token);
                    navigate(`/builder?prompt=${encodeURIComponent(studioPrompt)}&from=lesson-${id}`);
                  }}
                >
                  Build {studioPrompt}
                </button>
              )}
              <button
                className={`sl-completion-card__btn ${studioPrompt ? 'sl-completion-card__btn--builder' : 'sl-completion-card__btn--primary'}`}
                onClick={() => navigate(completionData.nextRoute)}
              >
                {completionData.fromJourney
                  ? 'Back to Journey'
                  : completionData.quizExists
                    ? `Start Quiz ${completionData.quizId}`
                    : (Number(completionData.quizId) < TOTAL_LESSONS ? 'Next lesson' : 'Go and build something')}
              </button>
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
    <div className={`sl-lesson sl-lesson--${guideLevel}`}>
      {/* Confetti */}
      <canvas ref={confettiRef} className="sl-confetti" />

      {xpToast && (
        <div className="sl-xp-toast" role="status" onAnimationEnd={() => setXpToast(null)}>
          +{xpToast.amount} XP
        </div>
      )}

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

          {/* A reason to care, before the code. Every step may set its own; the
              lesson's own story line opens step one. */}
          {(currentStep?.story || (stepIdx === 0 && lessonData.story)) && (
            <p className="sl-story">
              <span className="sl-story__icon" aria-hidden="true">💬</span>
              {currentStep?.story || lessonData.story}
            </p>
          )}

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

          {/* ────── NON-TYPING steps (predict / fill blank / order) ── */}
          {isInteractionStep(currentStep) && (
            <div className="sl-code-step">
              {currentStep.description && (
                <p className="sl-code-step__desc">{currentStep.description}</p>
              )}

              {currentStep.type === 'predict' && (
                <PredictOutput
                  step={currentStep}
                  chosen={picks[stepIdx]}
                  wrong={feedback[stepIdx] === 'incorrect' ? picks[stepIdx] : undefined}
                  onChoose={(choice) => setPicks(prev => ({ ...prev, [stepIdx]: choice }))}
                  locked={isCurrentDone}
                />
              )}

              {currentStep.type === 'fillblank' && (
                <FillBlank
                  step={currentStep}
                  filled={picks[stepIdx] || Array(blankCount(currentStep.template)).fill(null)}
                  onFill={(filled) => setPicks(prev => ({ ...prev, [stepIdx]: filled }))}
                  locked={isCurrentDone}
                />
              )}

              {currentStep.type === 'order' && (
                <OrderSteps
                  step={currentStep}
                  arranged={picks[stepIdx] || currentStep.shuffled || currentStep.correctOrder}
                  onArrange={(arranged) => setPicks(prev => ({ ...prev, [stepIdx]: arranged }))}
                  locked={isCurrentDone}
                />
              )}

              {/* Why it was wrong comes before the button that tries again.
                  It used to sit underneath, so the reading order was
                  answers → big orange button → the reason, and the reason was
                  the last thing a child found. */}
              {feedback[stepIdx] === 'incorrect' && !isCurrentDone && (
                <div className="sl-feedback sl-feedback--incorrect" role="status">
                  <span className="sl-feedback__icon" aria-hidden="true">✗</span>
                  <div>{feedbackText[stepIdx] || 'Not quite. Try again.'}</div>
                </div>
              )}

              {!isCurrentDone && (
                <button
                  className="sl-submit-btn"
                  onClick={() => submitAnswer(stepIdx, currentStep)}
                  disabled={picks[stepIdx] === undefined && currentStep.type === 'predict'}
                >
                  {feedback[stepIdx] === 'incorrect' ? 'Check my new answer' : 'Check my answer'}
                </button>
              )}

              {isCurrentDone && (
                <div className="sl-success">
                  <span>
                    <strong>{currentStep.explain || 'Correct!'}</strong>
                    <span className="sl-success__xp">+{xpForStep(currentStep)} XP</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ────── CODE steps (example / tryit / challenge) ── */}
          {currentStep?.type !== 'concept' && !isInteractionStep(currentStep) && (
            <div className="sl-code-step">
              <p className="sl-code-step__desc">{currentStep?.description}</p>

              {/* All code-step editors mounted; only current one shown */}
              <div className="sl-editors">
                {steps.map((step, i) => {
                  if (step.type === 'concept' || isInteractionStep(step)) return null;
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
                        onOutput={(out, ranCode) => handleCodeOutput(i, step, out, ranCode)}
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
                  <div>{feedbackText[stepIdx] || 'Not quite. Check your output above and try again.'}</div>
                </div>
              )}

              {/* ── Hint. Progressive reveal ────────────── */}
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
                    <span className="sl-success__xp">+{xpForStep(currentStep)} XP</span>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* A stretch step should never be the reason a lesson goes unfinished. */}
          {currentStep?.optional && !isCurrentDone && (
            <button className="sl-skip-optional" onClick={() => skipOptional(stepIdx)}>
              Skip this extra challenge
            </button>
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

        {/* ── The lesson before and the lesson after ────────────────────────
            Thirty-one lesson pages, and until now not one of them linked to
            another. The sitemap declared all thirty-one and nothing on the site
            vouched for any of them: no chain to follow, no way to read the
            course in order without going back to the map, and nothing for a
            crawler to walk.

            These are plain anchors and they are always present. Reading the
            next lesson's page is not the same as completing it, and the gate
            that stops a child skipping ahead lives on the lesson itself. */}
        <nav className="sl-around" aria-label="Other lessons">
          {previousLesson && (
            <Link className="sl-around__link sl-around__link--prev" to={`/lesson/${previousLesson.data.id}`}>
              <span className="sl-around__where">Lesson {previousLesson.data.id}</span>
              <span className="sl-around__title">{previousLesson.data.title}</span>
            </Link>
          )}
          {nextLesson && (
            <Link className="sl-around__link sl-around__link--next" to={`/lesson/${nextLesson.data.id}`}>
              <span className="sl-around__where">Lesson {nextLesson.data.id}</span>
              <span className="sl-around__title">{nextLesson.data.title}</span>
            </Link>
          )}
          <Link className="sl-around__all" to="/lessons">All {TOTAL_LESSONS} lessons</Link>
        </nav>

        {/* ── Finish early: visible once at least one code step is done ── */}
        {anyCodeDone && !isLastStep && (
          <div className="sl-skip-row">
            <button className="sl-skip-btn" onClick={goToQuiz}>
              Finish lesson and go to Quiz {id}
            </button>
          </div>
        )}

        {/* ── Use this in AI Builder ─────────────────────────── */}
        {lessonPrompt && (
          <div className="sl-builder-link">
            <span className="sl-builder-link__label">Want to see this in action?</span>
            <a
              href={`/builder?prompt=${encodeURIComponent(lessonPrompt)}&from=lesson-${id}`}
              className="sl-builder-link__btn"
            >
              Open this in the studio
            </a>
          </div>
        )}

      </div>

      {/* ── Character guide. Fixed bottom-right ── */}
      <LessonGuide
        stepType={currentStep?.type}
        isCurrentDone={isCurrentDone}
        isLastStep={isLastStep}
      />
    </div>
  );
};

export default InteractiveLessonTemplate;
