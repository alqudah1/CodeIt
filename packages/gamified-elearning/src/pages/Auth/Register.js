import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import { journeyHeaders } from '../../utils/journey';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { resolveAuthDestination } from '../../utils/authDestination';
import './Auth.css';

// ── Sub-component: Brand mark ─────────────────────────────────────────────────
function BrandMark() {
  return (
    <div className="auth-brand">
      <BrandLogo className="auth-logo" />
    </div>
  );
}

// ── Register — multi-step child-friendly signup ───────────────────────────────
// Steps: 'choose' → 'student' | 'educator' → 'parent-optional' (student only)

export default function Register() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search || '');
  const familyEntry = searchParams.get('for') === 'family';
  const [step, setStep] = useState(familyEntry ? 'educator' : 'choose');
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const requestedPath = location.state?.from || (searchParams.get('from') === 'builder' ? '/builder' : null);
  const returnTo = typeof requestedPath === 'string' && requestedPath.startsWith('/') && !requestedPath.startsWith('//')
    ? requestedPath
    : '/';
  const queryBuilderAction = ['save', 'publish'].includes(searchParams.get('action'))
    ? searchParams.get('action')
    : null;
  const resumeBuilderAction = ['save', 'publish'].includes(location.state?.resumeBuilderAction)
    ? location.state.resumeBuilderAction
    : location.state?.resumeBuilderSave === true
      ? 'save'
      : queryBuilderAction;
  const resumePricingInterest = location.state?.resumePricingInterest === true;
  const returnState = resumeBuilderAction || resumePricingInterest
    ? {
        ...(resumeBuilderAction ? { resumeBuilderAction } : {}),
        ...(resumePricingInterest ? { resumePricingInterest: true } : {}),
      }
    : null;
  const authLinkState = { from: returnTo, ...(returnState || {}) };
  const hasBuilderDraft = returnTo === '/builder' && Boolean(resumeBuilderAction);
  const builderActionWord = resumeBuilderAction === 'publish' ? 'publish' : 'save';
  const loginPath = hasBuilderDraft
    ? `/login?from=builder&action=${resumeBuilderAction}`
    : '/login';

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
    robots:      'noindex,nofollow',
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
        { headers: { 'Content-Type': 'application/json', ...journeyHeaders() } }
      );
      login({ user: res.data.user, token: res.data.token });
      if (hasBuilderDraft) {
        navigate('/builder', { replace: true, state: returnState });
        return;
      }
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
        { headers: { 'Content-Type': 'application/json', ...journeyHeaders() } }
      );
      login({ user: res.data.user, token: res.data.token });
      navigate(resolveAuthDestination(returnTo, res.data.user?.role, { newAccount: true }), {
        replace: true,
        state: returnState,
      });
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
    navigate(resolveAuthDestination(returnTo, 'Student', { newAccount: true }), {
      replace: true,
      state: returnState,
    });
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
            <span className="auth-pill">{hasBuilderDraft ? 'Project ready' : 'Get Started'}</span>
            <h1>
              {hasBuilderDraft
                ? `${builderActionWord === 'publish' ? 'Publish' : 'Save'} your project`
                : 'How would you like to start?'}
            </h1>
            {hasBuilderDraft && (
              <p>Your work is safe in this browser. Choose the right account, and we’ll bring you straight back to finish.</p>
            )}
          </header>

          <div className="auth-path-list">
            <button className="auth-path-card auth-path-card--student" onClick={() => setStep('student')}>
              <span className="auth-path-card__title">
                {hasBuilderDraft
                  ? `${builderActionWord === 'publish' ? 'Publish' : 'Save'} with a Student account (13–18)`
                  : 'I am a Student (13–18)'}
              </span>
              <span className="auth-path-card__desc">Use a username — no student email needed</span>
            </button>

            <button className="auth-path-card auth-path-card--educator" onClick={() => setStep('educator')}>
              <span className="auth-path-card__title">
                {hasBuilderDraft ? 'Continue with a Parent or Educator' : 'I am a Parent or Educator'}
              </span>
              <span className="auth-path-card__desc">Required to manage a private profile for ages 8–12</span>
            </button>

            <button className="auth-path-card auth-path-card--guest" onClick={() => navigate('/builder')}>
              <span className="auth-path-card__title">
                {hasBuilderDraft ? 'Go back to my project' : 'Try CodeIt First'}
              </span>
              <span className="auth-path-card__desc">
                {hasBuilderDraft ? 'Keep editing without saving yet' : 'Make a project without creating an account'}
              </span>
            </button>
          </div>

          <div className="auth-educator-note">
            Ages 8–12: ask a parent or legal guardian to create a private managed profile.
          </div>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to={loginPath} state={authLinkState}>Sign in</Link>
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
            <h1>{hasBuilderDraft ? `Create an account to ${builderActionWord}` : 'Create your account'}</h1>
            <p>
              {hasBuilderDraft
                ? 'Your project will be waiting when this short setup is finished.'
                : 'Pick a username, then turn your first idea into a project.'}
            </p>
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
                <span className="auth-hint">Independent student accounts are for ages 13–18. A parent or guardian can create a private profile for ages 8–12.</span>
              )}
            </div>

            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="auth-button">
              {hasBuilderDraft
                ? `Create account and ${builderActionWord} project`
                : 'Create account and build'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to={loginPath} state={authLinkState}>Sign in</Link>
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

          <button
            type="button"
            className="auth-skip-btn"
            onClick={() => navigate(resolveAuthDestination(returnTo, 'Student', { newAccount: true }), {
              replace: true,
              state: returnState,
            })}
          >
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
            <h1>
              {hasBuilderDraft
                ? `Create an adult account to ${builderActionWord}`
                : familyEntry ? 'Create a private learner profile' : 'Create your account'}
            </h1>
            <p>
              {resumePricingInterest
                ? 'Create an adult account to finish joining the founding-family waitlist.'
                : hasBuilderDraft
                  ? 'Your project is safe. After this setup, we’ll bring you back to finish.'
                : familyEntry
                  ? 'Start with your adult account. After confirming your email, you can create a private profile for a learner ages 8–12.'
                  : 'Create an adult account for family or classroom use.'}
            </p>
          </header>

          <div className="auth-educator-note">
            After signup, confirm your adult email to create a private learner profile for ages 8–12.
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
            <button type="submit" className="auth-button">Create Parent / Educator Account</button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to={loginPath} state={authLinkState}>Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
