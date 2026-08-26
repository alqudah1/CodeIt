import { render, screen } from '@testing-library/react';
import AIWebsiteBuilderForKids from './AIWebsiteBuilderForKids';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import PAGE_META from '../../data/pageMeta';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../hooks/useFAQSchema', () => ({ useFAQSchema: jest.fn() }));

describe('AI website builder landing page', () => {
  beforeEach(() => {
    useSEO.mockClear();
    useFAQSchema.mockClear();
  });

  test('explains the make-edit-learn difference and links to the real builder', () => {
    render(<AIWebsiteBuilderForKids />);

    expect(screen.getByRole('heading', {
      name: 'An AI website builder for kids that teaches the code.',
    })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Build a free project →' })).toHaveAttribute('href', '/builder');
    expect(screen.getByText(/Enhanced AI generation works when CodeIt's AI service has available credit/i)).toBeInTheDocument();
    expect(screen.getByText(/Managed profiles ages 5 to 12 stay private/i)).toBeInTheDocument();
  });

  test('ships canonical metadata and answer-ready FAQs', () => {
    render(<AIWebsiteBuilderForKids />);

    // The page passes its canonical and nothing else. Titles and descriptions
    // moved into src/data/pageMeta.js so the static generator and the runtime
    // read the same one and cannot drift apart — so the title is checked where
    // it now lives, rather than where it used to be passed.
    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({
      canonical: '/ai-website-builder-for-kids',
    }));
    expect(PAGE_META['/ai-website-builder-for-kids'].title)
      .toEqual(expect.stringContaining('AI Website Builder for Kids'));
    expect(PAGE_META['/ai-website-builder-for-kids'].description.length)
      .toBeGreaterThan(70);
    expect(useFAQSchema).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ q: 'What is an AI website builder for kids?' }),
      expect.objectContaining({ q: 'Can a child publish a website publicly?' }),
    ]));
  });
});
