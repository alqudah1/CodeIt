import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import { journeyHeaders } from '../../utils/journey';
import './HomePilotSignup.css';
import COMPANY from '../../config/company';

const PILOT_EMAIL_HREF = [
  `mailto:${COMPANY.contactEmail}`,
  '?subject=CodeIt%20Founding%20Family%20pilot',
  '&body=Hi%20CodeIt%2C%0A%0AI%27m%20a%20parent%2C%20guardian%2C%20or%20educator%20interested%20in%20the%20Founding%20Family%20pilot.%0A%0AThanks!',
].join('');

export default function HomePilotSignup({ source = 'homepage', showHeading = true }) {
  const { user, token } = useAuth();
  const normalizedSource = source === 'parents-guide' ? 'parents-guide' : 'homepage';
  const emailId = normalizedSource === 'parents-guide' ? 'parents-guide-pilot-email' : 'homepage-pilot-email';
  const isStudentAccount = String(user?.role || '').toLowerCase() === 'student';
  const [email, setEmail] = useState(user?.email || '');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [status, setStatus] = useState(() => (
    localStorage.getItem('codeit_founding_waitlist_contacted') === 'yes' ? 'saved' : 'idle'
  ));

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [email, user?.email]);

  const submit = async (event) => {
    event.preventDefault();
    if (status === 'saving' || status === 'saved') return;
    if (isStudentAccount) {
      setStatus('parent-required');
      return;
    }
    if (!consent) {
      setStatus('consent-required');
      return;
    }

    setStatus('saving');
    try {
      const response = await fetch(ENDPOINTS.foundingWaitlist.join, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...journeyHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: email.trim(),
          consent: true,
          source: normalizedSource,
          company,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('waitlist request failed');

      localStorage.setItem('codeit_founding_waitlist_contacted', 'yes');
      setConfirmationSent(result.confirmationSent === true);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'saved') {
    return (
      <div className="founding-signup founding-signup--saved" aria-live="polite">
        <strong>Your Founding Family pilot request is saved.</strong>
        <p>{confirmationSent
          ? 'Check your inbox for immediate family setup steps. Nothing paid starts automatically.'
          : 'Nothing paid starts automatically. We’ll contact the adult email you submitted about the pilot.'}</p>
        <Link to="/register?for=family">Create a family account <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  return (
    <form className="founding-signup" onSubmit={submit}>
      {showHeading && (
        <div className="founding-signup__heading">
          <strong>Parent, guardian, or educator?</strong>
          <span>Request a free family pilot spot and receive immediate setup steps. No card or subscription.</span>
        </div>
      )}
      <label htmlFor={emailId}>Adult email</label>
      <div className="founding-signup__row">
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setStatus('idle');
          }}
          placeholder="parent@example.com"
          required
          disabled={status === 'saving'}
        />
        <button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : 'Request pilot spot'}
        </button>
      </div>
      <label className="founding-signup__consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            setStatus('idle');
          }}
          disabled={status === 'saving'}
        />
        <span>I am an adult and agree to receive updates only about this CodeIt pilot.</span>
      </label>
      <label className="founding-signup__trap" aria-hidden="true">
        Company
        <input
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
      {status === 'consent-required' && <p className="founding-signup__error" role="alert">Please confirm that you are an adult and want pilot updates.</p>}
      {status === 'parent-required' && <p className="founding-signup__error" role="alert">Ask a parent, guardian, or educator to join using an adult account.</p>}
      {status === 'error' && (
        <p className="founding-signup__error" role="alert">
          We could not save that just now. <a href={PILOT_EMAIL_HREF}>Email us instead.</a>
        </p>
      )}
      <small>We store the submitted email separately from product analytics. You can opt out anytime.</small>
    </form>
  );
}
