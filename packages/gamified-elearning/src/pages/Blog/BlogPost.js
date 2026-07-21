import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import BLOG_POSTS from '../../data/blogPosts';
import { useSEO } from '../../hooks/useSEO';
import './Blog.css';

const BASE_URL = 'https://codeitlearn.com';

// ── JSON-LD Article schema ────────────────────────────────────────────────────
function useArticleJsonLd(post) {
  useEffect(() => {
    if (!post) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id   = 'article-jsonld';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline:    post.title,
      description: post.description,
      url:         `${BASE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      dateModified:  post.date,
      author: {
        '@type': 'Organization',
        name: 'CodeIt',
        url:  BASE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name:    'CodeIt',
        url:     BASE_URL,
        logo: {
          '@type': 'ImageObject',
          url:    `${BASE_URL}/brand/og-image.png`,
          width:  1200,
          height: 630,
        },
      },
      image: `${BASE_URL}/brand/og-image.png`,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id':   `${BASE_URL}/blog/${post.slug}`,
      },
      keywords: post.description,
    });

    // Remove any previous instance before inserting
    document.getElementById('article-jsonld')?.remove();
    document.head.appendChild(script);

    return () => { document.getElementById('article-jsonld')?.remove(); };
  }, [post]);
}

// ── Detect code blocks ────────────────────────────────────────────────────────
function isCodeLine(text) {
  return (
    /^(print|for |if |def |import |#|[a-z_]+\(|[a-z_]+ =)/.test(text.trim()) ||
    text.includes('\n    ')
  );
}

// ── Pick related posts (same category first, then any, max 2) ─────────────────
function getRelatedPosts(current) {
  const sameCategory = BLOG_POSTS.filter(
    (p) => p.slug !== current.slug && p.category === current.category
  );
  const others = BLOG_POSTS.filter(
    (p) => p.slug !== current.slug && p.category !== current.category
  );
  return [...sameCategory, ...others].slice(0, 2);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BlogPost() {
  const { slug }   = useParams();
  const navigate   = useNavigate();
  const post       = BLOG_POSTS.find((p) => p.slug === slug);
  const related    = post ? getRelatedPosts(post) : [];

  useSEO({
    title:       post ? `${post.title} | CodeIt Blog` : 'Post Not Found | CodeIt Blog',
    description: post?.description || 'Python coding tips and guides for kids on the CodeIt blog.',
    canonical:   post ? `/blog/${slug}` : '/blog',
  });

  useArticleJsonLd(post);

  // ── 404 ──────────────────────────────────────────────────────────────────
  if (!post) {
    return (
      <>
        <Header />
        <div className="blog-page">
          <div className="blog-container">
            <button className="blog-back" onClick={() => navigate('/blog')}>
              &larr; Back to Blog
            </button>
            <div className="blog-notfound">
              <h2>Post not found</h2>
              <p>This article doesn't exist. <Link to="/blog">Browse all articles</Link>.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Post ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <div className="blog-page">
        <div className="blog-container">

          {/* ── Breadcrumb ───────────────────────────────────── */}
          <nav className="blog-breadcrumb" aria-label="Breadcrumb">
            <Link to="/"    className="blog-breadcrumb__item">Home</Link>
            <span className="blog-breadcrumb__sep" aria-hidden="true">/</span>
            <Link to="/blog" className="blog-breadcrumb__item">Blog</Link>
            <span className="blog-breadcrumb__sep" aria-hidden="true">/</span>
            <span className="blog-breadcrumb__item blog-breadcrumb__item--current" aria-current="page">
              {post.title}
            </span>
          </nav>

          <article className="blog-post__container">

            {/* ── Post header ──────────────────────────────── */}
            <header className="blog-post__header">
              <div className="blog-post__meta">
                <span className="blog-post__category">{post.category}</span>
                <span className="blog-post__date">{post.date}</span>
                <span className="blog-post__read-time">{post.readTime}</span>
              </div>

              {/* H1 — primary keyword target */}
              <h1 className="blog-post__title">{post.title}</h1>
              <p className="blog-post__excerpt">{post.excerpt}</p>

              {/* Always-present internal links — homepage + journey */}
              <div className="blog-post__nav-links">
                <Link to="/"        className="blog-post__nav-link">CodeIt Home</Link>
                <Link to="/journey" className="blog-post__nav-link">Start the Python Journey</Link>
                <Link to="/lessons" className="blog-post__nav-link">Free Python Lessons</Link>
              </div>
            </header>

            <hr className="blog-post__divider" />

            {/* ── Content body ─────────────────────────────── */}
            <div className="blog-post__body">
              {post.sections.map((section, si) => (
                <section key={si} className="blog-post__section">
                  <h2 className="blog-post__section-heading">{section.heading}</h2>
                  {section.body.map((para, pi) => (
                    <p
                      key={pi}
                      className={`blog-post__para${isCodeLine(para) ? ' blog-post__para--code' : ''}`}
                    >
                      {para}
                    </p>
                  ))}
                </section>
              ))}
            </div>

            {/* ── Universal "Start Your Journey" CTA ───────── */}
            <div className="blog-post__journey-cta">
              <div className="blog-post__journey-cta__inner">
                <span className="blog-post__journey-cta__eyebrow">Ready to start coding?</span>
                <h2 className="blog-post__journey-cta__heading">
                  Start your coding journey with CodeIt
                </h2>
                <p className="blog-post__journey-cta__sub">
                  Free interactive Python lessons, coding puzzles, and quizzes — built for kids and beginners.
                  No experience needed, nothing to install.
                </p>
                <div className="blog-post__journey-cta__actions">
                  <Link to="/journey" className="blog-post__journey-cta__btn blog-post__journey-cta__btn--primary">
                    Start Learning Free &rarr;
                  </Link>
                  <Link to="/lesson/1" className="blog-post__journey-cta__btn blog-post__journey-cta__btn--secondary">
                    Try Lesson 1 Now
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Per-post CTA (if defined in data) ────────── */}
            {post.cta && (
              <div className="blog-post__cta">
                <p className="blog-post__cta-text">{post.cta.text}</p>
                <Link to={post.cta.link} className="blog-post__cta-btn">
                  {post.cta.text} &rarr;
                </Link>
              </div>
            )}

            {/* ── Related Posts ─────────────────────────────── */}
            {related.length > 0 && (
              <aside className="blog-post__related-posts" aria-label="Related articles">
                <h2 className="blog-post__related-posts__heading">Related Articles</h2>
                <div className="blog-post__related-posts__grid">
                  {related.map((rp) => (
                    <Link
                      key={rp.slug}
                      to={`/blog/${rp.slug}`}
                      className="blog-post__related-card"
                    >
                      <div className="blog-post__related-card__meta">
                        <span className="blog-post__related-card__cat">{rp.category}</span>
                        <span className="blog-post__related-card__time">{rp.readTime}</span>
                      </div>
                      <h3 className="blog-post__related-card__title">{rp.title}</h3>
                      <p className="blog-post__related-card__excerpt">{rp.excerpt}</p>
                      <span className="blog-post__related-card__arrow">Read article &rarr;</span>
                    </Link>
                  ))}
                </div>
              </aside>
            )}

            {/* ── Internal "Explore on CodeIt" links ───────── */}
            {post.relatedLinks && post.relatedLinks.length > 0 && (
              <nav className="blog-post__related" aria-label="Related pages">
                <p className="blog-post__related-title">Explore on CodeIt</p>
                <div className="blog-post__related-links">
                  {post.relatedLinks.map((link, li) => (
                    <Link key={li} to={link.link} className="blog-post__related-link">
                      {link.text} &rarr;
                    </Link>
                  ))}
                </div>
              </nav>
            )}

          </article>
        </div>
      </div>
    </>
  );
}
