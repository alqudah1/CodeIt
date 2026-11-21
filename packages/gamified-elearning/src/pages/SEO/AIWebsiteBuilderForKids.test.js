import { render, screen } from '@testing-library/react';
import AIWebsiteBuilderForKids from './AIWebsiteBuilderForKids';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import PAGE_META from '../../data/pageMeta';
import websiteBuilderPage from '../../data/websiteBuilderPage';
import { FREE_MONTHLY_AI_BUILDS, PRICE_PER_INTERVAL } from '../../config/pricing';

const WORDS = websiteBuilderPage({ pricePerInterval: PRICE_PER_INTERVAL, freeBuilds: FREE_MONTHLY_AI_BUILDS });

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

  test('says what the shared words say, and links to the real builder', () => {
    render(<AIWebsiteBuilderForKids />);

    expect(screen.getByRole('heading', {
      name: 'An AI website builder for kids that teaches the code.',
    })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Build a free project →' })).toHaveAttribute('href', '/builder');
    // Every word of the shared copy is on the page: the eyebrow, the intro,
    // each section's heading and paragraphs, each question and its answer.
    expect(screen.getByText(WORDS.eyebrow)).toBeInTheDocument();
    expect(screen.getByText(WORDS.intro)).toBeInTheDocument();
    expect(WORDS.sections.length).toBeGreaterThanOrEqual(5);
    for (const section of WORDS.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
      for (const paragraph of section.paragraphs) expect(screen.getByText(paragraph)).toBeInTheDocument();
    }
    for (const { q, a } of WORDS.faqs) {
      expect(screen.getByRole('heading', { level: 3, name: q })).toBeInTheDocument();
      expect(screen.getByText(a)).toBeInTheDocument();
    }
    // The price and the free allowance come from config/pricing.js.
    expect(screen.getByText(new RegExp(`includes ${FREE_MONTHLY_AI_BUILDS} AI builds a month\\. Publishing`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`CodeIt Plus is ${PRICE_PER_INTERVAL.replace(/[$/]/g, '\\$&')} and adds`))).toBeInTheDocument();
  });

  test('keeps no words of its own: the old questions, steps and the answer that answered nothing are gone', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.join(__dirname, 'AIWebsiteBuilderForKids.js'), 'utf8');
    expect(source).not.toMatch(/const FAQS\b/);
    expect(source).not.toMatch(/const STEPS\b/);
    render(<AIWebsiteBuilderForKids />);
    expect(screen.queryByText(/depends on current service availability/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/has available credit/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Describe an idea')).not.toBeInTheDocument();
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
    // The questions a search engine is given are the questions on the page.
    expect(useFAQSchema).toHaveBeenCalledWith(WORDS.faqs);
    expect(useFAQSchema).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ q: 'Is there a free website builder for kids?' }),
      expect.objectContaining({ q: 'What ages is it for?' }),
      expect.objectContaining({ q: 'Can my child use it for a school project?' }),
      expect.objectContaining({ q: 'Does it only generate a finished website?' }),
      expect.objectContaining({ q: 'What does the AI see?' }),
    ]));
  });
});
