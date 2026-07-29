import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import './SEOPage.css';

const FAQS = [
  {
    q: 'What is an AI website builder for kids?',
    a: 'It is a project tool that helps a young creator turn a plain-language idea into a working website or interactive project. CodeIt keeps the result editable and shows the HTML, CSS, and JavaScript so the learner can understand and change it.',
  },
  {
    q: 'Does CodeIt only generate a finished website?',
    a: 'No. The first version is a starting point. A learner can change the words, colors, layout, and behavior, inspect the code, save the project, and keep improving it.',
  },
  {
    q: 'What ages can use the CodeIt project studio?',
    a: 'Parents and legal guardians can create private managed profiles for learners ages 8–12. Independent student accounts are for ages 13–18. Anyone can try the project studio without creating an account.',
  },
  {
    q: 'Can a child publish a website publicly?',
    a: 'Managed profiles ages 8–12 stay private and cannot publish. Eligible independent accounts save privately by default and must choose Publish before a project receives a public link.',
  },
  {
    q: 'Is the AI website builder free?',
    a: 'The project studio has a free experience. Enhanced AI generation depends on current service availability, and CodeIt also keeps starter projects available so visitors can try the make-edit-learn workflow.',
  },
];

const STEPS = [
  ['1', 'Describe an idea', 'Start with a fan page, portfolio, quiz, game, or school project in ordinary words.'],
  ['2', 'Open a working version', 'Play with the result immediately instead of setting up files or installing software.'],
  ['3', 'Make it personal', 'Change the content, colors, layout, and rules so the result no longer feels like a template.'],
  ['4', 'Learn from the code', 'Inspect and edit the HTML, CSS, and JavaScript that make the project work.'],
];

export default function AIWebsiteBuilderForKids() {
  useSEO({
    title: 'AI Website Builder for Kids: Build & Learn the Code | CodeIt',
    description: 'Kids can turn an idea into an editable website, game, or quiz, then inspect and change the HTML, CSS, and JavaScript behind it.',
    canonical: '/ai-website-builder-for-kids',
  });
  useFAQSchema(FAQS);

  return (
    <>
      <Header />
      <main className="seo-page">
        <div className="seo-container">
          <Link to="/" className="seo-back">&larr; Back to Home</Link>

          <header className="seo-hero">
            <span className="seo-eyebrow">Creative coding for ages 8–18</span>
            <h1 className="seo-h1">An AI website builder for kids that teaches the code.</h1>
            <p className="seo-hero-desc">
              CodeIt helps a young creator turn an idea into a website, game, or quiz—then change
              the design, inspect the real code, and understand how the project works.
            </p>
            <Link to="/builder" className="seo-cta-btn">Build a free project →</Link>
          </header>

          <article className="seo-body">
            <section className="seo-section">
              <h2 className="seo-h2">The first version is the beginning, not the answer.</h2>
              <p className="seo-p">
                A general AI website generator can make something quickly and stop there. CodeIt
                uses that fast result as a reason to learn. The project remains editable, so a
                learner can test an idea, notice what feels generic, and make deliberate changes.
              </p>
              <div className="seo-highlight">
                <p>CodeIt's learning loop is simple: make it, edit it, understand it, and improve it.</p>
              </div>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">How a learner builds a website with CodeIt</h2>
              <ol className="seo-steps" aria-label="How CodeIt works">
                {STEPS.map(([number, title, body]) => (
                  <li key={number}>
                    <span>{number}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">What kids can create</h2>
              <ul className="seo-list">
                <li><strong>Personal websites:</strong> portfolios, fan pages, club pages, and about-me sites.</li>
                <li><strong>School projects:</strong> interactive science, history, or book-report pages.</li>
                <li><strong>Quizzes:</strong> questions, scoring, feedback, and themed results.</li>
                <li><strong>Small games:</strong> reaction challenges, click targets, and word games.</li>
              </ul>
              <p className="seo-p">
                Visitors can also open selected examples in the <Link to="/explore">CodeIt project
                gallery</Link> and remix a copy into a different idea.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">What they actually learn</h2>
              <p className="seo-p">
                The studio connects visible changes to real web code. HTML gives the page its
                content and structure. CSS controls the visual design. JavaScript adds decisions,
                scoring, movement, and other behavior. Learners can compare the preview with the
                code instead of treating AI like a hidden magic box.
              </p>
              <p className="seo-p">
                When they want a more structured path, CodeIt also includes{' '}
                <Link to="/lessons">beginner coding lessons</Link>, a{' '}
                <Link to="/playground">browser Python playground</Link>, and a guided{' '}
                <Link to="/journey">learning journey</Link>.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Private by default, with clear age rules</h2>
              <p className="seo-p">
                Anyone can try the builder without an account. Parents and legal guardians can
                create private managed profiles for learners ages 8–12. Those profiles cannot
                publish projects publicly. Independent student accounts begin at age 13, and saved
                projects remain private unless an eligible owner deliberately chooses Publish.
              </p>
              <p className="seo-p">
                Read the <Link to="/privacy">CodeIt Privacy &amp; Safety notice</Link> or the{' '}
                <Link to="/coding-for-kids">parent guide to coding for kids</Link> for the complete
                account and family-control explanation.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">What is available right now</h2>
              <p className="seo-p">
                The project studio, editable previews, code view, starter projects, saving, and
                eligible publishing are part of the current product. Enhanced AI generation works
                when CodeIt's AI service has available credit. Starter mode keeps the core
                make-edit-learn demonstration available when enhanced generation is temporarily
                unavailable.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Questions parents and educators ask</h2>
              <div className="seo-faq" itemScope itemType="https://schema.org/FAQPage">
                {FAQS.map(({ q, a }) => (
                  <article
                    className="seo-faq__item"
                    key={q}
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
            </section>
          </article>

          <section className="seo-bottom-cta">
            <h2>Start with an idea worth making.</h2>
            <p>Open the studio, try a project, and change the first version until it feels like yours.</p>
            <Link to="/builder" className="seo-cta-btn">Open the project studio →</Link>
          </section>

          <nav className="seo-related" aria-label="Related CodeIt pages">
            <h2>Keep exploring</h2>
            <div className="seo-related__links">
              <Link to="/coding-for-kids" className="seo-related__link">Coding for Kids</Link>
              <Link to="/learn-python-for-kids" className="seo-related__link">Learn Python for Kids</Link>
              <Link to="/explore" className="seo-related__link">Project Gallery</Link>
              <Link to="/pricing" className="seo-related__link">Pricing</Link>
            </div>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
