import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import { FREE_MONTHLY_AI_BUILDS, PRICE_PER_INTERVAL } from '../../config/pricing';
import websiteBuilderPage from '../../data/websiteBuilderPage';
import './SEOPage.css';

// The words are in src/data/websiteBuilderPage.js, and the crawlable copy the
// static generator writes is made from the same file. This page used to keep
// its own: its own five questions, its own four steps, and an answer to "Is
// it free?" that said generation "depends on current service availability".
// Two copies had drifted until the page a search engine read and the page a
// parent read said different things. There is one now, and the price and the
// free allowance in it come from config/pricing.js.
const PAGE = websiteBuilderPage({
  pricePerInterval: PRICE_PER_INTERVAL,
  freeBuilds: FREE_MONTHLY_AI_BUILDS,
});

export default function AIWebsiteBuilderForKids() {
  useSEO({
    canonical: '/ai-website-builder-for-kids',
  });
  useFAQSchema(PAGE.faqs);

  return (
    <>
      <Header />
      <main className="seo-page">
        <div className="seo-container">
          <Link to="/" className="seo-back">&larr; Back to Home</Link>

          <header className="seo-hero">
            <span className="seo-eyebrow">{PAGE.eyebrow}</span>
            <h1 className="seo-h1">{PAGE.h1}</h1>
            <p className="seo-hero-desc">{PAGE.intro}</p>
            <Link to="/builder" className="seo-cta-btn">Build a free project →</Link>
          </header>

          <article className="seo-body">
            {PAGE.sections.map((section) => (
              <section className="seo-section" key={section.heading}>
                <h2 className="seo-h2">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p className="seo-p" key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}

            <section className="seo-section">
              <h2 className="seo-h2">Questions parents and educators ask</h2>
              <div className="seo-faq" itemScope itemType="https://schema.org/FAQPage">
                {PAGE.faqs.map(({ q, a }) => (
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
            <Link to="/builder" className="seo-cta-btn">Open the studio →</Link>
          </section>

          <nav className="seo-related" aria-label="Related CodeIt pages">
            <h2>Keep exploring</h2>
            <div className="seo-related__links">
              <Link to="/coding-for-kids" className="seo-related__link">Coding for Kids</Link>
              <Link to="/learn-python-for-kids" className="seo-related__link">Learn Python for Kids</Link>
              <Link to="/explore" className="seo-related__link">Project Gallery</Link>
              <Link to="/lessons" className="seo-related__link">Python lessons</Link>
              <Link to="/playground" className="seo-related__link">Python playground</Link>
              <Link to="/privacy" className="seo-related__link">Privacy &amp; Safety</Link>
              <Link to="/pricing" className="seo-related__link">Pricing</Link>
              <Link to="/guide/ai-builder-you-can-edit" className="seo-related__link">Guide: AI builders you can edit</Link>
              <Link to="/guide/what-did-my-kid-learn" className="seo-related__link">Guide: What did my kid actually learn?</Link>
            </div>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
