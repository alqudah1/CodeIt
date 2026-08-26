import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import FAQS from '../../data/faqs';
import { useSEO } from '../../hooks/useSEO';
import '../Guide/Guide.css';

const BASE_URL = 'https://codeitlearn.com';

function useFaqPageJsonLd() {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-page-jsonld';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${BASE_URL}/faq#faq`,
      mainEntity: FAQS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
    document.getElementById('faq-page-jsonld')?.remove();
    document.head.appendChild(script);
    return () => script.remove();
  }, []);
}

export default function Faq() {
  useSEO({
    canonical: '/faq',
  });
  useFaqPageJsonLd();

  return (
    <>
      <Header />
      <main className="guide-page">
        <p className="guide-page__kicker">Questions</p>
        <h1>Questions parents ask first</h1>
        <div className="guide-body">
          <p>
            Including the ones with awkward answers. If something here is out of date, it is a bug —
            tell us.
          </p>
          {FAQS.map(({ q, a }) => (
            <section key={q}>
              <h2>{q}</h2>
              <p>{a}</p>
            </section>
          ))}
        </div>
        <nav className="guide-page__nav" aria-label="Continue on CodeIt">
          <Link to="/about">About CodeIt</Link>
          <Link to="/guide">Guides</Link>
          <Link to="/pricing">Free access</Link>
          <Link to="/builder">Build a project</Link>
        </nav>
      </main>
    </>
  );
}
