import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useSEO } from '../../hooks/useSEO';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import './Auth.css';
import COMPANY from '../../config/company';

const NOTICE_VERSION = '2026-08-04';
const CLAIM_STORAGE_KEY = 'codeit_parent_claim_token';
const REVIEW_STORAGE_KEY = 'codeit_parent_review_token';

export default function ParentReview() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClaim = searchParams.get('claim');
  const [reviewToken] = useState(() => sessionStorage.getItem(REVIEW_STORAGE_KEY));
  const [claimToken, setClaimToken] = useState(() => queryClaim || sessionStorage.getItem(CLAIM_STORAGE_KEY));
  const [parentEmail, setParentEmail] = useState('');
  const [relationship, setRelationship] = useState('parent');
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);

  useSEO({
    title: 'Parent Review | CodeIt',
    description: 'Review and manage an existing CodeIt learner account.',
    canonical: '/parent-review',
    robots: 'noindex,nofollow',
  });

  useEffect(() => {
    if (!queryClaim) return;
    sessionStorage.setItem(CLAIM_STORAGE_KEY, queryClaim);
    sessionStorage.removeItem(REVIEW_STORAGE_KEY);
    setClaimToken(queryClaim);
    if (location.search) navigate('/parent-review', { replace: true });
  }, [location.search, navigate, queryClaim]);

  useEffect(() => {
    if (!claimToken) return;
    let active = true;
    axios.post(`${API_BASE_URL}/api/family/legacy-review/preview`, { claimToken })
      .then(response => {
        if (active) setPreview(response.data);
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.error || 'This review link could not be opened.');
      });
    return () => { active = false; };
  }, [claimToken]);

  const isAdult = useMemo(
    () => Boolean(user && String(user.role || '').toLowerCase() !== 'student' && user.email),
    [user]
  );

  async function requestReview(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/family/legacy-review/request`, {
        reviewToken,
        parentEmail,
      });
      setStatus(response.data.delivery?.sent
        ? `Review sent to ${response.data.maskedParentEmail}. Ask your parent or guardian to open it.`
        : 'The review is ready, but email delivery is not configured. Please contact CodeIt support.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not send the parent review.');
    } finally {
      setBusy(false);
    }
  }

  async function approveReview(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/family/legacy-review/claim`,
        {
          claimToken,
          relationship,
          consent,
          noticeVersion: NOTICE_VERSION,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      sessionStorage.removeItem(CLAIM_STORAGE_KEY);
      sessionStorage.removeItem(REVIEW_STORAGE_KEY);
      setCompleted(true);
      setStatus(`${response.data.learnerLabel} is now connected to your private family controls.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not connect the learner account.');
    } finally {
      setBusy(false);
    }
  }

  if (completed) {
    return (
      <div className="auth-page">
        <main className="auth-card parent-review-card">
          <div className="auth-brand"><BrandLogo className="auth-logo" /></div>
          <header className="auth-header">
            <span className="auth-pill">Connected safely</span>
            <h1>The learner account is ready</h1>
            <p>{status}</p>
          </header>
          <Link className="auth-button parent-review-link" to="/profile">Open family controls</Link>
        </main>
      </div>
    );
  }

  if (claimToken) {
    return (
      <div className="auth-page">
        <main className="auth-card parent-review-card">
          <div className="auth-brand"><BrandLogo className="auth-logo" /></div>
          <header className="auth-header">
            <span className="auth-pill">For a parent or guardian</span>
            <h1>Review this learner account</h1>
            <p>
              {preview
                ? `${preview.learnerLabel} is paused until an adult reviews how CodeIt uses its information.`
                : 'We are checking this secure review link.'}
            </p>
          </header>

          {!user && (
            <section className="parent-review-panel">
              <h2>Sign in as the adult</h2>
              <p>Use the same email address that received the review link.</p>
              <div className="parent-review-actions">
                <Link className="auth-button parent-review-link" to="/login" state={{ from: '/parent-review' }}>
                  Parent sign in
                </Link>
                <Link className="auth-guest-btn parent-review-link" to="/register" state={{ from: '/parent-review' }}>
                  Create parent account
                </Link>
              </div>
            </section>
          )}

          {user && !isAdult && (
            <section className="parent-review-panel">
              <h2>An adult account is needed</h2>
              <p>You are currently signed in as a student. A parent or guardian must use their own account.</p>
              <button className="auth-button" type="button" onClick={() => { logout(); navigate('/parent-review'); }}>
                Sign out student
              </button>
            </section>
          )}

          {isAdult && preview && (
            <form className="auth-form parent-review-panel" onSubmit={approveReview}>
              <h2>Choose what happens</h2>
              <p>
                Approving connects {preview.learnerLabel} to your family controls. CodeIt will keep the
                learner's username, birthday, password hash, learning progress, and private projects to
                provide the learning service. Public publishing stays disabled.
              </p>
              <div className="auth-field">
                <label className="auth-label" htmlFor="relationship">Your relationship</label>
                <select
                  id="relationship"
                  className="auth-input"
                  value={relationship}
                  onChange={event => setRelationship(event.target.value)}
                >
                  <option value="parent">Parent</option>
                  <option value="guardian">Legal guardian</option>
                </select>
              </div>
              <label className="parent-review-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={event => setConsent(event.target.checked)}
                />
                <span>
                  I am this learner's parent or legal guardian. I reviewed the{' '}
                  <Link to="/privacy" target="_blank">family privacy notice</Link> and consent to this
                  private managed account.
                </span>
              </label>
              <button className="auth-button" type="submit" disabled={!consent || busy}>
                {busy ? 'Connecting…' : 'Approve private learner account'}
              </button>
              <p className="parent-review-small">
                To decline and request deletion instead, email{' '}
                <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>.
              </p>
            </form>
          )}

          {status && <p className="auth-success" role="status">{status}</p>}
          {error && <p className="error-message" role="alert">{error}</p>}
          {status && <Link className="auth-guest-btn parent-review-link" to="/profile">Open family controls</Link>}
        </main>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <main className="auth-card parent-review-card">
        <div className="auth-brand"><BrandLogo className="auth-logo" /></div>
        <header className="auth-header">
          <span className="auth-pill">Keep your work safe</span>
          <h1>Ask a parent to review your account</h1>
          <p>Your projects and progress are saved. CodeIt has paused this account until a parent or guardian reviews it.</p>
        </header>

        {reviewToken ? (
          <form className="auth-form parent-review-panel" onSubmit={requestReview}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="parentEmail">Parent or guardian email</label>
              <input
                id="parentEmail"
                className="auth-input"
                type="email"
                autoComplete="email"
                value={parentEmail}
                onChange={event => setParentEmail(event.target.value)}
                placeholder="parent@example.com"
                required
              />
            </div>
            <button className="auth-button" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send parent review'}
            </button>
          </form>
        ) : (
          <section className="parent-review-panel">
            <p>Sign in to the learner account again to start a secure parent review.</p>
            <Link className="auth-button parent-review-link" to="/login">Return to sign in</Link>
          </section>
        )}

        {status && <p className="auth-success" role="status">{status}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <p className="parent-review-small">
          Need help? Email <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>.
        </p>
      </main>
    </div>
  );
}
