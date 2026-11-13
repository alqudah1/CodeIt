import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import COMPANY from '../../config/company';
import { PRICE_PER_INTERVAL } from '../../config/pricing';
import schoolFacts from '../../data/schoolFacts';
import { useSEO } from '../../hooks/useSEO';
import '../Guide/Guide.css';

// How many children the family plan covers. The server's own figure is
// maxChildProfiles on the top plan in packages/codeit-backend/entitlements.js,
// and Schools.test.js fails if the two ever differ.
export const FAMILY_PLAN_CHILDREN = 4;

/**
 * /schools, for the person at a school who says yes or no.
 *
 * Read by an adult at a desk with a form to fill in, not by a child: it looks
 * like /press and /privacy, not like the lesson map. The words are in
 * src/data/schoolFacts.js, which also explains why three sections are written
 * and not shown yet. The crawlable copy is generated from the same file, so a
 * reviewer who searches and a reviewer who clicks read the same page.
 */
export default function Schools() {
  useSEO({ canonical: '/schools' });

  const facts = schoolFacts({
    contactEmail: COMPANY.contactEmail,
    pricePerInterval: PRICE_PER_INTERVAL,
    maxChildren: FAMILY_PLAN_CHILDREN,
  });

  return (
    <>
      <Header />
      <main className="guide-page">
        <p className="guide-page__kicker">{facts.eyebrow}</p>
        <h1>{facts.h1}</h1>
        <div className="guide-body">
          <p>{facts.intro}</p>

          {facts.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph, index) => (
                // Prose from one authored file, in a fixed order, so the index
                // is a stable key here.
                // eslint-disable-next-line react/no-array-index-key
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}

          <p>{facts.detail}</p>
          <p>
            <a href="/check">Test this computer</a>
            {' · '}
            <a href="/teach">Start a class</a>
            {' · '}
            <a href="/privacy">Privacy and safety</a>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
