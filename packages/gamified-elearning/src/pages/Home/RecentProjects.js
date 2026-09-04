import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import { trackEvent } from '../../utils/trackEvent';
import Icon from '../../components/Icon/Icon';
import { displayTitle } from '../../utils/displayTitle';
import './RecentProjects.css';

// ── The most convincing thing on the site, on the page people land on ────────
//
// /explore is a real gallery of real projects published by real students, and
// the home page linked to it once, as a text link, in the middle of a feature
// list near the footer. Meanwhile the page's one piece of visible evidence was
// a mock email about an invented child called Sam.
//
// This shows the three most recently published projects: the child's own title,
// the initial of the name they published under, and a link to the project
// itself.
//
// It renders NOTHING when there are fewer than three. No placeholder names, no
// skeleton cards, no "coming soon". A section that quietly disappears on a slow
// day is honest; a section that invents three projects is the thing this
// replaced.
const TYPE_ICON = { game: 'game', quiz: 'quiz', website: 'site', tool: 'tool', story: 'book' };

export default function RecentProjects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let live = true;
    // A home page must never fall over because a gallery request cannot be
    // made. In a test renderer, an old browser, or anything without fetch,
    // this section simply does not appear.
    if (typeof fetch !== 'function') return undefined;
    fetch(`${API_BASE_URL}/api/explore?limit=6`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!live || !data) return;
        const newest = Array.isArray(data.newest) ? data.newest : [];
        // Three or nothing.
        setProjects(newest.length >= 3 ? newest.slice(0, 3) : []);
      })
      .catch(() => { /* a home page does not fail because a gallery is quiet */ });
    return () => { live = false; };
  }, []);

  if (!projects.length) return null;

  return (
    <section className="recent" aria-labelledby="recent-title">
      <div className="recent__head">
        <p className="studio-kicker">Published by students</p>
        <h2 id="recent-title">What students have already made</h2>
      </div>

      <ul className="recent__row">
        {projects.map((project) => {
          const name = String(project.creatorName || project.creator_name || '').trim();
          const initial = name ? name[0].toUpperCase() : '?';
          const id = project.publicId || project.public_id;
          return (
            <li key={id}>
              <Link
                className="recent__card"
                to={`/project/${id}`}
                onClick={() => trackEvent('landing_cta_click', 'public-project-build')}
              >
                <span className="recent__type" aria-hidden="true">
                  <Icon name={TYPE_ICON[project.projectType || project.project_type] || 'game'} size={30} strokeWidth={1.5} />
                </span>
                {/* The child's own title, exactly as they typed it. */}
                <strong className="recent__title" title={project.title}>{displayTitle(project.title)}</strong>
                <span className="recent__by">Made by {initial}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        className="recent__more"
        to="/explore"
        onClick={() => trackEvent('landing_cta_click', 'hero-idea')}
      >
        See everything students have published
      </Link>
    </section>
  );
}
