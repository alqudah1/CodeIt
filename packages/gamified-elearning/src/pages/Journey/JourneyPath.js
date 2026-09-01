import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import { TOTAL_LESSONS } from '../Lessons/lessonRegistry';
import './JourneyPath.css';

// ── /journey, after the second course was retired ───────────────────────────
//
// The app used to run TWO parallel courses: this one and /lessons, over the
// same 31 lessons, and a child had to guess which was "the" course. The
// duplicate map is gone and the lesson map absorbed its one good idea.
//
// But /journey is NOT free to delete or redirect. It is one of the 74 URLs in
// the sitemap, it has its own generated static HTML and schema, and the lesson
// pages link to it. Redirecting it would have put a bounce behind a canonical
// sitemap entry, which is the soft-404 pattern that cost this domain before
// (see /press). So the route keeps a real page that matches what the static
// HTML already promises — "structured practice", "a clear next step" — and
// sends the reader to the one path that exists.

const STEPS = [
  { n: '1', title: 'Learn the idea', body: 'A short lesson introduces one Python idea at a time, with runnable examples you can change.' },
  { n: '2', title: 'Check you have it', body: 'A quiz on that lesson, then a coding challenge where you write real Python to pass.' },
  { n: '3', title: 'Build with it', body: 'Open the studio and use the idea in a project of your own, then explain how your own code works.' },
];

const JourneyPath = () => {
  useSEO({ canonical: '/journey' });

  return (
    <div className="jpath">
      <Header />
      <main className="jpath__main">
        <p className="jpath__eyebrow">Structured practice</p>
        <h1 className="jpath__title">A clear next step for every beginner.</h1>
        <p className="jpath__intro">
          The CodeIt journey is {TOTAL_LESSONS} Python lessons that go in order: short explanations,
          then quizzes and hands-on challenges, so you practise instead of only watching.
          Progress and XP are saved, so you can stop and pick up where you left off.
        </p>

        <ol className="jpath__steps">
          {STEPS.map(step => (
            <li className="jpath__step" key={step.n}>
              <span className="jpath__step-num" aria-hidden="true">{step.n}</span>
              <div>
                <h2 className="jpath__step-title">{step.title}</h2>
                <p className="jpath__step-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="jpath__doors">
          <Link className="jpath__door jpath__door--primary" to="/lessons">See the whole path</Link>
          <Link className="jpath__door" to="/builder">Make something first</Link>
        </div>
      </main>
    </div>
  );
};

export default JourneyPath;
