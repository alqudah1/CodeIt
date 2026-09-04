// ── What you made is here ────────────────────────────────────────────────────
//
// A child who came back to CodeIt landed on a marketing page. Nothing on it
// knew they had been here before, and nothing on it mentioned the game they
// made yesterday. That lived in one localStorage key which only the studio
// ever read. So every visit was a first visit, and the site quietly asked them
// to start again from nothing every single time.
//
// This is the fix, and it goes above everything else: the newest thing they
// made, running, with their name for it and when they made it. Not a
// screenshot and not an icon, the actual project, playing, so there is no
// doubt it is theirs and it still works.
//
// ── The day-one state ────────────────────────────────────────────────────────
//
// Rounds 66 and 67: this returned null for a child with no projects, and what
// was left was a headline, a button, two links and two voids where the shelf
// should be. The concept was right; nobody drew the empty state. So when there
// is nothing on the shelf and the page hands over starters, the same shelf, at
// the same size, holds the three starter games running live. A child arriving
// with nothing sees three games actually moving, at the size their own project
// will appear at tomorrow. The page teaches its own layout.
//
// The previews are deliberately not interactive. Tapping one opens it in the
// studio where the game gets the whole screen.

import { Link } from 'react-router-dom';
import { whenMade } from '../../utils/projectShelf';
import Icon from '../../components/Icon/Icon';
import LiveFrame from './LiveFrame';
import './YourShelf.css';

const TYPE_ICON = {
  game: 'game',
  quiz: 'quiz',
  website: 'site',
  story: 'book',
  tool: 'tool',
};

function StarterShelf({ starters, onOpen, prepare }) {
  const [first, ...others] = starters;
  return (
    <section className="shelf shelf--starters" aria-labelledby="shelf-title">
      <h2 className="shelf__title" id="shelf-title">Pick one and it is yours</h2>

      <Link
        className="shelf__hero"
        to={`/builder?start=${encodeURIComponent(first.id)}`}
        onClick={() => onOpen?.(first)}
      >
        <LiveFrame className="shelf__frame" code={prepare(first.code)} title={`${first.label}, running`} />
        <span className="shelf__meta">
          <span className="shelf__name">{first.label}</span>
          <span className="shelf__when">{first.blurb}</span>
          <span className="shelf__cta">Make it mine →</span>
        </span>
      </Link>

      {others.length > 0 && (
        <ul className="shelf__pair" aria-label="More games you can open now">
          {others.map((game) => (
            <li key={game.id}>
              <Link
                className="shelf__small"
                to={`/builder?start=${encodeURIComponent(game.id)}`}
                onClick={() => onOpen?.(game)}
              >
                <LiveFrame className="shelf__frame shelf__frame--small" code={prepare(game.code)} title={`${game.label}, running`} />
                <span className="shelf__small-name">{game.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function YourShelf({ projects = [], starters = [], onOpen, now = Date.now(), prepare = (code) => code, signedIn = false }) {
  if (!projects.length) {
    if (starters.length) return <StarterShelf starters={starters} onOpen={onOpen} prepare={prepare} />;
    return null;
  }

  const [newest, ...rest] = projects;

  return (
    <section className="shelf" aria-labelledby="shelf-title">
      <h2 className="shelf__title" id="shelf-title">
        {projects.length === 1 ? 'Your project is here' : 'Your projects are here'}
      </h2>

      <Link
        className="shelf__hero"
        to={newest.href || `/builder?shelf=${encodeURIComponent(newest.id)}`}
        onClick={() => onOpen?.(newest)}
      >
        {/* The title is for the accessibility tree, which is why it names the
            project rather than saying "preview". A screen reader lands on the
            link, which already says everything; this frame is decoration on
            top of it and is hidden and unfocusable. */}
        <LiveFrame className="shelf__frame" code={newest.code} title={`Preview of ${newest.title}`} />
        <span className="shelf__meta">
          <span className="shelf__name">{newest.title}</span>
          <span className="shelf__when">You made this {whenMade(newest.updatedAt, now)}</span>
          <span className="shelf__cta">Carry on →</span>
        </span>
      </Link>

      {rest.length > 0 && (
        <ul className="shelf__rest">
          {rest.map((project) => (
            <li key={project.id}>
              <Link
                className="shelf__chip"
                to={project.href || `/builder?shelf=${encodeURIComponent(project.id)}`}
                onClick={() => onOpen?.(project)}
              >
                <Icon name={TYPE_ICON[project.projectType] || 'game'} size={22} />
                <span className="shelf__chip-name">{project.title}</span>
                <span className="shelf__chip-when">{whenMade(project.updatedAt, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!(signedIn && newest.href) && (
        <p className="shelf__note">
          {signedIn
            ? 'Kept in this browser for a week. Press Save in the studio to keep one on your account.'
            : 'Kept in this browser for a week. Make a free account to keep them for good and use them on another device.'}
        </p>
      )}
    </section>
  );
}
