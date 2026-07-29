import { render, screen } from '@testing-library/react';
import Privacy from './Privacy';
import Terms from './Terms';
import { useSEO } from '../../hooks/useSEO';

jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

describe('trust pages', () => {
  beforeEach(() => useSEO.mockClear());

  test('renders the current privacy and child-safety commitments', () => {
    render(<Privacy />);

    expect(screen.getByRole('heading', { name: 'Clear information about what CodeIt collects—and why.' })).toBeInTheDocument();
    expect(screen.getByText('Projects are private by default')).toBeInTheDocument();
    expect(screen.getByText(/does not claim that email confirmation alone proves legal identity/i)).toBeInTheDocument();
    expect(screen.getByText(/does not collect a child email address/i)).toBeInTheDocument();
    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ canonical: '/privacy' }));
  });

  test('renders account, publishing, and payment terms', () => {
    render(<Terms />);

    expect(screen.getByRole('heading', { name: 'Build freely. Learn responsibly. Keep people safe.' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Eligibility and younger learners' })).toBeInTheDocument();
    expect(screen.getByText(/Managed younger profiles cannot publish projects publicly/i)).toBeInTheDocument();
    expect(screen.getByText(/No subscription starts from an interest button/i)).toBeInTheDocument();
    expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ canonical: '/terms' }));
  });
});
