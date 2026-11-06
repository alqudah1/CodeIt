import { render, screen } from '@testing-library/react';
import Go from './Go';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ token: null }) }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

const { useSEO } = require('../../hooks/useSEO');

test('one promise, three real screens, the price, one button to the family sign-up', () => {
  render(<Go />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Python in your pocket.Like a game.');
  const starts = screen.getAllByRole('link', { name: 'Set up my child, free' });
  expect(starts).toHaveLength(2);
  starts.forEach((a) => expect(a).toHaveAttribute('href', '/register?for=family&from=go'));
  expect(screen.getByRole('link', { name: 'Or let them try the map first' })).toHaveAttribute('href', '/lessons');
  expect(screen.getAllByRole('img')).toHaveLength(3);
  expect(screen.getByText(/CA\$12 a month/)).toBeInTheDocument();
  expect(screen.getByText(/Nothing is sold to your child/)).toBeInTheDocument();
  expect(useSEO).toHaveBeenCalledWith(expect.objectContaining({ canonical: '/go', robots: 'noindex,follow' }));
  expect(document.body.textContent).not.toMatch(/—/);
});
