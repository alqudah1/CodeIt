import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import { trackEvent } from '../../utils/trackEvent';
import { REFUND_WINDOW_DAYS } from '../../config/pricing';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import { journeyHeaders } from '../../utils/journey';
import {
  DEFAULT_BILLING_STATE,
  fetchBillingStatus,
  fetchPublicPlan,
  isPlusMember,
  openBillingPortal,
  startCheckout,
} from '../../utils/billing';
import './Pricing.css';

const FREE_FEATURES = [
  'Beginner Python lessons and coding games',
  'The browser-based Python playground',
  'Build, edit, save, and publish projects',
  'Explore projects made by other learners',
];

const FOUNDING_FEATURES = [
  'Everything in the free plan',
  '20 assisted project builds each month',
  'Two learner profiles with a parent view',
  'A simple monthly progress summary',
  'Guided setup and a direct feedback channel',
];

const PLUS_FEATURES = [
  'Unlimited AI project builds and edits',
  'Publish projects to a public CodeIt link',
  'See how many people played what your child made',
  'Up to four learner profiles with a parent view',
  'Everything in the free plan stays free',
];

const PILOT_EMAIL_HREF = [
  'mailto:hello@codeitlearn.com',
  '?subject=CodeIt%20Founding%20Family%20pilot',
  '&body=Hi%20CodeIt%2C%0A%0AI%27m%20interested%20in%20the%20Founding%20Family%20pilot.%0A%0AMy%20learner%27s%20age%20range%3A%0AWhat%20we%27d%20like%20to%20build%3A%0A%0AThanks!',
].join('');

const FAQ = [
  ['Can we use CodeIt for free?', 'Yes. The lessons, playground, coding games, and core project tools will keep a useful free option.'],
  ['Is the family pilot free?', 'Yes. Requesting a pilot spot and using the current pilot are free. No card, trial, or subscription starts automatically.'],
  ['What happens after I request a spot?', 'We email immediate setup steps so you can try the current family experience. We may also invite a small number of families to share feedback before billing opens.'],
  ['Why is the paid plan not unlimited?', 'Project generation has a real usage cost. A clear monthly allowance keeps the plan predictable for families and sustainable for CodeIt.'],
  ['Who is the family plan for?', 'Parents or guardians who want more project creation, a view of learning progress, and room for two young learners.'],
];

