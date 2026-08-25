import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import GUIDE_PAGES from '../../data/guidePages';
import markdownToHtml from '../../utils/markdown';
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
