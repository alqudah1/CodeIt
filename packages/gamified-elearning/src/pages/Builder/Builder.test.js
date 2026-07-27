import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Builder from './Builder';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useLocation: () => ({ search: '', state: null }),
    useNavigate: () => mockNavigate,
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
    mockNavigate.mockClear();
    global.fetch = jest.fn((url) => Promise.resolve({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => String(url).includes('/missions')
        ? { missions: [] }
        : {
            html: '<!doctype html><html><head><style>body{font-family:system-ui;background:#fffaf4;color:#432c23;padding:2rem}button{background:#e8692d;color:white;padding:1rem;border:0;border-radius:10px}</style></head><body><h1>My game</h1><p>A working test project with enough real markup to pass the builder validation.</p><button>Play</button><script>window.score = 0;</script></body></html>',
            title: 'My game',
            type: 'game',
            summary: 'A working first version.',
            conceptsUsed: ['variables'],
          },
    }));
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('renders a creator-led first screen and honest trust cues', () => {
    render(<Builder />);

    expect(screen.getByRole('heading', { name: 'Describe it. Build it. Make it yours.' })).toBeInTheDocument();
    expect(screen.getByText('Project studio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build my project' })).toBeDisabled();
    expect(screen.getByRole('region', { name: 'About the project studio' })).toHaveTextContent('Private until published');
    expect(screen.queryByText(/AI Builder/i)).not.toBeInTheDocument();
  });

  test('preserves a guest project before opening the save account gate', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }));

    const draft = JSON.parse(sessionStorage.getItem('codeit_builder_draft'));
    expect(draft.code).toContain('My game');
    expect(draft.projectType).toBe('game');
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  test('preserves a guest project and remembers a request to publish', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Quiz/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(JSON.parse(sessionStorage.getItem('codeit_builder_draft')).code).toContain('My game');
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { from: '/builder', resumeBuilderAction: 'publish' },
    });
  });

  test('moves a first-time guest from creating to personalizing before save becomes primary', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Website/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });

    const personalizeButton = screen.getByRole('button', { name: 'Personalize this project' });
    expect(personalizeButton).toHaveClass('bldr-activation-card__primary');
    expect(screen.getByRole('button', { name: 'Save for later' })).toHaveClass('bldr-activation-card__secondary');

    fireEvent.click(personalizeButton);
    const editInput = screen.getByPlaceholderText(/Describe a change — e.g. make it harder/i);
    fireEvent.change(editInput, { target: { value: 'Change the main color to orange' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply changes' }));

    await screen.findByRole('heading', { name: 'Save this project before you leave.' });
    expect(screen.getByRole('button', { name: 'Save and continue' })).toHaveClass('bldr-activation-card__primary');
    expect(screen.getByRole('button', { name: 'Make another change' })).toBeInTheDocument();
  });
});
