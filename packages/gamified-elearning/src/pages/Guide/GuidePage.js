import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import GUIDE_PAGES from '../../data/guidePages';
import markdownToHtml from '../../utils/markdown';
import { getLessonEntry } from '../Lessons/lessonRegistry';
import { useSEO } from '../../hooks/useSEO';
import './Guide.css';

const BASE_URL = 'https://codeitlearn.com';

function useGuideJsonLd(guide) {
  useEffect(() => {
    if (!guide) return undefined;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'guide-jsonld';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.h1,
      description: guide.description,
      url: `${BASE_URL}/guide/${guide.slug}`,
      datePublished: guide.lastVerified,
      dateModified: guide.lastVerified,
      author: { '@id': `${BASE_URL}/#organization` },
      publisher: { '@id': `${BASE_URL}/#organization` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE_URL}/guide/${guide.slug}` },
    });

    document.getElementById('guide-jsonld')?.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, [guide]);
}

export default function GuidePage() {
  const { slug } = useParams();
  const guide = GUIDE_PAGES.find((entry) => entry.slug === slug);

  useSEO({
    title: guide ? guide.title : 'Guide not found | CodeIt',
    description: guide ? guide.description : 'This guide could not be found.',
    canonical: guide ? `/guide/${guide.slug}` : '/guide',
  });
  useGuideJsonLd(guide);

  const body = useMemo(() => (guide ? markdownToHtml(guide.markdown) : ''), [guide]);

  // An id that does not resolve is dropped rather than rendered as a broken
  // link. A guide pointing at a lesson that no longer exists would be a 404
  // handed to the crawler this whole change exists to attract.
  const relatedLessons = useMemo(() => (guide?.relatedLessons || [])
    .map(id => {
      const entry = getLessonEntry(id);
      return entry ? { id, title: entry.data?.title || entry.seoTitle || `Lesson ${id}` } : null;
    })
    .filter(Boolean), [guide]);

  if (!guide) {
    return (
      <>
        <Header />
        <main className="guide-page">
          <h1>We could not find that guide.</h1>
          <p>It may have been renamed. <Link to="/guide">See all guides</Link>.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="guide-page">
        <nav aria-label="Breadcrumb" className="guide-page__kicker">
          <Link to="/">Home</Link> / <Link to="/guide">Guides</Link>
        </nav>
        <h1>{guide.h1}</h1>
        <p className="guide-page__meta">
          <time dateTime={guide.lastVerified}>Last verified {guide.lastVerified}</time>
        </p>
        {/* Content is authored by us in this repo, not user input. */}
        <div className="guide-body" dangerouslySetInnerHTML={{ __html: body }} />
        {/* ── The lessons behind this guide ────────────────────────────────
            The sixteen guides are the pages Google actually crawls, and across
            all sixteen bodies there were four internal links and not one of
            them pointed at a lesson. Meanwhile eighteen of the thirty-one
            lesson pages sat in "Discovered - currently not indexed", and
            /lesson/1 reported no crawl at all, despite being footer-linked and
            first in the sequence. The lesson pages are fine. Google simply had
            no reason to walk to them.

            This is the cheap half of that problem and the half we control.
            Authority comes from citations on sites we do not own, and this
            will not fix indexing by itself; it points the crawl budget we
            already have at the pages currently getting none.

            Ids only in the data file. The title is read from the lesson
            registry here, so a renamed lesson cannot leave a stale label
            behind on a guide. Two of the labels in the original mapping were
            already out of date when it was written, which is the argument. */}
        {relatedLessons.length > 0 && (
          <aside className="guide-related" aria-labelledby="guide-related-title">
            <h2 id="guide-related-title" className="guide-related__title">The lessons behind this guide</h2>
            <ul className="guide-related__list">
              {relatedLessons.map(lesson => (
                <li key={lesson.id}>
                  <Link to={`/lesson/${lesson.id}`}>
                    <span className="guide-related__num">Lesson {lesson.id}</span>
                    <span className="guide-related__name">{lesson.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <nav className="guide-page__nav" aria-label="Continue on CodeIt">
          <Link to="/guide">All guides</Link>
          <Link to="/builder">Build a project</Link>
          <Link to="/lessons">Browse lessons</Link>
          <Link to="/coding-for-kids">Parent guide</Link>
        </nav>
      </main>
    </>
  );
}
