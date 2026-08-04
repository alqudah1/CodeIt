import { render, screen } from '@testing-library/react';
import InvestorBrief from './InvestorBrief';
import { useSEO } from '../../hooks/useSEO';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
}, { virtual: true });
jest.mock('../../components/BrandLogo/BrandLogo', () => (props) => <img alt="CodeIt" {...props} />);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

describe('InvestorBrief', () => {
  beforeEach(() => useSEO.mockClear());

  test('is unlisted and states the current stage honestly', () => {
    render(<InvestorBrief />);

    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({
      canonical: '/investor-brief',
      robots: 'noindex,nofollow',
    }));
    expect(screen.getByText('Working product, pre-revenue validation')).toBeInTheDocument();
    expect(screen.getByText(/does not yet claim paying customers/i)).toBeInTheDocument();
  });

  test('explains the audience, business hypothesis, and validation needs', () => {
    render(<InvestorBrief />);

    expect(screen.getByText(/creative coding studio for young people ages 5–18/i)).toBeInTheDocument();
    expect(screen.getByText('US$12 per month')).toBeInTheDocument();
    expect(screen.getByText(/Billing is not live yet/i)).toBeInTheDocument();
    expect(screen.getByText('144,275')).toBeInTheDocument();
    expect(screen.getByText(/not verified paying customers/i)).toBeInTheDocument();
    expect(screen.getByText(/did not record login events/i)).toBeInTheDocument();
    expect(screen.getByText('Validation still required')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Try the product/i })).toHaveAttribute('href', '/builder');
  });
});
