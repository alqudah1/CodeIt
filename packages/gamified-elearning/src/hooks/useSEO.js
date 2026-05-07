import { useEffect } from 'react';

const BASE_URL = 'https://www.codeitlearn.com';

const DEFAULT_IMAGE = 'https://codeitlearn.com/brand/og-image.png';

const DEFAULTS = {
  title:       'Learn Python for Beginners | Coding Games for Kids | CodeIt',
  description: 'CodeIt helps kids and beginners learn Python through fun coding games, interactive lessons, quizzes, and coding puzzles.',
  canonical:   '/',
  image:       DEFAULT_IMAGE,
};

/**
 * useSEO — sets per-page title, meta description, canonical URL, OG tags, and Twitter Card tags.
 *
 * Usage:
 *   useSEO({
 *     title:       'Journey | CodeIt',
 *     description: 'Track your Python progress...',
 *     canonical:   '/journey',   // path only — BASE_URL prepended automatically
 *     image:       '/brand/og-image.png',  // optional, defaults to og-image.png
 *   });
 *
 * All parameters are optional; omitting one leaves the index.html default in place.
 * Tags are restored to defaults on unmount so stale values never bleed across routes.
 */
export function useSEO({ title, description, canonical, image } = {}) {
  useEffect(() => {
    const resolvedTitle       = title       ?? DEFAULTS.title;
    const resolvedDescription = description ?? DEFAULTS.description;
    const resolvedCanonical   = canonical   ?? DEFAULTS.canonical;
    const resolvedImage       = image
      ? (image.startsWith('http') ? image : `${BASE_URL}${image}`)
      : DEFAULTS.image;
    const fullUrl             = `${BASE_URL}${resolvedCanonical}`;

    // ── <title> ───────────────────────────────────────────────────
    document.title = resolvedTitle;

    // ── <meta name="description"> ─────────────────────────────────
    setMeta('name', 'description', resolvedDescription);

    // ── <link rel="canonical"> ────────────────────────────────────
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = fullUrl;

    // ── Open Graph ────────────────────────────────────────────────
    setMeta('property', 'og:title',       resolvedTitle);
    setMeta('property', 'og:description', resolvedDescription);
    setMeta('property', 'og:url',         fullUrl);
    setMeta('property', 'og:image',       resolvedImage);

    // ── Twitter Card ──────────────────────────────────────────────
    setMeta('name', 'twitter:title',       resolvedTitle);
    setMeta('name', 'twitter:description', resolvedDescription);
    setMeta('name', 'twitter:image',       resolvedImage);

    // ── Restore defaults on unmount ───────────────────────────────
    return () => {
      document.title = DEFAULTS.title;
      setMeta('name', 'description',        DEFAULTS.description);
      const link = document.querySelector('link[rel="canonical"]');
      if (link) link.href = `${BASE_URL}${DEFAULTS.canonical}`;
      setMeta('property', 'og:title',       DEFAULTS.title);
      setMeta('property', 'og:description', DEFAULTS.description);
      setMeta('property', 'og:url',         `${BASE_URL}${DEFAULTS.canonical}`);
      setMeta('property', 'og:image',       DEFAULTS.image);
      setMeta('name', 'twitter:title',       DEFAULTS.title);
      setMeta('name', 'twitter:description', DEFAULTS.description);
      setMeta('name', 'twitter:image',       DEFAULTS.image);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, image]);
}

function setMeta(attrName, attrValue, content) {
  const el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (el) el.setAttribute('content', content);
}
