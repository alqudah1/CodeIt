import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import { trackEvent } from '../../utils/trackEvent';
import HomePilotSignup from '../Home/HomePilotSignup';
import './CodingForKids.css';

const FAQS = [
  {
    q: 'What age is CodeIt for?',
    a: 'Parents and legal guardians can create private managed profiles for learners ages 5–12 after confirming the adult account email. Independent student accounts are for ages 13–18.',
  },
  {
    q: 'Do I need to know how to code to help?',
    a: 'No. The activities use plain-language instructions and visible results. A parent or educator can help by asking what changed, what the learner wants to try next, and how they solved a problem.',
  },
  {
    q: 'What can a learner make?',
    a: 'Learners can create and edit websites, small games, and quizzes in the project studio. They can also follow step-by-step Python lessons or experiment in the browser playground.',
  },
  {
    q: 'Is CodeIt free?',
    a: 'CodeIt has useful free activities. A Founding Family plan is being considered at CA$12 per month, but no payment starts from an interest button and no paid family subscription is live today.',
  },
  {
    q: 'Are projects public?',
    a: 'Saved projects are private by default. Eligible independent accounts must choose Publish before a project can appear publicly. Managed profiles ages 5–12 cannot publish projects.',
  },
];

const PATHS = [
  {
    number: '01',
    label: 'Project studio',
    title: 'Start with something worth making',
    body: 'Describe a website, game, or quiz. Then change the design, edit the code, and save a version that feels personal.',
    link: '/builder',
    linkLabel: 'Open the studio',
  },
  {
    number: '02',
    label: 'Python journey',
    title: 'Build the foundations step by step',
    body: 'Short lessons introduce variables, decisions, loops, lists, and functions with a place to try each idea.',
    link: '/journey',
    linkLabel: 'See the journey',
  },
  {
    number: '03',
    label: 'Browser playground',
    title: 'Test a small idea immediately',
    body: 'Change an example, run it, and connect each line of Python to the result—without installing anything.',
    link: '/playground',
    linkLabel: 'Try the playground',
  },
];

