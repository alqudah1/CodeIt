import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import { trackEvent } from '../../utils/trackEvent';
import { useAuth } from '../../context/AuthContext';
import { ENDPOINTS } from '../../config/api';
import { CURRENCY_SYMBOL, PRICE, PRICE_PER_INTERVAL } from '../../config/pricing';
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
import COMPANY from '../../config/company';

const FREE_FEATURES = [
  'Beginner Python lessons and coding games',
  'The browser-based Python playground',
  'Build, edit, save, and publish projects',
  'Explore projects made by other learners',
];

const FOUNDING_FEATURES = [
  'Everything in the free plan',
  '20 new projects a month, built for you by AI',
  'Two children, one adult account',
  'One email a month: what your child made and understood',
  'We help you set it up, and you can write to us directly',
];

const PLUS_FEATURES = [
  'As many AI-built projects and changes as you want',
  // Publishing moved to the free plan, where this page had always said it was.
  // Listing it here as well would make Plus look like it unlocks something a
  // family already has.
  'See how many people played what your child made',
  'Up to four children, one adult account',
  'Everything in the free plan stays free',
];

const PILOT_EMAIL_HREF = [
  `mailto:${COMPANY.contactEmail}`,
  '?subject=CodeIt%20Founding%20Family%20pilot',
  '&body=Hi%20CodeIt%2C%0A%0AI%27m%20interested%20in%20the%20Founding%20Family%20pilot.%0A%0AMy%20learner%27s%20age%20range%3A%0AWhat%20we%27d%20like%20to%20build%3A%0A%0AThanks!',
].join('');

const FAQ = [
  ['Can we use CodeIt for free?', 'Yes. The lessons, playground, coding games, and core project tools will keep a useful free option.'],
  ['Is the family pilot free?', 'Yes. Requesting a pilot spot and using the current pilot are free. No card, trial, or subscription starts automatically.'],
  ['What happens after I request a spot?', 'We email you the setup steps straight away, so you can try the family experience today.'],
  ['Why is the paid plan not unlimited?', 'Every AI-built project costs us real money to make. A set number each month keeps the price the same every month for you, and keeps CodeIt running.'],
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
        {/* Six blocks used to stand between a parent and a price: a kicker, a
            75px serif headline, a paragraph, a jump link, a note under the jump
            link, and the status pill. The plans began 727px down — 9% of a
            laptop's first screen on a page called Pricing.

            The jump link pointed at the family pilot card, which is the third
            card in the grid immediately below. A link that scrolls you past two
            plans to reach the third is not navigation, it is an advert for one
            of the three options, and its own card sells it better.

            What stays: the heading, because a page needs one, and the status
            pill, because "nothing is charged today" is the one thing a parent
            needs to read before the numbers rather than after them. */}
        <section className="pricing-hero" aria-labelledby="pricing-title">
          <h1 id="pricing-title">Start free. Pay only if you want more.</h1>
          <div className="pricing-status">
            <span aria-hidden="true" />
            {billing.billingEnabled
              ? 'The pilot is free. No card needed to request a spot.'
              : 'Paid plans are not open yet. Nothing is charged today.'}
          </div>
        </section>

        <section className="pricing-plans" aria-label="CodeIt plan comparison">
          <article className="pricing-card">
            <p className="pricing-card__eyebrow">For every beginner</p>
            <h2>Free</h2>
            <div className="pricing-price"><strong>{CURRENCY_SYMBOL}0</strong><span>free forever, no card</span></div>
            <p className="pricing-card__summary">Learn the basics and make a real first project without a credit card.</p>
            <ul>{FREE_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            {/* ?from=pricing lets the studio show one dismissible line bridging the
                grown-up back to this page. Children never arrive with it. */}
            <Link className="pricing-button pricing-button--quiet" to="/builder?from=pricing">Start building free</Link>
          </article>

          {billing.billingEnabled && (
            <article id="codeit-plus" className="pricing-card pricing-card--plus">
              <div className="pricing-card__flag">
                {isPlusMember(billing) ? 'Your plan' : 'For parents and guardians'}
              </div>
              <p className="pricing-card__eyebrow">Paid plan</p>
              <h2>CodeIt Plus</h2>
              <div className="pricing-price">
                <strong>{PRICE}</strong><span>plus tax, per month, cancel any time</span>
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
                    Renews monthly until you cancel. See{' '}
                    <Link to="/terms#refunds">cancelling and refunds</Link>.
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
                    {billingBusy ? 'Opening secure checkout…' : `Subscribe for ${PRICE_PER_INTERVAL}`}
                  </button>
                  <p className="pricing-card__note">
                    Payment is handled by Stripe. Sales tax is added at checkout based on where
                    you live, and you confirm the full total before anything is charged.
                    {' '}Renews monthly until you cancel. See{' '}
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
            <div className="pricing-price"><strong>Free pilot</strong><span>free while it lasts, then {PRICE_PER_INTERVAL} if you stay</span></div>
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
                  {interestStatus === 'saved' && 'Pilot request saved. Thank you.'}
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

        {/* A parent deciding whether to pay is buying one thing above all:
            knowing what their child actually did. The plans above SAY there is
            a monthly email; this shows one, so the promise has a shape. The
            learner is made up and says so — the mechanics (lesson names,
            concept labels, a child's own changed lines) are exactly what the
            real product records. */}
        <section className="pricing-evidence" aria-labelledby="evidence-title">
          <div className="pricing-evidence__intro">
            <p className="pricing-kicker">The monthly email</p>
            <h2 id="evidence-title">Not screen-time minutes. Their actual code.</h2>
            <p>
              Founding Families get one email a month. It is built from your
              child&rsquo;s real projects and finished lessons &mdash; here is
              what one looks like.
            </p>
          </div>
          <article className="pricing-email" aria-label="An example of the monthly family email">
            <div className="pricing-email__flag">Example &mdash; Maya is made up. Your email is built from your child&rsquo;s real work.</div>
            <div className="pricing-email__subject">
              <span>Subject:</span> What Maya built this month on CodeIt
            </div>
            <div className="pricing-email__body">
              <p>Maya finished 3 lessons this month: <strong>Variables</strong>, <strong>If statements</strong>, and <strong>For loops</strong>.</p>
              <p>She opened <strong>Catch the Stars</strong>, looked inside, and changed it. These lines are hers:</p>
              <pre><code>{'score = score + 2;   // each star is worth two now\nspeed = 9;            // she made the stars fall faster'}</code></pre>
              <p>She used an if statement she learned in lesson 4 to end the game when the basket misses three stars.</p>
            </div>
          </article>
          <p className="pricing-evidence__note">
            You can also open this view any time on your child&rsquo;s profile.
            We never share anything beyond the projects your child chose to save.
          </p>
        </section>

        <section className="pricing-principles" aria-labelledby="principles-title">
          <div>
            <p className="pricing-kicker">What we will protect</p>
            <h2 id="principles-title">Paying should add something. It should never take away what was free.</h2>
          </div>
          <div className="pricing-principles__grid">
            <article><span>01</span><strong>Learning stays free</strong><p>Every lesson, the playground and building your own projects cost nothing, and always will.</p></article>
            <article><span>02</span><strong>One price, no surprises</strong><p>No credits, no top-ups, no usage charges. CA$12 a month plus tax, and you can stop any time.</p></article>
            <article><span>03</span><strong>Progress you can read</strong><p>We tell you what your child made and what they understood, not how many minutes they were online.</p></article>
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
