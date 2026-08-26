import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const token = searchParams.get('token') || '';

  useSEO({
    canonical: '/reset-password',
    robots: 'noindex,nofollow',
  });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 10) {
      setError('Use at least 10 characters.');
      return;
    }
    if (password !== confirmation) {
      setError('The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/api/reset-password`, { token, password });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not update your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><BrandLogo className="auth-logo" /></div>
        <header className="auth-header">
          <span className="auth-pill">Secure reset</span>
          <h1>Choose a new password</h1>
          <p>Use at least 10 characters. This reset link can only be used once.</p>
        </header>
        {token ? (
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-field">
              <label htmlFor="new-password" className="auth-label">New password</label>
              <input
                id="new-password"
                type="password"
                className="auth-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength="10"
                maxLength="128"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="confirm-password" className="auth-label">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                className="auth-input"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="new-password"
                minLength="10"
                maxLength="128"
                required
              />
            </div>
            <button className="auth-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save new password'}
            </button>
            {error && <p className="error-message" role="alert">{error}</p>}
          </form>
        ) : (
          <p className="error-message" role="alert">This reset link is missing its secure token.</p>
        )}
        <div className="auth-footer"><Link to="/forgot-password">Request another link</Link></div>
      </div>
    </div>
  );
}
