import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { useSEO } from '../../hooks/useSEO';
import '../CreatorBrief/CreatorBrief.css';
import './InvestorBrief.css';

const PRODUCT_LOOP = [
  ['01', 'Imagine', 'A student starts with an idea for a website, game, or quiz.'],
  ['02', 'Build', 'CodeIt creates a working first version so the learner is not facing a blank screen.'],
  ['03', 'Understand', 'The student connects visible behaviour to the code and concepts behind it.'],
  ['04', 'Make it theirs', 'They edit, save, publish, and share something they can genuinely explain.'],
];

const CURRENT_PRODUCT = [
  'AI-assisted website, game, and quiz creation',
  'Editable code and live project preview',
  'Project saving and public sharing',
  'Beginner lessons, quizzes, games, and progress',
  'Privacy-safe acquisition and activation analytics',
];

const NEXT_MILESTONES = [
  ['Validate demand', 'Interview parents and run a Founding Family pilot before turning on billing.'],
  ['Prove activation', 'Measure how many qualified visitors create, personalize, save, and return to a project.'],
  ['Complete parent trust', 'Add verified parent-managed accounts and approved milestone emails.'],
  ['Test distribution', 'Run repeatable creator, community, school, and coding-club partnerships.'],
];

export default function InvestorBrief() {
  useSEO({
    title: 'CodeIt Investor Overview',
    description: 'An unlisted, honest overview of the CodeIt product, market thesis, business model, and validation plan.',
    canonical: '/investor-brief',
    robots: 'noindex,nofollow',
  });

  return (
    <div className="creator-brief investor-brief">
      <header className="creator-brief__header">
        <Link to="/" aria-label="CodeIt home"><BrandLogo className="creator-brief__logo" /></Link>
        <span>Confidential product overview</span>
      </header>

      <main>
        <section className="creator-brief__hero investor-brief__hero">
          <p className="creator-brief__eyebrow">CodeIt investor overview</p>
          <h1>Students already have ideas.<br /><span>CodeIt turns them into builders.</span></h1>
          <p className="creator-brief__lead">
            CodeIt is a creative coding studio for young people ages 8–17. Students build something
            exciting first, then learn how the code works by changing and owning the result.
          </p>
          <div className="creator-brief__hero-actions">
            <Link to="/builder">Try the product <span aria-hidden="true">→</span></Link>
            <a href="#business">See the business thesis</a>
          </div>
        </section>

        <section className="investor-brief__stage" aria-label="CodeIt current stage">
          <div>
            <span>Current stage</span>
            <strong>Working product, pre-revenue validation</strong>
          </div>
          <p>
            The product exists and can be demonstrated today. CodeIt does not yet claim paying
            customers or proven product-market fit. The immediate goal is to validate parent demand,
            activation, retention, and willingness to pay.
          </p>
        </section>

        <section className="creator-brief__section" aria-labelledby="problem-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">The problem</p>
            <h2 id="problem-title">Coding education often begins where curiosity ends.</h2>
            <p>
              Beginners are frequently asked to learn syntax before making anything meaningful.
              General AI builders solve the blank-page problem, but they can hide the learning.
              CodeIt connects the excitement of instant creation to understanding and control.
            </p>
          </div>
          <div className="investor-brief__thesis-grid">
            <article><span>For students</span><strong>Start with something worth making</strong><p>The project becomes the reason to learn.</p></article>
            <article><span>For parents</span><strong>See meaningful progress</strong><p>Progress is shown through real work, not only scores.</p></article>
            <article><span>For educators</span><strong>Turn ideas into teachable moments</strong><p>Projects provide a concrete place to discuss code.</p></article>
          </div>
        </section>

        <section className="creator-brief__section" aria-labelledby="loop-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">The learning loop</p>
            <h2 id="loop-title">Build first. Understand next. Keep creating.</h2>
          </div>
          <div className="creator-brief__steps">
            {PRODUCT_LOOP.map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-brief__section investor-brief__product" aria-labelledby="product-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">What exists today</p>
            <h2 id="product-title">A working product, not a slide-deck concept.</h2>
          </div>
          <div className="investor-brief__product-layout">
            <ul>
              {CURRENT_PRODUCT.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <aside>
              <span>Who it serves</span>
              <strong>Young creators ages 8–17</strong>
              <p>Ages 8–12 explore with a parent or guardian. Independent student accounts currently begin at 13.</p>
              <Link to="/creator-brief">Open the three-minute demonstration guide →</Link>
            </aside>
          </div>
        </section>

        <section className="creator-brief__section investor-brief__evidence" aria-labelledby="evidence-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">Historical product activity</p>
            <h2 id="evidence-title">The existing database contains real usage signals.</h2>
            <p>
              Read-only audit completed July 28, 2026. These are aggregate database records—not
              verified paying customers—and may include internal or test accounts.
            </p>
          </div>
          <div className="investor-brief__evidence-grid">
            <article><strong>215</strong><span>Account records</span></article>
            <article><strong>199</strong><span>Student profiles</span></article>
            <article><strong>151</strong><span>Learners with XP</span></article>
            <article><strong>144,060</strong><span>XP recorded</span></article>
            <article><strong>609</strong><span>Lesson completions</span></article>
            <article><strong>777</strong><span>Quiz attempts</span></article>
            <article><strong>1,165</strong><span>Puzzle completions</span></article>
            <article><strong>12</strong><span>Saved projects</span></article>
          </div>
          <aside className="investor-brief__evidence-note">
            Login totals are not shown because the historical product did not record login events.
            Future acquisition and activation events are now measured separately and more accurately.
          </aside>
        </section>

        <section id="business" className="creator-brief__section" aria-labelledby="business-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">Business model hypothesis</p>
            <h2 id="business-title">Start with families. Expand through trusted learning communities.</h2>
            <p>The model is intentionally presented as a hypothesis until real customers validate it.</p>
          </div>
          <div className="investor-brief__business-grid">
            <article>
              <span>Free</span>
              <h3>Let families experience the core loop</h3>
              <p>Create a first project and understand why CodeIt feels different.</p>
            </article>
            <article>
              <span>Planned family plan</span>
              <h3>US$12 per month</h3>
              <p>More creation capacity and parent-approved progress features. Billing is not live yet.</p>
            </article>
            <article>
              <span>Future expansion</span>
              <h3>Clubs, camps, tutors, and schools</h3>
              <p>Group tools and educator workflows come after the family value proposition is proven.</p>
            </article>
          </div>
        </section>

        <section className="creator-brief__section" aria-labelledby="milestones-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">The next proof points</p>
            <h2 id="milestones-title">The plan is to earn evidence, not manufacture it.</h2>
          </div>
          <div className="investor-brief__milestones">
            {NEXT_MILESTONES.map(([title, copy], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-brief__claims investor-brief__truth">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">Investor clarity</p>
            <h2>What is proven—and what still needs proving.</h2>
          </div>
          <div>
            <article className="is-approved">
              <h3>Demonstrable now</h3>
              <ul>
                <li>A student can create, edit, save, and publish a project.</li>
                <li>The product combines creation with lessons and coding concepts.</li>
                <li>The funnel can measure acquisition and core activation events.</li>
              </ul>
            </article>
            <article className="is-planned">
              <h3>Validation still required</h3>
              <ul>
                <li>Consistent customer acquisition and paid conversion.</li>
                <li>Retention strong enough to support a subscription.</li>
                <li>Verified parent-managed accounts and progress-email delivery.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="investor-brief__ask">
          <p className="creator-brief__eyebrow">What support accelerates</p>
          <h2>Turn a working product into a validated education business.</h2>
          <p>
            Capital and experienced partners would fund customer discovery, child-safety and parent
            infrastructure, product refinement, curriculum quality, and repeatable distribution.
          </p>
          <div>
            <Link to="/builder">Experience CodeIt <span aria-hidden="true">→</span></Link>
            <a href="mailto:hello@codeitlearn.com?subject=CodeIt%20investor%20conversation">Start a conversation</a>
          </div>
        </section>
      </main>
    </div>
  );
}
