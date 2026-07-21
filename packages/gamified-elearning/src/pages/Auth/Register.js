import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import './Auth.css';

// ── Sub-component: Brand mark ─────────────────────────────────────────────────
function BrandMark() {
  return (
    <div className="auth-brand">
      <img src="/brand/CodeItRG.svg" alt="CodeIt" className="auth-logo" />
    </div>
  );
}

// ── Register — multi-step child-friendly signup ───────────────────────────────
// Steps: 'choose' → 'student' | 'educator' → 'parent-optional' (student only)

export default function Register() {
  const [step, setStep] = useState('choose');
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = location.state?.from;
  const returnTo = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
    ? requestedPath
    : '/';
  const resumeBuilderSave = location.state?.resumeBuilderSave === true;
  const returnState = resumeBuilderSave ? { resumeBuilderSave: true } : null;

  // Separate form instances per path to avoid field-name collisions
  const {
    register: regS,
    handleSubmit: submitS,
    formState: { errors: errS },
    reset: resetS,
    setError: setFieldError,
  } = useForm();

  const {
    register: regE,
    handleSubmit: submitE,
    formState: { errors: errE },
    reset: resetE,
  } = useForm();

  const {
    register: regP,
    handleSubmit: submitP,
    formState: { errors: errP },
  } = useForm();

  useSEO({
    title:       'Create Free Account | CodeIt',
    description: 'Join CodeIt for free and start learning Python with interactive lessons, quizzes, coding games, and creative projects.',
    canonical:   '/register',
  });

  function goBack() {
    setError(null);
    resetS();
    resetE();
    setShowPw(false);
    setStep('choose');
  }

  // ── Student submit ──────────────────────────────────────────────────────────
  const onStudentSubmit = async (data) => {
    try {
      setError(null);
      const res = await axios.post(
        `${API_BASE_URL}/api/signup`,
        { accountType: 'student', username: data.username.trim(), password: data.password, dob: data.dob },
        { headers: { 'Content-Type': 'application/json' } }
      );
      login({ user: res.data.user, token: res.data.token });
      setPendingToken(res.data.token);
      setStep('parent-optional');
    } catch (err) {
      const body = err?.response?.data;
      // If backend returned a field-specific error, surface it inline
      if (body?.field && body?.error) {
        setFieldError(body.field, { type: 'server', message: body.error });
      } else {
        setError(body?.error || 'Registration failed. Please try again.');
      }
    }
  };

  // ── Educator submit ─────────────────────────────────────────────────────────
  const onEducatorSubmit = async (data) => {
    try {
      setError(null);
      const res = await axios.post(
        `${API_BASE_URL}/api/signup`,
        { accountType: 'educator', name: data.name.trim(), email: data.email.trim(), password: data.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      login({ user: res.data.user, token: res.data.token });
      navigate(returnTo, { replace: true, state: returnState });
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  // ── Parent email submit (optional recovery step) ────────────────────────────
  const onParentEmailSubmit = async (data) => {
    if (data.parent_email && pendingToken) {
      try {
        await axios.post(
          `${API_BASE_URL}/api/add-parent-email`,
          { parent_email: data.parent_email },
          { headers: { Authorization: `Bearer ${pendingToken}` } }
        );
      } catch {
        // Non-fatal — proceed anyway
      }
    }
    navigate(returnTo, { replace: true, state: returnState });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Step: choose path
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'choose') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <BrandMark />
          <header className="auth-header">
            <span className="auth-pill">Get Started</span>
            <h1>How would you like to start?</h1>
          </header>

          <div className="auth-path-list">
            <button className="auth-path-card auth-path-card--student" onClick={() => setStep('student')}>
              <span className="auth-path-card__title">I am a Student (13–18)</span>
              <span className="auth-path-card__desc">Sign up with a username — no email needed</span>
            </button>

            <button className="auth-path-card auth-path-card--educator" onClick={() => setStep('educator')}>
              <span className="auth-path-card__title">I am a Parent or Educator</span>
              <span className="auth-path-card__desc">Create an account with email for class management</span>
            </button>

            <button className="auth-path-card auth-path-card--guest" onClick={() => navigate('/builder')}>
              <span className="auth-path-card__title">Try CodeIt First</span>
              <span className="auth-path-card__desc">Make a project without creating an account</span>
            </button>
          </div>

          <div className="auth-educator-note">
            Under 13? Ask a parent or guardian to manage your access, or try CodeIt first without an account.
          </div>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" state={{ from: returnTo, resumeBuilderSave }}>Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step: student signup
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'student') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <BrandMark />
          <button type="button" className="auth-back" onClick={goBack}>Back</button>

          <header className="auth-header">
            <span className="auth-pill">Student</span>
            <h1>Create your account</h1>
            <p>Pick a username and start your coding journey.</p>
          </header>

          <form className="auth-form" onSubmit={submitS(onStudentSubmit)}>
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input
                className="auth-input"
                {...regS('username', {
                  required: 'Username is required',
                  pattern: {
                    value: /^[a-zA-Z0-9_]{3,20}$/,
                    message: '3-20 characters — letters, numbers, and underscores only',
                  },
                })}
                placeholder="e.g. coder_alex42"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {errS.username
                ? <span className="error">{errS.username.message}</span>
                : <span className="auth-hint">Letters, numbers, and underscores. No spaces.</span>
              }
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="auth-input auth-input--has-toggle"
                  {...regS('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' },
                  })}
                  placeholder="Choose a password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {errS.password && <span className="error">{errS.password.message}</span>}
            </div>

            <div className="auth-field">
              <label className="auth-label">Birthday</label>
              <input
                type="date"
                className="auth-input"
                {...regS('dob', {
                  required: 'Birthday is required',
                  validate: {
                    notFuture: (v) =>
                      new Date(v) <= new Date() || 'Birthday cannot be in the future',
                    ageRange: (v) => {
                      const age = Math.floor(
                        (new Date() - new Date(v)) / (365.25 * 24 * 60 * 60 * 1000)
                      );
                      return (age >= 13 && age <= 18) || 'Student accounts are for ages 13–18. Younger learners need parent-managed access.';
                    },
                  },
                })}
              />
              {errS.dob && <span className="error">{errS.dob.message}</span>}
              {!errS.dob && (
                <span className="auth-hint">Student accounts are for ages 13–18. We do not create under-13 accounts without a parent-managed consent flow.</span>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="auth-button">Create Account and Play</button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login" state={{ from: returnTo, resumeBuilderSave }}>Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step: optional parent email (shown after successful student signup)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'parent-optional') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <BrandMark />
          <header className="auth-header">
            <span className="auth-pill">Account created</span>
            <h1>Add a parent or guardian email?</h1>
            <p>
              If you ever forget your password, a parent can help you get back in.
              You can skip this now and add it later from your account settings.
            </p>
          </header>

          <form className="auth-form" onSubmit={submitP(onParentEmailSubmit)}>
            <div className="auth-field">
              <label className="auth-label">Parent or guardian email (optional)</label>
              <input
                type="email"
                className="auth-input"
                {...regP('parent_email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
                placeholder="parent@example.com"
              />
              {errP.parent_email && <span className="error">{errP.parent_email.message}</span>}
            </div>

            <button type="submit" className="auth-button">Save and Start Learning</button>
          </form>

          <button type="button" className="auth-skip-btn" onClick={() => navigate(returnTo, { replace: true, state: returnState })}>
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Step: educator / parent signup
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'educator') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <BrandMark />
          <button type="button" className="auth-back" onClick={goBack}>Back</button>

          <header className="auth-header">
            <span className="auth-pill">Parent / Educator</span>
            <h1>Create your account</h1>
            <p>Set up your account to manage classes and track student progress.</p>
          </header>

          <div className="auth-educator-note">
            Class dashboards and student tracking are coming soon. Your account will be ready when they launch.
          </div>

          <form className="auth-form" onSubmit={submitE(onEducatorSubmit)}>
            <div className="auth-field">
              <label className="auth-label">Full name</label>
              <input
                className="auth-input"
                {...regE('name', { required: 'Name is required' })}
                placeholder="Your full name"
              />
              {errE.name && <span className="error">{errE.name.message}</span>}
            </div>

            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="auth-input"
                {...regE('email', { required: 'Email is required' })}
                placeholder="you@example.com"
              />
              {errE.email && <span className="error">{errE.email.message}</span>}
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="auth-input auth-input--has-toggle"
                  {...regE('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                  })}
                  placeholder="Choose a password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
              {errE.password && <span className="error">{errE.password.message}</span>}
            </div>

            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="auth-button">Create Educator Account</button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login" state={{ from: returnTo, resumeBuilderSave }}>Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
