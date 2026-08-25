import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import GUIDE_PAGES from '../../data/guidePages';
import { useSEO } from '../../hooks/useSEO';
import './Guide.css';


export default function GuideIndex() {
  useSEO({
    title: 'Coding Guides for Parents, Teachers & Beginners | CodeIt',
    description:
      'Practical, current guides on choosing coding tools, publishing a first project, and knowing whether a child actually learned anything.',
    canonical: '/guide',
  });

  return (
    <>
      <Header />
      <main className="guide-page">
        <p className="guide-page__kicker">CodeIt guides</p>
        <h1>Straight answers about learning to code.</h1>
        <p>
          Written to be useful whether or not you ever use CodeIt. Several of these recommend
          another tool, because for a lot of readers another tool is the right answer.
        </p>
        <ul className="guide-index__list">
          {GUIDE_PAGES.map((guide) => (
            <li key={guide.slug} className="guide-index__item">
              <h2>
                <Link to={`/guide/${guide.slug}`}>{guide.h1}</Link>
              </h2>
              <p>{guide.description}</p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
