import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import { journeyHeaders } from '../../utils/journey';

const PILOT_EMAIL_HREF = [
  'mailto:hello@codeitlearn.com',
  '?subject=CodeIt%20Founding%20Family%20pilot',
  '&body=Hi%20CodeIt%2C%0A%0AI%27m%20a%20parent%2C%20guardian%2C%20or%20educator%20interested%20in%20the%20Founding%20Family%20pilot.%0A%0AThanks!',
].join('');

export default function HomePilotSignup() {
  const { user, token } = useAuth();
  const isStudentAccount = String(user?.role || '').toLowerCase() === 'student';
  const [email, setEmail] = useState(user?.email || '');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState('');
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
          source: 'homepage',
          company,
        }),
      });
      if (!response.ok) throw new Error('waitlist request failed');

      localStorage.setItem('codeit_founding_waitlist_contacted', 'yes');
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'saved') {
    return (
      <div className="studio-pilot studio-pilot--saved" aria-live="polite">
        <strong>You’re on the Founding Family pilot list.</strong>
        <p>Nothing starts automatically. We’ll contact the adult email you submitted when a small testing group opens.</p>
        <Link to="/builder">Try a free project now <span aria-hidden="true">→</span></Link>
      </div>
    );
  }

  return (
    <form className="studio-pilot" onSubmit={submit}>
      <div className="studio-pilot__heading">
        <strong>Parent, guardian, or educator?</strong>
        <span>Join the small Founding Family pilot list. No charge and no subscription.</span>
      </div>
      <label htmlFor="homepage-pilot-email">Adult email</label>
      <div className="studio-pilot__row">
        <input
          id="homepage-pilot-email"
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
          {status === 'saving' ? 'Joining…' : 'Join the pilot list'}
        </button>
      </div>
      <label className="studio-pilot__consent">
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
      <label className="studio-pilot__trap" aria-hidden="true">
        Company
        <input
          type="text"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
      {status === 'consent-required' && <p className="studio-pilot__error" role="alert">Please confirm that you are an adult and want pilot updates.</p>}
      {status === 'parent-required' && <p className="studio-pilot__error" role="alert">Ask a parent, guardian, or educator to join using an adult account.</p>}
      {status === 'error' && (
        <p className="studio-pilot__error" role="alert">
          We could not save that just now. <a href={PILOT_EMAIL_HREF}>Email us instead.</a>
        </p>
      )}
      <small>We store the submitted email separately from product analytics. You can opt out anytime.</small>
    </form>
  );
}
