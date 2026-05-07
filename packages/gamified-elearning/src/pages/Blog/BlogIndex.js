import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import BLOG_POSTS from '../../data/blogPosts';
import { useSEO } from '../../hooks/useSEO';
import './Blog.css';

const CATEGORY_CLASS = {
  'Learning Guide':  'cat-guide',
  'Games & Puzzles': 'cat-games',
  'Getting Started': 'cat-start',
  'For Parents':     'cat-parents',
};

function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function BlogIndex() {
  useSEO({
    title:       'Blog | CodeIt — Python Learning for Kids',
    description: 'Tips, guides, and resources to help kids learn Python programming. Explore lessons, coding games, and how to start coding as a beginner.',
    canonical:   '/blog',
  });

  const [featured, ...rest] = BLOG_POSTS;
  const catClass = (cat) => CATEGORY_CLASS[cat] || 'cat-guide';

  return (
    <>
      <Header />
      <div className="blog-page">
        <div className="bi-container">

          {/* ── Page header ─────────────────────────────────── */}
          <header className="bi-header">
            <span className="bi-eyebrow">CodeIt Blog</span>
            <h1 className="bi-title">Guides for beginners</h1>
            <p className="bi-sub">
              Tips, tutorials, and Python guides for kids, parents, and anyone
              starting their first coding journey.
            </p>
            <Link to="/journey" className="bi-header-cta">
              Start learning free →
            </Link>
          </header>

          {/* ── Featured post ──────────────────────────────── */}
          <Link
            to={`/blog/${featured.slug}`}
            className={`bi-featured ${catClass(featured.category)}`}
          >
            <div className="bi-featured__band">
              <span className="bi-cat-tag bi-cat-tag--on-band">
                {featured.category}
              </span>
            </div>
            <div className="bi-featured__body">
              <div className="bi-featured__top-meta">
                <time className="bi-meta-date" dateTime={featured.date}>
                  {formatDate(featured.date)}
                </time>
                <span className="bi-meta-dot" aria-hidden="true" />
                <span className="bi-meta-read">{featured.readTime}</span>
              </div>
              <h2 className="bi-featured__title">{featured.title}</h2>
              <p className="bi-featured__excerpt">{featured.excerpt}</p>
              <span className="bi-featured__cta">Read article →</span>
            </div>
          </Link>

          {/* ── Card grid (remaining posts) ──────────────────── */}
          <div className="bi-grid">
            {rest.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className={`bi-card ${catClass(post.category)}`}
              >
                <div className="bi-card__band">
                  <span className="bi-cat-tag bi-cat-tag--on-band">
                    {post.category}
                  </span>
                </div>
                <div className="bi-card__body">
                  <div className="bi-card__meta">
                    <span className="bi-cat-tag">{post.category}</span>
                  </div>
                  <h2 className="bi-card__title">{post.title}</h2>
                  <p className="bi-card__excerpt">{post.excerpt}</p>
                  <div className="bi-card__footer">
                    <time className="bi-meta-date" dateTime={post.date}>
                      {formatDate(post.date)}
                    </time>
                    <span className="bi-meta-dot" aria-hidden="true" />
                    <span className="bi-meta-read">{post.readTime}</span>
                    <span className="bi-card__arrow">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
