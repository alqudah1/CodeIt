import { fireEvent, render, screen } from '@testing-library/react';
import CodingForKids from './CodingForKids';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import { trackEvent } from '../../utils/trackEvent';

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
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

describe('parent acquisition page', () => {
  beforeEach(() => {
    useSEO.mockClear();
    useFAQSchema.mockClear();
    trackEvent.mockClear();
  });

  test('opens with a concrete project and honest trust commitments', () => {
    render(<CodingForKids />);

    expect(screen.getByRole('heading', { name: 'A first coding project they’ll want to keep improving.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Try a project together' })).toHaveAttribute('href', '/builder');
    expect(screen.getByText('Saved projects stay private until Publish.')).toBeInTheDocument();
    expect(screen.getByText('New student accounts are for ages 13–18.')).toBeInTheDocument();
    expect(screen.queryByText(/ages 8–14/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/everything is free/i)).not.toBeInTheDocument();
  });

  test('offers a user-initiated pilot email without a collection form', () => {
    render(<CodingForKids />);

    const pilotLink = screen.getByRole('link', { name: 'Ask about the pilot' });
    expect(pilotLink.getAttribute('href')).toMatch(/^mailto:hello@codeitlearn\.com/);
    expect(screen.getByText(/does not save your address on this page/i)).toBeInTheDocument();
    expect(document.querySelector('form')).not.toBeInTheDocument();
    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ canonical: '/coding-for-kids' }));
    expect(useFAQSchema).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ q: 'What age is CodeIt for?' }),
    ]));

    fireEvent.click(pilotLink);
    expect(trackEvent).toHaveBeenCalledWith('parent_cta_click', 'pilot-email');
  });
});
