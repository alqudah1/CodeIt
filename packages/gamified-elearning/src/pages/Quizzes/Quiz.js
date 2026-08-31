import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { useCharacter } from "../../context/CharacterContext";
import CharacterAvatar from "../../components/CharacterAvatar/CharacterAvatar";
import { getJourneyNext } from "../Journey/journeyNext";
import { getGameById } from "../Games/gameCatalog";
import { usePlayerProgress } from "../../hooks/usePlayerProgress";
import { getXpProgress, getNextUnlock, getNextUnlockLabel } from "../../data/unlocks";
import { effectiveGuideLevel } from "../../utils/guideLevel";
import DeadEnd from "../../components/DeadEnd/DeadEnd";
import useCountUp from "../../hooks/useCountUp";
import "./Quiz.css";

// Shuffle an array without mutating it
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

// Same voice as Pixel and the lesson guide, so the site sounds like one guide.
function readAloud(text) {
  if (!text || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") return;
  window.speechSynthesis.cancel();
  const message = new window.SpeechSynthesisUtterance(text);
  message.rate = 0.82;
  message.pitch = 1.08;
  window.speechSynthesis.speak(message);
}

// Apply random question order + random option order to a question list
const applyShuffles = (list) =>
  shuffle(list).map((q) => ({
    ...q,
    options: Array.isArray(q.options) ? shuffle(q.options) : q.options,
  }));

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId: routeId } = useParams();
  const quizId = useMemo(() => (routeId ? String(routeId) : "1"), [routeId]);

  const { user, token, loading: authLoading } = useAuth();
  const { character } = useCharacter();
  const { xp: preQuizXp } = usePlayerProgress(token);

  // Gate: lesson N must be complete before quiz N
  const [gateBlocked, setGateBlocked] = useState(false);
  const [gateChecking, setGateChecking] = useState(true);

  const [questions, setQuestions] = useState([]);
  const rawQuestionsRef = useRef([]); // original fetch order, for re-shuffle on retry
  const [loadErr, setLoadErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Per-question state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [allAnswers, setAllAnswers] = useState({});

  // Check result from backend: { correct, correctAnswerText, explanation }
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  // Accumulated per-question results for missed-question review
  const [questionResults, setQuestionResults] = useState({});

  // Final results
  const [done, setDone] = useState(false);
  const [results, setResults] = useState(null);
  const [submitErr, setSubmitErr] = useState("");
  // Juice: the earned XP counts up on the results screen. Top-level because
  // hooks cannot live inside the `if (done)` branch that renders it.
  const shownQuizXp = useCountUp(done ? (results?.xpEarned ?? 0) : 0);

  // Journey-aware routing
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const nextRoute   = searchParams.get("next")  || null;
  const journeyNode = searchParams.get("node")  || null;
  const fromJourney = searchParams.get("from")  === "journey";

  const quizQuestionsUrl = useMemo(
    () => `${API_BASE_URL}/api/quiz/${quizId}/questions`,
    [quizId]
  );

  // ── Gate check ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) { setGateChecking(false); return; }
    const lessonNum = Number(quizId);
    if (lessonNum > 10) { setGateChecking(false); return; }
    const checkGate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/lessons/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const completed = (data.completedLessons || []).map(Number);
          if (!completed.includes(lessonNum)) setGateBlocked(true);
        }
      } catch (_) { /* fail open */ }
      finally { setGateChecking(false); }
    };
    checkGate();
  }, [quizId, user, token, authLoading]);

  // ── Fetch questions ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setLoadErr("");
      if (authLoading) return;
      if (!user) { setLoading(false); setLoadErr("Please log in to take the quiz."); return; }
      if (!token) { setLoading(false); setLoadErr("Missing token. Please logout/login again."); return; }
      try {
        const res = await axios.get(quizQuestionsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.questions || payload?.data || [];
        if (!list.length) {
          setLoadErr("No questions available for this quiz.");
          setLoading(false);
          return;
        }
        const capped = list.slice(0, 10);
        rawQuestionsRef.current = capped;
        setQuestions(applyShuffles(capped));
        setLoading(false);
      } catch (err) {
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load quiz questions.";
        setLoadErr(
          status === 401 || status === 403
            ? "Session expired. Please logout/login again."
            : msg
        );
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [quizQuestionsUrl, user, authLoading, token]);

  // ── Current question helpers ──────────────────────────────────────────────
  const q = questions[currentIdx];
  const qId = q ? (q.id ?? q.questionId ?? currentIdx) : null;
  const questionText = q
    ? q.question ?? q.text ?? q.title ?? `Question ${currentIdx + 1}`
    : "";
  const options = q ? q.options || q.choices || q.answers || [] : [];
  const total = questions.length;

  // The question and its answers, said the way a grown-up would read them out.
  const spokenQuestion = useMemo(() => {
    if (!q) return "";
    const parts = options.map((opt, oi) => {
      const label = opt?.text ?? opt?.label ?? opt ?? "";
      return `${String.fromCharCode(65 + oi)}: ${label}`;
    });
    return `${questionText}. ${parts.join(". ")}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qId, questionText]);

  // A "Big help" learner cannot yet read the question - so it is read to them,
  // every time it changes, honouring the same mute key Pixel and the lesson
  // guide use: quiet in one place is quiet everywhere.
  const guideLevel = effectiveGuideLevel(user);
  useEffect(() => {
    if (guideLevel !== "early" || !spokenQuestion) return;
    try { if (localStorage.getItem("codeit_pixel_quiet") === "1") return; } catch { return; }
    readAloud(spokenQuestion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenQuestion]);

  // ── Select answer ─────────────────────────────────────────────────────────
  const handleSelect = async (optVal) => {
    if (revealed || checking) return;
    setSelected(optVal);
    setRevealed(true);
    setAllAnswers((prev) => ({ ...prev, [String(qId)]: optVal }));

    setChecking(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/quiz/check`,
        { questionId: qId, answer: optVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = res.data; // { correct, correctAnswerText, explanation }
      setCheckResult(result);
      // Accumulate for missed-question review
      setQuestionResults((prev) => ({
        ...prev,
        [String(qId)]: {
          questionText,
          correct: result.correct,
          correctAnswerText: result.correctAnswerText,
          explanation: result.explanation || "",
          selectedAnswer: optVal,
        },
      }));
    } catch {
      setCheckResult({ correct: false, correctAnswerText: null, explanation: null });
    } finally {
      setChecking(false);
    }
  };

  // ── Next / finish ─────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      setCheckResult(null);
    } else {
      const finalAnswers = { ...allAnswers, [String(qId)]: selected };
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/quiz/submit`,
          { quizId: Number(quizId), answers: finalAnswers },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(res.data);
      } catch (err) {
        const msg = err?.response?.data?.error || err?.message || "Submit failed";
        setSubmitErr(msg);
        setResults({ correctCount: 0, totalQuestions: total, percentage: 0, xpEarned: 0 });
      }
      setDone(true);
    }
  };

  // ── Retry — re-shuffles everything ───────────────────────────────────────
  const handleRetry = () => {
    setQuestions(applyShuffles(rawQuestionsRef.current));
    setCurrentIdx(0);
    setSelected(null);
    setRevealed(false);
    setCheckResult(null);
    setAllAnswers({});
    setQuestionResults({});
    setDone(false);
    setResults(null);
    setSubmitErr("");
  };

  const correctAnswerText = checkResult?.correctAnswerText ?? null;
  const isCorrect = revealed && checkResult?.correct === true;

  const getOptClass = (optVal) => {
    if (!revealed) return "qz-opt";
    if (correctAnswerText && optVal === correctAnswerText) return "qz-opt qz-opt--correct";
    if (optVal === selected && optVal !== correctAnswerText) return "qz-opt qz-opt--wrong";
    return "qz-opt qz-opt--dim";
  };

  // ── Gate checking ─────────────────────────────────────────────────────────
  if (gateChecking) {
    return (
      <div className="qz-page">
        <div className="qz-loader">
          <div className="qz-spinner" />
          <p>Checking lesson progress…</p>
        </div>
      </div>
    );
  }

  if (gateBlocked) {
    return (
      <div className="qz-page">
        <div className="qz-error-card">
          <p>
            Complete <strong>Lesson {quizId}</strong> first to unlock Quiz {quizId}.
          </p>
          <button className="qz-btn-back" onClick={() => navigate(`/lesson/${quizId}`)}>
            Go to Lesson {quizId}
          </button>
        </div>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="qz-page">
        <div className="qz-loader">
          <div className="qz-spinner" />
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (loadErr) {
    // A quiz that can't load is a room with doors, not a bare white card —
    // the walkthrough found the old version reading as a crash to a child.
    // Sign-in problems and missing questions are different rooms; neither
    // ever shows a raw error string.
    const needsSignIn = /log ?in|token|session/i.test(loadErr);
    return needsSignIn ? (
      <DeadEnd
        title="Time to sign in again"
        line="Your sign-in fell asleep. Log back in and this quiz will be right here waiting."
        doors={[
          { label: 'Log in', to: '/login', primary: true },
          { label: 'Go home', to: '/' },
        ]}
      />
    ) : (
      <DeadEnd
        title="This quiz isn't ready yet"
        line={`Quiz ${quizId} has no questions loaded right now — that's on us, not you. The lesson covers everything the quiz would ask.`}
        doors={[
          { label: `Open Lesson ${quizId}`, to: `/lesson/${quizId}`, primary: true },
          { label: 'Make something instead', to: '/builder' },
        ]}
      />
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  if (done) {
    const correct = results?.correctCount ?? 0;
    const tot     = results?.totalQuestions ?? total;
    const xp      = results?.xpEarned ?? 0;
    const pct     = results?.percentage ?? (tot > 0 ? Math.round((correct / tot) * 100) : 0);

    const headline =
      pct === 100 ? "Perfect Score!"
      : pct >= 75 ? "Great Job!"
      : pct >= 50 ? "Nice Try!"
      : "Keep Going!";

    const encouragement =
      pct === 100 ? "You know this topic inside out. Ready for the challenge?"
      : pct >= 75 ? "Solid understanding. You are ready to move on."
      : pct >= 50 ? "Good effort. Review any missed questions below, then try again."
      : "Go back to the lesson, read the explanations below, then retry.";

    const missedEntries = Object.values(questionResults).filter((r) => !r.correct);

    // Forward CTA: puzzle if live, else journey, else dashboard
    const livePuzzle = !fromJourney ? getGameById(String(quizId)) : null;
    const puzzleIsLive = livePuzzle && !livePuzzle.comingSoon;

    return (
      <div className="qz-page">
        <div className="qz-results-card">
          {character && (
            <div className="qz-results-avatar">
              <CharacterAvatar character={character} size={80} />
            </div>
          )}
          <h1 className="qz-results-title">{headline}</h1>

          <div className="qz-score-wrap">
            <span className="qz-score-big">{correct}</span>
            <span className="qz-score-slash"> / </span>
            <span className="qz-score-total">{tot}</span>
          </div>

          <div className="qz-xp-pill">+{shownQuizXp} XP earned</div>

          {(() => {
            const newXp = (preQuizXp || 0) + (xp || 0);
            const info  = getXpProgress(newXp);
            const nu    = getNextUnlock(info.level);
            if (info.hasNext && info.pctToNext >= 70) {
              return (
                <p className="qz-level-hint qz-level-hint--urgent">
                  Only {info.xpToNext} XP to reach Level {info.level + 1}!
                </p>
              );
            }
            if (nu) {
              return (
                <p className="qz-level-hint">
                  Next reward: {getNextUnlockLabel(nu)} unlocks at Level {nu.atLevel}
                </p>
              );
            }
            return null;
          })()}

          <p className="qz-encouragement">{encouragement}</p>

          {submitErr && <p className="qz-submit-err">{submitErr}</p>}

          {/* Missed questions review */}
          {missedEntries.length > 0 && (
            <div className="qz-missed-review">
              <p className="qz-missed-label">Questions you missed</p>
              {missedEntries.map((entry, i) => (
                <div key={i} className="qz-missed-item">
                  <p className="qz-missed-question">{entry.questionText}</p>
                  <p className="qz-missed-wrong">Your answer: {entry.selectedAnswer}</p>
                  <p className="qz-missed-correct">Correct answer: {entry.correctAnswerText}</p>
                  {entry.explanation && (
                    <p className="qz-missed-explanation">{entry.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="qz-results-actions">
            {!fromJourney && (
              <button className="qz-btn-retry" onClick={handleRetry}>
                Retry
              </button>
            )}

            {fromJourney && (journeyNode || nextRoute) ? (
              <button
                className="qz-btn-forward"
                onClick={() => navigate(journeyNode ? getJourneyNext(journeyNode) : nextRoute)}
              >
                Continue
              </button>
            ) : puzzleIsLive ? (
              <button
                className="qz-btn-forward"
                onClick={() => navigate(`/journey/puzzle/${quizId}/a`)}
              >
                Go to Challenge {quizId}
              </button>
            ) : (
              <button className="qz-btn-forward" onClick={() => navigate("/MainPage")}>
                Back to your progress
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main quiz ─────────────────────────────────────────────────────────────
  return (
    <div className="qz-page">
      <div className="qz-card">
        {/* One row, not two. Back, how far through you are, and the count —
            all of which are about the quiz rather than the question. Stacked
            they pushed the question itself 156px down a phone screen; the
            "Quiz 17" label was the third thing on the page telling a child
            which quiz they had just tapped into. */}
        <div className="qz-progress-wrap" aria-label={`Quiz ${quizId}`}>
          <button className="qz-btn-back" onClick={() => navigate(-1)}>
            Back
          </button>
          <div className="qz-progress-track">
            <div
              className="qz-progress-fill"
              style={{ width: `${((currentIdx + (revealed ? 1 : 0)) / total) * 100}%` }}
            />
          </div>
          <span className="qz-progress-text">
            {currentIdx + 1} / {total}
          </span>
        </div>

        {/* Question */}
        <div className="qz-question-card">
          <span className="qz-q-badge">Q{currentIdx + 1}</span>
          <h2 className="qz-question-text">{questionText}</h2>
          <button
            type="button"
            className="qz-read-btn"
            onClick={() => readAloud(spokenQuestion)}
            aria-label="Read this question and its answers to me"
          >
            🔊 Read to me
          </button>
        </div>

        {/* Options */}
        <div className="qz-options">
          {options.map((opt, oi) => {
            const val   = opt?.value ?? opt?.text ?? opt ?? String(oi);
            const label = opt?.text  ?? opt?.label ?? opt ?? String(val);
            return (
              <button
                key={`${qId}-${oi}`}
                className={getOptClass(val)}
                onClick={() => handleSelect(val)}
                disabled={revealed || checking}
              >
                <span className="qz-opt-letter">{String.fromCharCode(65 + oi)}</span>
                <span className="qz-opt-label">{label}</span>
                {revealed && correctAnswerText && val === correctAnswerText && (
                  <span className="qz-opt-icon">✓</span>
                )}
                {revealed && val === selected && val !== correctAnswerText && (
                  <span className="qz-opt-icon">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback + Next */}
        {revealed && !checking && (
          <div className="qz-bottom">
            <div className={`qz-feedback ${isCorrect ? "qz-feedback--correct" : "qz-feedback--wrong"}`}>
              <div className="qz-feedback-main">
                <span className="qz-feedback-icon">{isCorrect ? "+" : "!"}</span>
                <span className="qz-feedback-verdict">
                  {isCorrect
                    ? "Correct!"
                    : `Not quite. The correct answer is "${correctAnswerText}".`}
                </span>
              </div>
              {checkResult?.explanation && (
                <p className="qz-feedback-explanation">{checkResult.explanation}</p>
              )}
            </div>
            <button className="qz-btn-next" onClick={handleNext}>
              {currentIdx < total - 1 ? "Next Question" : "See Results"}
            </button>
          </div>
        )}
        {checking && (
          <div className="qz-bottom">
            <div className="qz-feedback qz-feedback--checking">
              <span>Checking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
