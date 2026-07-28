import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useSEO({
    title: 'Reset Password | CodeIt',
    description: 'Request a secure link to reset your CodeIt password.',
    canonical: '/forgot-password',
    robots: 'noindex,nofollow',
  });

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    setMessage('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/forgot-password`, { email });
      setMessage(response.data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not send the reset email. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand"><BrandLogo className="auth-logo" /></div>
        <header className="auth-header">
          <span className="auth-pill">Account recovery</span>
          <h1>Reset your password</h1>
          <p>Enter the email used for your CodeIt account. We’ll send a secure link that works once.</p>
        </header>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="reset-email" className="auth-label">Email</label>
            <input
              id="reset-email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <button className="auth-button" type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send reset link'}
          </button>
          {message && <p className="auth-success" role="status">{message}</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
        </form>
        <div className="auth-footer"><Link to="/login">Back to sign in</Link></div>
      </div>
    </div>
  );
}
