import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import './Auth.css';
const CodeItLogo = process.env.PUBLIC_URL + '/images/CodeItLogo.png';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState('student'); // 'student' | 'educator'
  const { login } = useAuth();
  const navigate = useNavigate();

  useSEO({
    title:       'Sign In | CodeIt',
    description: 'Sign in to your CodeIt account and continue your Python learning journey. Pick up where you left off.',
    canonical:   '/login',
  });

  const onSubmit = async (data) => {
    try {
      setError(null);
      const response = await axios.post(
        `${API_BASE_URL}/api/login`,
        { identifier: data.identifier, password: data.password },
        { headers: { 'Content-Type': 'application/json' } }
      );
      login({ user: response.data.user, token: response.data.token });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your details and try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Brand mark */}
        <div className="auth-brand">
          <img src={CodeItLogo} alt="CodeIt coding platform for kids" className="auth-brand__img" width="120" height="120" />
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
          <span className="auth-pill">Welcome back</span>
          <h1>
            {role === 'student' ? 'Sign in to your account' : 'Educator sign in'}
          </h1>
          <p>
            {role === 'student'
              ? 'Pick up where you left off and keep your streak alive.'
              : 'Access your class dashboard and track student progress.'}
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

          {error && <p className="error-message">{error}</p>}
        </form>

        {/* Guest option — students only */}
        {role === 'student' && (
          <>
            <div className="auth-divider">or</div>
            <button type="button" className="auth-guest-btn" onClick={() => navigate('/lesson/1')}>
              Try Lesson 1 First — no account needed
            </button>
          </>
        )}

        <div className="auth-footer">
          New to CodeIt?{' '}
          <Link to="/register">Create a free account</Link>
        </div>

      </div>
    </div>
  );
}