export default function CodingForKids() {
  useSEO({
    title: 'Coding for Kids: Projects, Python & Parent Guide | CodeIt',
    description: 'A project-first coding platform for ages 5–18, with private parent-managed profiles for ages 5–12. Build websites, games and quizzes, then learn the code.',
    canonical: '/coding-for-kids',
  });
  useFAQSchema(FAQS);
  useEffect(() => {
    const key = 'codeit_parent_guide_viewed';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, 'yes');
    void trackEvent('parent_guide_view');
  }, []);

  return (
    <>
      <Header />
      <main className="parents-page">
        <section className="parents-hero">
          <div className="parents-wrap parents-hero__grid">
            <div className="parents-hero__copy">
              <span className="parents-eyebrow">For parents &amp; educators</span>
              <h1>A first coding project they’ll want to keep improving.</h1>
              <p className="parents-hero__lead">
                CodeIt helps a beginner turn an idea into a website, game, or quiz—then change the
                design, inspect the code, and understand what makes it work.
              </p>
              <div className="parents-actions">
                <Link
                  to="/builder"
                  className="parents-button parents-button--primary"
                  onClick={() => void trackEvent('parent_cta_click', 'try-project')}
                >
                  Try a free project together
                </Link>
                <a
                  href="#parent-pilot"
                  className="parents-button parents-button--quiet"
                  onClick={() => void trackEvent('parent_cta_click', 'join-pilot')}
                >
                  Join the free parent pilot
                </a>
              </div>
              <p className="parents-hero__note">
                Ages 5–12 start through a free parent or guardian account.{' '}
                <Link
                  to="/register?for=family"
                  onClick={() => void trackEvent('parent_cta_click', 'create-family-account')}
                >
                  Create a learner profile
                </Link>
                . No payment is needed.
              </p>
            </div>

            <div className="parents-project" aria-hidden="true">
              <div className="parents-project__bar">
                <span className="parents-project__dots" aria-hidden="true"><i /><i /><i /></span>
                <span>My space quiz</span>
              </div>
              <div className="parents-project__canvas">
                <span className="parents-project__tag">QUESTION 3 OF 5</span>
                <p className="parents-project__question">Which planet has the shortest day?</p>
                <div className="parents-project__answers" aria-hidden="true">
                  <span>Earth</span><span className="is-selected">Jupiter</span><span>Mars</span>
                </div>
              </div>
              <div className="parents-project__edit">
                <span>Next change</span>
                <p>Add a streak counter and make the correct answer glow.</p>
                <strong>Make it mine →</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="parents-trust" aria-label="CodeIt trust commitments">
          <div className="parents-wrap parents-trust__grid">
            <p><strong>No ads</strong><span>We do not sell personal data.</span></p>
            <p><strong>Private first</strong><span>Saved projects stay private until Publish.</span></p>
            <p><strong>Clear age rules</strong><span>Private parent-managed profiles begin at age 5.</span></p>
          </div>
        </section>

        <section className="parents-section parents-intro">
          <div className="parents-wrap parents-intro__grid">
            <div>
              <span className="parents-kicker">Coding for kids, made concrete</span>
              <h2>Start with a result. Learn through every change.</h2>
            </div>
            <div className="parents-intro__answer">
              <p>
                CodeIt combines creative coding projects with a structured Python path. Beginners
                see something work early, then build the habit that matters: make a change, run it,
                notice the result, and explain why it happened.
              </p>
              <p>
                That gives a learner a reason to keep going—and gives an adult something more useful
                to ask than “Did you finish the lesson?”
              </p>
            </div>
          </div>
        </section>

        <section className="parents-section parents-loop-section">
          <div className="parents-wrap">
            <div className="parents-heading">
              <span className="parents-kicker">The learning loop</span>
              <h2>Make. Edit. Understand.</h2>
              <p>Three small steps turn a generated starting point into the learner’s own work.</p>
            </div>
            <div className="parents-loop">
              <article>
                <span>1</span>
                <h3>Make</h3>
                <p>Choose a small project with a visible result.</p>
              </article>
              <article>
                <span>2</span>
                <h3>Edit</h3>
                <p>Change the words, colors, rules, and code.</p>
              </article>
              <article>
                <span>3</span>
                <h3>Understand</h3>
                <p>Connect each decision to what happened on screen.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="parents-section parents-paths-section">
          <div className="parents-wrap">
            <div className="parents-heading parents-heading--left">
              <span className="parents-kicker">Three ways in</span>
              <h2>Meet them where their curiosity is.</h2>
            </div>
            <div className="parents-paths">
              {PATHS.map(path => (
                <article key={path.number} className="parents-path">
                  <div className="parents-path__top">
                    <span className="parents-path__number">{path.number}</span>
                    <span className="parents-path__label">{path.label}</span>
                  </div>
                  <h3>{path.title}</h3>
                  <p>{path.body}</p>
                  <Link to={path.link}>{path.linkLabel} →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="parents-section parents-week-section">
          <div className="parents-wrap parents-week">
            <div className="parents-week__copy">
              <span className="parents-kicker">A realistic first week</span>
              <h2>Four short sessions. One project worth showing you.</h2>
              <p>
                Twenty focused minutes is enough for a useful win. The goal is not to race through
                content; it is to return with a better question each time.
              </p>
            </div>
            <ol className="parents-week__list">
              <li><span>Day 1</span><p>Pick a project and get the first version working.</p></li>
              <li><span>Day 2</span><p>Change the design so it no longer looks like a template.</p></li>
              <li><span>Day 3</span><p>Edit one piece of code and predict what will happen.</p></li>
              <li><span>Day 4</span><p>Explain the project, save it, and choose the next improvement.</p></li>
            </ol>
          </div>
        </section>

        <section className="parents-section parents-adult-section">
          <div className="parents-wrap parents-adult">
            <div className="parents-adult__card">
              <span className="parents-kicker">What the learner does</span>
              <h2>Builds, tests, and makes decisions.</h2>
              <ul>
                <li>Starts from an idea instead of a blank screen</li>
                <li>Changes real HTML, CSS, JavaScript, or Python</li>
                <li>Saves versions and publishes only by choice</li>
              </ul>
            </div>
            <div className="parents-adult__card parents-adult__card--mint">
              <span className="parents-kicker">What the adult can expect</span>
              <h2>Clear boundaries and visible progress.</h2>
              <ul>
                <li>No coding knowledge required to get started</li>
                <li>No ads and no sale of personal information</li>
                <li>Plain-language privacy and account guidance</li>
              </ul>
              <Link to="/privacy">Read Privacy &amp; Safety →</Link>
            </div>
          </div>
        </section>

        <section className="parents-section parents-faq-section">
          <div className="parents-wrap parents-faq-layout">
            <div className="parents-heading parents-heading--left">
              <span className="parents-kicker">Before you begin</span>
              <h2>Questions parents ask first.</h2>
              <p>Simple answers, including what is available today and what is still planned.</p>
            </div>
            <div className="parents-faq" itemScope itemType="https://schema.org/FAQPage">
              {FAQS.map(({ q, a }) => (
                <article
                  key={q}
                  className="parents-faq__item"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <h3 itemProp="name">{q}</h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">{a}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="parent-pilot" className="parents-pilot-section">
          <div className="parents-wrap">
            <div className="parents-pilot">
              <div>
                <span className="parents-eyebrow">Founding Family pilot</span>
                <h2>Help shape a coding product your learner would actually return to.</h2>
                <p>
                  We’re inviting a small group of parents and educators to try CodeIt, tell us where
                  a beginner gets stuck, and influence what we build next.
                </p>
              </div>
              <div className="parents-pilot__action">
                <HomePilotSignup source="parents-guide" showHeading={false} />
                <Link
                  to="/pricing"
                  className="parents-button parents-button--quiet"
                  onClick={() => void trackEvent('parent_cta_click', 'view-pricing')}
                >
                  See the planned family plan
                </Link>
                <span>No charge or subscription starts by joining the pilot list.</span>
              </div>
            </div>
          </div>
        </section>

        <nav className="parents-related" aria-label="Related CodeIt pages">
          <div className="parents-wrap parents-related__inner">
            <span>Keep exploring</span>
            <Link to="/learn-python-for-kids">Python for kids</Link>
            <Link to="/python-games-for-kids">Coding games</Link>
            <Link to="/playground">Python playground</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
