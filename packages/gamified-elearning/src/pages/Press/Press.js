import Header from '../Header/Header';
import COMPANY from '../../config/company';
import { PRICE_PER_INTERVAL, FREE_MONTHLY_AI_BUILDS } from '../../config/pricing';
import { TOTAL_LESSONS } from '../Lessons/lessonRegistry';
import pressFacts from '../../data/pressFacts';
import { useSEO } from '../../hooks/useSEO';
import '../Guide/Guide.css';

/**
 * /press, for people who might write about CodeIt.
 *
 * The page existed as crawlable HTML months before it existed for a person.
 * There was no route here, and App.js sends every unmatched path to the
 * homepage, so a journalist arriving from a search result was redirected away
 * from the page they clicked on. This is that half.
 *
 * Both halves render from src/data/pressFacts.js. The numbers come from config
 * and the curriculum rather than being typed, because the whole purpose of this
 * page is that somebody can quote a figure without asking whether it is current.
 */
export default function Press() {
  useSEO({ canonical: '/press' });

  const facts = pressFacts({
    locationLine: COMPANY.locationLine(),
    founderName: COMPANY.founderName,
    contactEmail: COMPANY.contactEmail,
    url: COMPANY.url,
    primaryAlternateName: COMPANY.alternateNames[0],
    sameAs: COMPANY.sameAs,
    pricePerInterval: PRICE_PER_INTERVAL,
    freeMonthlyAiBuilds: FREE_MONTHLY_AI_BUILDS,
    lessonCount: TOTAL_LESSONS,
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
                // Paragraphs are prose from one authored file, in a fixed order,
                // so the index is a stable key here.
                // eslint-disable-next-line react/no-array-index-key
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}

          <p>{facts.detail}</p>
        </div>
      </main>
    </>
  );
}
