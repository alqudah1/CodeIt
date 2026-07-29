import { render, screen } from '@testing-library/react';
import AIWebsiteBuilderForKids from './AIWebsiteBuilderForKids';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';

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
    expect(screen.getByText(/Managed profiles ages 8–12 stay private/i)).toBeInTheDocument();
  });

  test('ships canonical metadata and answer-ready FAQs', () => {
    render(<AIWebsiteBuilderForKids />);

    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({
      canonical: '/ai-website-builder-for-kids',
      title: expect.stringContaining('AI Website Builder for Kids'),
    }));
    expect(useFAQSchema).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ q: 'What is an AI website builder for kids?' }),
      expect.objectContaining({ q: 'Can a child publish a website publicly?' }),
    ]));
  });
});