export default function Pricing() {
  const { user, token } = useAuth();
  const isStudentAccount = String(user?.role || '').toLowerCase() === 'student';
  const [interestStatus, setInterestStatus] = useState(() => (
    localStorage.getItem('codeit_founding_waitlist_contacted') === 'yes' ? 'saved' : 'idle'
  ));
  const [leadEmail, setLeadEmail] = useState(user?.email || '');
  const [adultConsent, setAdultConsent] = useState(false);
  const [waitlistReady, setWaitlistReady] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [billing, setBilling] = useState(DEFAULT_BILLING_STATE);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState('');

  useSEO({
    title: 'CodeIt Pricing: Free Coding & Family Pilot',
    description: 'Start coding for free, then request a free CodeIt family pilot spot with guided setup, parent progress, and two learner profiles.',
    canonical: '/pricing',
  });

  useEffect(() => {
    let cancelled = false;

    // Signed out, there is no account to ask about — but whether subscriptions
    // are open is public, and hiding it meant a parent comparing CodeIt on
    // their phone saw no paid plan at all. Ask the public endpoint instead of
    // giving up and rendering the free plan alone.
    if (!token) {
      fetchPublicPlan()
        .then((plan) => { if (!cancelled) setBilling({ ...DEFAULT_BILLING_STATE, billingEnabled: plan.billingEnabled }); })
        .catch(() => { if (!cancelled) setBilling(DEFAULT_BILLING_STATE); });
      return () => { cancelled = true; };
    }

    fetchBillingStatus(token)
      .then((state) => { if (!cancelled) setBilling(state); })
      // Pricing must still render if billing is unreachable — the free plan is
      // the honest fallback.
      .catch(() => { if (!cancelled) setBilling(DEFAULT_BILLING_STATE); });
    return () => { cancelled = true; };
  }, [token]);

  async function handleBillingAction(action, eventName) {
    setBillingBusy(true);
    setBillingError('');
    try {
      void trackEvent(eventName, null, token);
      await action(token);
    } catch (error) {
      setBillingError(error.message || 'Something went wrong. Please try again.');
      setBillingBusy(false);
    }
  }

  useEffect(() => {
    const key = 'codeit_pricing_viewed';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'yes');
    void trackEvent('pricing_view');
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(ENDPOINTS.foundingWaitlist.status)
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (!cancelled && result?.ready === true) setWaitlistReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user?.email && !leadEmail) setLeadEmail(user.email);
  }, [leadEmail, user?.email]);

  const registerInterest = async (event) => {
    event.preventDefault();
    if (interestStatus === 'saving' || interestStatus === 'saved') return;
    if (isStudentAccount) {
      setInterestStatus('parent-required');
      return;
    }
    if (!adultConsent) {
      setInterestStatus('consent-required');
      return;
    }

    setInterestStatus('saving');
    try {
      const response = await fetch(ENDPOINTS.foundingWaitlist.join, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...journeyHeaders(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: leadEmail.trim(),
          consent: true,
          source: 'pricing',
          company: '',
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('waitlist request failed');

      localStorage.setItem('codeit_founding_waitlist_contacted', 'yes');
      setConfirmationSent(result.confirmationSent === true);
      setInterestStatus('saved');
    } catch {
      setInterestStatus('error');
    }
  };

  return (
    <div className="pricing-page">
      <Header />
      <main>
        <section className="pricing-hero" aria-labelledby="pricing-title">
          <p className="pricing-kicker">Simple, honest pricing</p>
          <h1 id="pricing-title">Start free. Join the family pilot when you want more support.</h1>
          <p>Try CodeIt today, then request a free family pilot spot for guided setup, learner profiles, and parent progress.</p>
          <a
            className="pricing-hero__pilot-link"
            href="#family-pilot"
            onClick={() => void trackEvent('parent_cta_click', 'join-pilot')}
          >
            Request a free family pilot spot <span aria-hidden="true">↓</span>
          </a>
          <p className="pricing-hero__pilot-note">About 30 seconds · immediate setup email · no credit card</p>
          <div className="pricing-status">
            <span aria-hidden="true" />
            {billing.billingEnabled
              ? 'The pilot is free — no card needed to request a spot'
              : 'No payment is being collected today'}
          </div>
        </section>

        <section className="pricing-plans" aria-label="CodeIt plan comparison">
          <article className="pricing-card">
            <p className="pricing-card__eyebrow">For every beginner</p>
            <h2>Free</h2>
            <div className="pricing-price"><strong>$0</strong><span>to start</span></div>
            <p className="pricing-card__summary">Learn the basics and make a real first project without a credit card.</p>
            <ul>{FREE_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <Link className="pricing-button pricing-button--quiet" to="/builder">Start building free</Link>
          </article>

          {billing.billingEnabled && (
            <article id="codeit-plus" className="pricing-card pricing-card--plus">
              <div className="pricing-card__flag">
                {isPlusMember(billing) ? 'Your plan' : 'For parents and guardians'}
              </div>
              <p className="pricing-card__eyebrow">Paid plan</p>
              <h2>CodeIt Plus</h2>
              <div className="pricing-price">
                <strong>CA$12</strong><span>per month, cancel any time</span>
              </div>
              <p className="pricing-card__summary">
                For families who build a lot. Lessons, the playground and saving stay free for everyone.
              </p>
              <ul>{PLUS_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}</ul>

              {isPlusMember(billing) ? (
                <>
                  <p className="pricing-plan-state" role="status">
                    {billing.willLoseAccessAt
                      ? `Your plan ends on ${new Date(billing.willLoseAccessAt).toLocaleDateString()}.`
                      : billing.status === 'past_due'
                        ? 'We could not take the last payment. Update your card to keep CodeIt Plus.'
                        : billing.currentPeriodEnd
                          ? `Renews on ${new Date(billing.currentPeriodEnd).toLocaleDateString()}.`
                          : 'CodeIt Plus is active on this account.'}
                  </p>
                  <button
                    type="button"
                    className="pricing-button pricing-button--primary"
                    disabled={billingBusy}
                    onClick={() => handleBillingAction(openBillingPortal, 'billing_portal_open')}
                  >
                    {billingBusy ? 'Opening…' : 'Manage billing'}
                  </button>
                  <p className="pricing-card__note">
                    Card changes and cancellation happen on Stripe. CodeIt never stores your card.
                  </p>
                </>
              ) : isStudentAccount ? (
                <p className="pricing-plan-state" role="status">
                  Ask a parent or guardian to set this up from their own account. CodeIt does not sell to children.
                </p>
              ) : !user ? (
                <>
                  <Link className="pricing-button pricing-button--primary" to="/login?from=pricing">
                    Log in to subscribe
                  </Link>
                  <p className="pricing-card__note">
                    Renews monthly until you cancel, and there is a{' '}
                    <Link to="/terms#refunds">{REFUND_WINDOW_DAYS}-day refund window</Link> on a first payment.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="pricing-button pricing-button--primary"
                    disabled={billingBusy}
                    onClick={() => handleBillingAction(startCheckout, 'billing_checkout_start')}
                  >
                    {billingBusy ? 'Opening secure checkout…' : 'Subscribe for CA$12/month'}
                  </button>
                  <p className="pricing-card__note">
                    Payment is handled by Stripe. You will be asked to confirm before anything is charged.
                    {' '}Renews monthly until you cancel — see{' '}
                    <Link to="/terms#billing">billing</Link> and{' '}
                    <Link to="/terms#refunds">cancelling and refunds</Link>.
                  </p>
                </>
              )}

              {billingError && <p className="pricing-plan-error" role="alert">{billingError}</p>}
            </article>
          )}

          <article id="family-pilot" className="pricing-card pricing-card--founding">
            <div className="pricing-card__flag">Free pilot requests open</div>
            <p className="pricing-card__eyebrow">For parents and guardians</p>
            <h2>Founding Family Pilot</h2>
            <div className="pricing-price"><strong>Free pilot</strong><span>planned plan: CA$12/month after testing</span></div>
            <p className="pricing-card__summary">More project creation, two learner profiles, and a clearer view of progress.</p>
            <ul>{FOUNDING_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <div className="pricing-next" aria-label="What happens after requesting a family pilot spot">
              <strong>What happens next</strong>
              <ol>
                <li>Leave an adult email and request a pilot spot.</li>
                <li>Get immediate setup steps by email.</li>
                <li>Try the current family experience. Nothing paid starts automatically.</li>
              </ol>
            </div>
            {waitlistReady ? (
              <form className="pricing-waitlist" onSubmit={registerInterest}>
                <label htmlFor="founding-email">Your email for pilot updates</label>
                <input
                  id="founding-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={leadEmail}
                  onChange={(event) => {
                    setLeadEmail(event.target.value);
                    if (interestStatus !== 'saved') setInterestStatus('idle');
                  }}
                  placeholder="parent@example.com"
                  required
                  disabled={interestStatus === 'saving' || interestStatus === 'saved'}
                />
                <label className="pricing-waitlist__consent">
                  <input
                    type="checkbox"
                    checked={adultConsent}
                    onChange={(event) => {
                      setAdultConsent(event.target.checked);
                      if (interestStatus !== 'saved') setInterestStatus('idle');
                    }}
                    disabled={interestStatus === 'saving' || interestStatus === 'saved'}
                  />
                  <span>I am a parent, guardian, or educator and agree to receive Founding Family pilot updates.</span>
                </label>
                <button
                  type="submit"
                  className="pricing-button pricing-button--primary"
                  disabled={interestStatus === 'saving' || interestStatus === 'saved'}
                >
                  {interestStatus === 'saving' && 'Saving…'}
                  {interestStatus === 'saved' && 'Pilot request saved — thank you'}
                  {(interestStatus === 'idle' || interestStatus === 'error' || interestStatus === 'parent-required' || interestStatus === 'consent-required') && 'Request a free family pilot spot'}
                </button>
              </form>
            ) : (
              <a
                className="pricing-button pricing-button--primary"
                href={PILOT_EMAIL_HREF}
                onClick={() => void trackEvent('parent_cta_click', 'pilot-email')}
              >
                Email us to join the pilot
              </a>
            )}
            {waitlistReady && (
              <a
                className="pricing-button pricing-button--email"
                href={PILOT_EMAIL_HREF}
                onClick={() => void trackEvent('parent_cta_click', 'pilot-email')}
              >
                Or email us about the pilot
              </a>
            )}
            {interestStatus === 'error' && <p className="pricing-card__error" role="alert">We could not save that just now. Please try again.</p>}
            {interestStatus === 'consent-required' && <p className="pricing-card__error" role="alert">Please confirm that you are an adult and want pilot updates.</p>}
            {interestStatus === 'parent-required' && (
              <p className="pricing-card__error" role="alert">
                Family pilot requests are for parents or guardians. Ask an adult to use a Parent / Educator account.
              </p>
            )}
            <small>
              No charge or subscription. We use your email only for this pilot, and you can opt out at any time.
              Email links open your email app; nothing is sent automatically.
            </small>
          </article>
        </section>

        {interestStatus === 'saved' && (
          <section className="pricing-thanks" aria-live="polite">
            <div>
              <strong>Your family pilot request is saved.</strong>
              <p>{confirmationSent
                ? 'Check your inbox for immediate setup steps. Nothing paid starts automatically.'
                : 'We will use the submitted email only for this pilot. Nothing paid starts automatically.'}</p>
            </div>
            <Link to="/builder">Start a free project <span aria-hidden="true">→</span></Link>
          </section>
        )}

        <section className="pricing-principles" aria-labelledby="principles-title">
          <div>
            <p className="pricing-kicker">What we will protect</p>
            <h2 id="principles-title">A paid plan should add value without making the free product useless.</h2>
          </div>
          <div className="pricing-principles__grid">
            <article><span>01</span><strong>Learning stays accessible</strong><p>Beginner lessons and practice remain available without a subscription.</p></article>
            <article><span>02</span><strong>Limits stay understandable</strong><p>No confusing tokens or surprise usage charges for families.</p></article>
            <article><span>03</span><strong>Parents get useful context</strong><p>Progress information should explain what a learner made and understood.</p></article>
          </div>
        </section>

        <section className="pricing-faq" aria-labelledby="pricing-faq-title">
          <p className="pricing-kicker">Questions</p>
          <h2 id="pricing-faq-title">Before you decide</h2>
          <div>{FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
