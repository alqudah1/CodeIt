import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { resolveAuthDestination } from '../../utils/authDestination';
import './Auth.css';

export default function Login() {
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { identifier: location.state?.managedUsername || '' },
  });
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState('student'); // 'student' | 'educator'
  const { login } = useAuth();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search || '');
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
  const passwordWasReset = location.state?.passwordReset === true;
  const hasBuilderDraft = returnTo === '/builder' && Boolean(resumeBuilderAction);
  const builderActionWord = resumeBuilderAction === 'publish' ? 'publish' : 'save';
  const registerPath = hasBuilderDraft
    ? `/register?from=builder&action=${resumeBuilderAction}`
    : '/register';

  useSEO({
    canonical:   '/login',
    robots:      'noindex,nofollow',
  });

  const onSubmit = async (data) => {
    try {
      setError(null);
      const response = await axios.post(
        `${API_BASE_URL}/api/login`,
        { identifier: data.identifier, password: data.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.requiresParentReview && response.data.reviewToken) {
        sessionStorage.setItem('codeit_parent_review_token', response.data.reviewToken);
        navigate('/parent-review', { replace: true });
        return;
      }
      login({ user: response.data.user, token: response.data.token });
      navigate(resolveAuthDestination(returnTo, response.data.user?.role), {
        replace: true,
        state: returnState,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your details and try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand mark */}
        <div className="auth-brand">
          <BrandLogo className="auth-logo" />
        </div>

        {/* Role switcher */}
        <div className="auth-role-switcher" role="group" aria-label="Choose your role">
          <button
            type="button"
            className={`auth-role-btn${role === 'student' ? ' auth-role-btn--active' : ''}`}
            onClick={() => setRole('student')}
          >
            Student
          </button>
          <button
            type="button"
            className={`auth-role-btn${role === 'educator' ? ' auth-role-btn--active' : ''}`}
            onClick={() => setRole('educator')}
          >
            Parent / Educator
          </button>
        </div>

        {/* Header */}
        <header className="auth-header">
          <span className="auth-pill">{hasBuilderDraft ? 'Project waiting' : 'Welcome back'}</span>
          <h1>
            {hasBuilderDraft
              ? `Sign in to ${builderActionWord} your project`
              : role === 'student' ? 'Sign in to your account' : 'Parent / Educator sign in'}
          </h1>
          <p>
            {hasBuilderDraft
              ? 'Your work is safe in this browser. Sign in and we’ll bring you straight back.'
              : role === 'student'
              ? 'Pick up where you left off and keep your streak alive.'
              : 'Access your account, projects, and available learning tools.'}
          </p>
        </header>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>

          {/* Username (student) or Email (educator) */}
          <div className="auth-field">
            <label htmlFor="identifier" className="auth-label">
              {role === 'student' ? 'Username' : 'Email'}
            </label>
            <input
              id="identifier"
              type={role === 'student' ? 'text' : 'email'}
              {...register('identifier', {
                required: role === 'student' ? 'Username is required' : 'Email is required',
              })}
              className="auth-input"
              placeholder={role === 'student' ? 'Your username' : 'you@example.com'}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {errors.identifier && <span className="error">{errors.identifier.message}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                {...register('password', { required: 'Password is required' })}
                className="auth-input auth-input--has-toggle"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>

          <button type="submit" className="auth-button">Sign In</button>

          {passwordWasReset && <p className="auth-success" role="status">Password updated. Sign in with your new password.</p>}
          {error && <p className="error-message">{error}</p>}
        </form>

        <div className="auth-recovery">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>

        {/* Guest option. Students only */}
        {role === 'student' && (
          <>
            <div className="auth-divider">or</div>
            <button type="button" className="auth-guest-btn" onClick={() => navigate('/builder')}>
              {hasBuilderDraft ? 'Go back to my project' : 'Try the project builder. No account needed'}
            </button>
          </>
        )}

        <div className="auth-footer">
          New to CodeIt?{' '}
          <Link to={registerPath} state={authLinkState}>
            {hasBuilderDraft ? `Create an account and ${builderActionWord}` : 'Create a free account'}
          </Link>
        </div>

      </div>
    </div>
  );
}
