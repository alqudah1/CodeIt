// ── What you made is here ────────────────────────────────────────────────────
//
// A child who came back to CodeIt landed on a marketing page. Nothing on it
// knew they had been here before, and nothing on it mentioned the game they
// made yesterday — that lived in one localStorage key which only the studio
// ever read. So every visit was a first visit, and the site quietly asked them
// to start again from nothing every single time.
//
// This is the fix, and it goes above everything else: the newest thing they
// made, running, with their name for it and when they made it. Not a
// screenshot and not an icon — the actual project, playing, so there is no
// doubt it is theirs and it still works.
//
// The preview is deliberately not interactive. It is a reminder, not the
// place you play; tapping it takes you into the studio where the game gets the
// whole screen. Making it playable here would mean a child poking at a
// thumbnail on the front page instead of opening their project.

import { Link } from 'react-router-dom';
import { whenMade } from '../../utils/projectShelf';
import './YourShelf.css';

const TYPE_ICON = {
  game: '🎮',
  quiz: '🧠',
  website: '🌐',
  story: '📖',
  tool: '🛠️',
};

export default function YourShelf({ projects = [], onOpen, now = Date.now() }) {
  if (!projects.length) return null;

  const [newest, ...rest] = projects;

  return (
    <section className="shelf" aria-labelledby="shelf-title">
      <h2 className="shelf__title" id="shelf-title">
        {projects.length === 1 ? 'Your project is here' : 'Your projects are here'}
      </h2>

      <Link
        className="shelf__hero"
        to={`/builder?shelf=${encodeURIComponent(newest.id)}`}
        onClick={() => onOpen?.(newest)}
      >
        <span className="shelf__frame" aria-hidden="true">
          {/* The title is for the accessibility tree, which is why it names the
              project rather than saying "preview". A screen reader lands on the
              link, which already says everything; this frame is decoration on
              top of it and is hidden and unfocusable. */}
          <iframe
            className="shelf__preview"
            title={`Preview of ${newest.title}`}
            aria-hidden="true"
            tabIndex={-1}
            srcDoc={newest.code}
            sandbox="allow-scripts"
            loading="lazy"
            scrolling="no"
          />
        </span>
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
                to={`/builder?shelf=${encodeURIComponent(project.id)}`}
                onClick={() => onOpen?.(project)}
              >
                <span aria-hidden="true">{TYPE_ICON[project.projectType] || '🎮'}</span>
                <span className="shelf__chip-name">{project.title}</span>
                <span className="shelf__chip-when">{whenMade(project.updatedAt, now)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="shelf__note">
        Kept in this browser for a week. Make a free account to keep them for good and use them
        on another device.
      </p>
    </section>
  );
}
