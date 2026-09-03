import fs from 'fs';
import path from 'path';
import BLOG_POSTS from './data/blogPosts';
import GUIDE_PAGES from './data/guidePages';
import { TOTAL_LESSONS } from './pages/Lessons/lessonRegistry';

// ── Every internal link must go somewhere ────────────────────────────────────
//
// Round 77 added fourteen links from the blog posts into the guides and pointed
// every one of them at /blog/<slug>. The guides live at /guide/<slug>. All
// fourteen landed on "Post not found", which is worse than not linking at all:
// it tells a reader the site is broken, and it tells a crawler the same.
//
// The smoke run did not catch it either, because it was checking the guides at
// the same wrong prefix, and a not-found page is a page with words on it. Two
// tools, one assumption, no coverage.
//
// This walks the links in the app's own data and in the SEO pages and resolves
// each one against the real routes.
const SRC = __dirname;
const APP = fs.readFileSync(path.join(SRC, 'App.js'), 'utf8');

const staticRoutes = new Set(
  [...APP.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map(m => m[1])
    .filter(p => !p.includes(':') && p !== '*')
);
const guideSlugs = new Set(GUIDE_PAGES.map(g => g.slug));
const postSlugs = new Set(BLOG_POSTS.map(p => p.slug));

function resolves(href) {
  const url = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  if (staticRoutes.has(url)) return true;
  if (url.startsWith('/guide/')) return guideSlugs.has(url.slice(7));
  if (url.startsWith('/blog/')) return postSlugs.has(url.slice(6));
  if (/^\/lesson\/\d+$/.test(url)) {
    const id = Number(url.split('/')[2]);
    return id >= 1 && id <= TOTAL_LESSONS;
  }
  if (/^\/quiz\/\d+$/.test(url)) return true;
  if (/^\/journey\/puzzle\//.test(url)) return true;
  if (/^\/project\//.test(url)) return true;
  return false;
}

describe('internal links', () => {
  test('the route list was actually read', () => {
    expect(staticRoutes.size).toBeGreaterThan(20);
    expect(guideSlugs.size).toBeGreaterThan(10);
  });

  test('every related link on every blog post resolves', () => {
    const broken = [];
    for (const post of BLOG_POSTS) {
      for (const link of post.relatedLinks || []) {
        if (!resolves(link.link)) broken.push(`${post.slug} -> ${link.link}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('a guide is linked as /guide, never as /blog', () => {
    // The exact mistake, named, because it is the one a person makes when the
    // two kinds of article read the same on the page.
    const wrong = [];
    for (const post of BLOG_POSTS) {
      for (const link of post.relatedLinks || []) {
        const slug = link.link.startsWith('/blog/') ? link.link.slice(6) : null;
        if (slug && guideSlugs.has(slug)) wrong.push(`${post.slug} -> ${link.link}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  test('every Link in the SEO pages resolves', () => {
    const dir = path.join(SRC, 'pages', 'SEO');
    const broken = [];
    for (const file of fs.readdirSync(dir).filter(f => /\.jsx?$/.test(f) && !/\.test\./.test(f))) {
      const text = fs.readFileSync(path.join(dir, file), 'utf8');
      for (const match of text.matchAll(/<Link\s+to="(\/[^"]*)"/g)) {
        if (!resolves(match[1])) broken.push(`${file} -> ${match[1]}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test('the guides are reachable from more than their own index', () => {
    // An orphan page is one a crawler can only find from /guide. Every guide
    // does not have to be linked, but the set has to be genuinely entered from
    // the pages that already rank.
    const linked = new Set();
    for (const post of BLOG_POSTS) {
      for (const link of post.relatedLinks || []) {
        if (link.link.startsWith('/guide/')) linked.add(link.link.slice(7));
      }
    }
    expect(linked.size).toBeGreaterThanOrEqual(8);
  });
});
