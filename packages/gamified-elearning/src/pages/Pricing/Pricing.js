import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import { trackEvent } from '../../utils/trackEvent';
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
  'Early access and a direct feedback channel',
];

const FAQ = [
  ['Can we use CodeIt for free?', 'Yes. The lessons, playground, coding games, and core project tools will keep a useful free option.'],
  ['Will I be charged today?', 'No. We are measuring interest before opening billing. Clicking the interest button does not start a trial or subscription.'],
  ['Why is the paid plan not unlimited?', 'Project generation has a real usage cost. A clear monthly allowance keeps the plan predictable for families and sustainable for CodeIt.'],
  ['Who is the family plan for?', 'Parents or guardians who want more project creation, a view of learning progress, and room for two young learners.'],
];

export default function Pricing() {
  const [interestStatus, setInterestStatus] = useState(() => (
    localStorage.getItem('codeit_founding_interest') === 'yes' ? 'saved' : 'idle'
  ));

  useSEO({
    title: 'CodeIt Pricing: Free Coding & Founding Family Plan',
    description: 'Start coding for free. Preview the planned CodeIt Founding Family plan for more project builds, parent visibility, and two learner profiles.',
    canonical: '/pricing',
  });

  useEffect(() => {
    const key = 'codeit_pricing_viewed';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'yes');
    void trackEvent('pricing_view');
  }, []);

  const registerInterest = async () => {
    if (interestStatus === 'saving' || interestStatus === 'saved') return;
    setInterestStatus('saving');
    const recorded = await trackEvent('pricing_interest', 'founding-family');
    if (recorded) {
      localStorage.setItem('codeit_founding_interest', 'yes');
      setInterestStatus('saved');
    } else {
      setInterestStatus('error');
    }
  };

  return (
    <div className="pricing-page">
      <Header />
      <main>
        <section className="pricing-hero" aria-labelledby="pricing-title">
          <p className="pricing-kicker">Simple, honest pricing</p>
          <h1 id="pricing-title">Start free. Pay when your family needs more room to build.</h1>
          <p>CodeIt is free while we learn what families value most. We are testing one paid plan before adding billing.</p>
          <div className="pricing-status"><span aria-hidden="true" /> No payment is being collected today</div>
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

          <article className="pricing-card pricing-card--founding">
            <div className="pricing-card__flag">Offer being tested</div>
            <p className="pricing-card__eyebrow">For parents and guardians</p>
            <h2>Founding Family</h2>
            <div className="pricing-price"><strong>US$12</strong><span>per month · planned</span></div>
            <p className="pricing-card__summary">More project creation, two learner profiles, and a clearer view of progress.</p>
            <ul>{FOUNDING_FEATURES.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            <button
              type="button"
              className="pricing-button pricing-button--primary"
              onClick={registerInterest}
              disabled={interestStatus === 'saving' || interestStatus === 'saved'}
            >
              {interestStatus === 'saving' && 'Saving…'}
              {interestStatus === 'saved' && 'Interest saved — thank you'}
              {(interestStatus === 'idle' || interestStatus === 'error') && "I'd consider this plan"}
            </button>
            {interestStatus === 'error' && <p className="pricing-card__error" role="alert">We could not save that just now. Please try again.</p>}
            <small>No charge, checkout, or subscription. This only helps us decide what to build next.</small>
          </article>
        </section>

        {interestStatus === 'saved' && (
          <section className="pricing-thanks" aria-live="polite">
            <div>
              <strong>That is useful—thank you.</strong>
              <p>Keep using the free product while we finish parent controls and billing.</p>
            </div>
            <Link to="/register">Create a free account <span aria-hidden="true">→</span></Link>
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
