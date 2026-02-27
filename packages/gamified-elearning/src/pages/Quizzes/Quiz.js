import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import "./Quiz.css";

export default function Quiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizId: routeId } = useParams(); // route: /quiz/:quizId
  const quizId = useMemo(() => (routeId ? String(routeId) : "1"), [routeId]);

  const { user, loading: authLoading } = useAuth();
  const token = useMemo(() => localStorage.getItem("token"), []);

  // Quiz gating: only block when navigated from a lesson page
  const fromLesson = location.state?.source === 'lesson';
  const sourceLessonId = location.state?.lessonId ? Number(location.state.lessonId) : null;
  const [gateBlocked, setGateBlocked] = useState(false);
  const [gateChecking, setGateChecking] = useState(fromLesson);

  const [questions, setQuestions] = useState([]);
  const [loadErr, setLoadErr] = useState("");
  const [loading, setLoading] = useState(true);

  // one-at-a-time state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState(null);   // option value the user picked
  const [revealed, setRevealed] = useState(false);  // true after picking
  const [allAnswers, setAllAnswers] = useState({}); // { [qId]: value }

  // per-question check result from backend { correct, correctAnswerText }
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);

  // results
  const [done, setDone] = useState(false);
  const [results, setResults] = useState(null);
  const [submitErr, setSubmitErr] = useState("");

  const quizQuestionsUrl = useMemo(
    () => `${API_BASE_URL}/api/quiz/${quizId}/questions`,
    [quizId]
  );

  // Lesson gating check — only runs when arriving from a lesson flow
  useEffect(() => {
    if (!fromLesson || !sourceLessonId) {
      setGateChecking(false);
      return;
    }
    if (authLoading) return;
    if (!user || !token) {
      setGateChecking(false);
      return;
    }
    const checkGate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/lessons/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const completed = (data.completedLessons || []).map(Number);
          if (!completed.includes(sourceLessonId)) {
            setGateBlocked(true);
          }
        }
      } catch (_) {
        // If gate check fails, don't block the user
      } finally {
        setGateChecking(false);
      }
    };
    checkGate();
  }, [fromLesson, sourceLessonId, user, token, authLoading]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setLoadErr("");
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        setLoadErr("Please log in to take the quiz.");
        return;
      }
      if (!token) {
        setLoading(false);
        setLoadErr("Missing token. Please logout/login again.");
        return;
      }
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
        setQuestions(list.slice(0, 10)); // enforce max 10
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

  // current question helpers
  const q = questions[currentIdx];
  const qId = q ? (q.id ?? q.questionId ?? currentIdx) : null;
  const questionText = q
    ? q.question ?? q.text ?? q.title ?? `Question ${currentIdx + 1}`
    : "";
  const options = q ? q.options || q.choices || q.answers || [] : [];
  const total = questions.length;

  const handleSelect = async (optVal) => {
    if (revealed || checking) return;
    setSelected(optVal);
    setRevealed(true);
    setAllAnswers((prev) => ({ ...prev, [String(qId)]: optVal }));

    // Ask backend if the answer is correct (no correct answer pre-loaded)
    setChecking(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/quiz/check`,
        { questionId: qId, answer: optVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCheckResult(res.data); // { correct, correctAnswerText }
    } catch {
      // If check fails, show no highlighting but still allow progress
      setCheckResult({ correct: false, correctAnswerText: null });
    } finally {
      setChecking(false);
    }
  };

  const handleNext = async () => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
      setRevealed(false);
      setCheckResult(null);
    } else {
      // last question — submit all answers to backend for final score
      const finalAnswers = { ...allAnswers, [String(qId)]: selected };
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/quiz/submit`,
          { quizId: Number(quizId), answers: finalAnswers },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(res.data);
      } catch (err) {
        const msg =
          err?.response?.data?.error || err?.message || "Submit failed";
        setSubmitErr(msg);
        setResults({ correctCount: 0, totalQuestions: total, percentage: 0, xpEarned: 0 });
      }
      setDone(true);
    }
  };

  const correctAnswerText = checkResult?.correctAnswerText ?? null;

  const getOptClass = (optVal) => {
    if (!revealed) return "qz-opt";
    if (correctAnswerText && optVal === correctAnswerText) return "qz-opt qz-opt--correct";
    if (optVal === selected && optVal !== correctAnswerText) return "qz-opt qz-opt--wrong";
    return "qz-opt qz-opt--dim";
  };

  const isCorrect = revealed && checkResult?.correct === true;

  const handleRetry = () => {
    // Reset all quiz state to start fresh
    setCurrentIdx(0);
    setSelected(null);
    setRevealed(false);
    setCheckResult(null);
    setAllAnswers({});
    setDone(false);
    setResults(null);
    setSubmitErr("");
  };

  // ── gate checking (lesson flow only) ──
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

  // ── gate blocked ──
  if (gateBlocked) {
    return (
      <div className="qz-page">
        <div className="qz-error-card">
          <span className="qz-error-icon">🔒</span>
          <p>
            Complete <strong>Lesson {sourceLessonId}</strong> first to unlock this quiz!
          </p>
          <button
            className="qz-btn-back"
            onClick={() => navigate(`/lesson/${sourceLessonId}`)}
          >
            ← Back to Lesson {sourceLessonId}
          </button>
        </div>
      </div>
    );
  }

  // ── loading ──
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

  // ── error ──
  if (loadErr) {
    return (
      <div className="qz-page">
        <div className="qz-error-card">
          <span className="qz-error-icon">😕</span>
          <p>{loadErr}</p>
          <button className="qz-btn-back" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── results screen ──
  if (done) {
    const correct = results?.correctCount ?? 0;
    const tot = results?.totalQuestions ?? total;
    const xp = results?.xpEarned ?? 0;
    const pct = results?.percentage ?? (tot > 0 ? Math.round((correct / tot) * 100) : 0);
    return (
      <div className="qz-page">
        <div className="qz-results-card">
          <div className="qz-results-trophy">
            {pct === 100 ? "🏆" : pct >= 60 ? "⭐" : "💪"}
          </div>
          <h1 className="qz-results-title">
            {pct === 100
              ? "Perfect Score!"
              : pct >= 60
              ? "Great Job!"
              : "Keep Trying!"}
          </h1>
          <div className="qz-score-wrap">
            <span className="qz-score-big">{correct}</span>
            <span className="qz-score-slash"> / </span>
            <span className="qz-score-total">{tot}</span>
          </div>
          <div className="qz-xp-pill">+{xp} XP earned! 🎉</div>
          {submitErr && <p className="qz-submit-err">{submitErr}</p>}
          <div className="qz-results-actions">
            <button className="qz-btn-retry" onClick={handleRetry}>
              🔄 Retry
            </button>
            <button className="qz-btn-home" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── main quiz ──
  return (
    <div className="qz-page">
      <div className="qz-card">
        {/* header */}
        <div className="qz-header">
          <button className="qz-btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span className="qz-quiz-label">Quiz {quizId}</span>
        </div>

        {/* progress bar */}
        <div className="qz-progress-wrap">
          <div className="qz-progress-track">
            <div
              className="qz-progress-fill"
              style={{
                width: `${((currentIdx + (revealed ? 1 : 0)) / total) * 100}%`,
              }}
            />
          </div>
          <span className="qz-progress-text">
            {currentIdx + 1} / {total}
          </span>
        </div>

        {/* question */}
        <div className="qz-question-card">
          <span className="qz-q-badge">Q{currentIdx + 1}</span>
          <h2 className="qz-question-text">{questionText}</h2>
        </div>

        {/* options */}
        <div className="qz-options">
          {options.map((opt, oi) => {
            const val = opt?.value ?? opt?.text ?? opt ?? String(oi);
            const label = opt?.text ?? opt?.label ?? opt ?? String(val);
            return (
              <button
                key={`${qId}-${oi}`}
                className={getOptClass(val)}
                onClick={() => handleSelect(val)}
                disabled={revealed || checking}
              >
                <span className="qz-opt-letter">
                  {String.fromCharCode(65 + oi)}
                </span>
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

        {/* feedback + next button */}
        {revealed && !checking && (
          <div className="qz-bottom">
            <div
              className={`qz-feedback ${
                isCorrect ? "qz-feedback--correct" : "qz-feedback--wrong"
              }`}
            >
              <span className="qz-feedback-icon">
                {isCorrect ? "🎉" : "💡"}
              </span>
              <span>
                {isCorrect
                  ? "Correct! Great job!"
                  : "Not quite — the correct answer is highlighted in green."}
              </span>
            </div>
            <button className="qz-btn-next" onClick={handleNext}>
              {currentIdx < total - 1 ? "Next Question →" : "Finish Quiz 🎉"}
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
