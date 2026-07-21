import { render, screen } from '@testing-library/react';
import Builder from './Builder';

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useLocation: () => ({ search: '', state: null }),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
jest.mock('../../context/CharacterContext', () => ({
  useCharacter: () => ({ awardXP: jest.fn() }),
}));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

describe('project studio opening', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('renders a creator-led first screen and honest trust cues', () => {
    render(<Builder />);

    expect(screen.getByRole('heading', { name: 'Describe it. Build it. Make it yours.' })).toBeInTheDocument();
    expect(screen.getByText('Project studio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build my project' })).toBeDisabled();
    expect(screen.getByRole('region', { name: 'About the project studio' })).toHaveTextContent('Private until published');
    expect(screen.queryByText(/AI Builder/i)).not.toBeInTheDocument();
  });
});
