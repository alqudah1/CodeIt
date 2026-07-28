import { render } from '@testing-library/react';
import { useSEO } from './useSEO';

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
