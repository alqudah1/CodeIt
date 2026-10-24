import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { canonicalPath, useSEO } from './useSEO';

function NoIndexPage() {
  useSEO({
    title: 'Private creator brief',
    canonical: '/creator-brief',
    robots: 'noindex,nofollow',
  });
  return null;
}

test('marks unlisted pages as noindex and restores the public default on cleanup', () => {
  const { unmount } = render(<NoIndexPage />);

  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://codeitlearn.com/creator-brief'
  );

  unmount();
  expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
});

// Found live on 24 October 2026: /build, an indexed page, declared its
// canonical as "https://codeitlearn.comhttps//codeitlearn.com/build", because
// ten pages passed the full address and the hook glued the site onto it.
test('a full address and a path give the same canonical, never the site twice', () => {
  expect(canonicalPath('https://codeitlearn.com/build')).toBe('/build');
  expect(canonicalPath('https://www.codeitlearn.com/teach/plans/loops')).toBe('/teach/plans/loops');
  expect(canonicalPath('/build')).toBe('/build');
  expect(canonicalPath(undefined)).toBe('/');
  function FullAddress() { useSEO({ canonical: 'https://codeitlearn.com/build' }); return null; }
  render(<FullAddress />);
  expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://codeitlearn.com/build');
  expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content', 'https://codeitlearn.com/build');
  // The shared title applies, because the lookup is by path.
  expect(document.title).toBe('Build a Game From One Sentence | CodeIt');
});

test('pages pass a path, so the next page written by copying one does too', () => {
  const pages = path.join(__dirname, '..', 'pages');
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.js$/.test(entry.name) && !/\.test\.js$/.test(entry.name)) {
        if (/canonical:\s*[`'"]https?:/.test(fs.readFileSync(full, 'utf8'))) offenders.push(path.relative(pages, full));
      }
    }
  };
  walk(pages);
  expect(offenders).toEqual([]);
});
