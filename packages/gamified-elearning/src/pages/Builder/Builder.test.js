import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Builder from './Builder';
import { trackEvent } from '../../utils/trackEvent';
import { AuthContext } from '../../context/AuthContext';

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
jest.mock('../../utils/trackEvent', () => ({
  trackEvent: jest.fn(() => Promise.resolve(true)),
}));

describe('project studio opening', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockNavigate.mockClear();
    trackEvent.mockClear();
    global.fetch = jest.fn((url, options = {}) => {
      const target = String(url);
      let body;
      if (target.includes('/missions')) {
        body = { missions: [] };
      } else if (target.endsWith('/api/builder/projects') && options.method === 'POST') {
        body = {
          success: true,
          project: { id: 99, title: 'My Project', project_type: 'game' },
        };
      } else if (target.includes('/versions')) {
        body = { success: true };
      } else if (target.endsWith('/publish')) {
        body = { success: true, public_id: 'public-99' };
      } else if (target.endsWith('/api/builder/explain')) {
        body = { explanation: 'This project uses variables and click events.' };
      } else {
        body = {
          html: '<!doctype html><html><head><style>body{font-family:system-ui;background:#fffaf4;color:#432c23;padding:2rem}button{background:#e8692d;color:white;padding:1rem;border:0;border-radius:10px}</style></head><body><h1>My game</h1><p>A working test project with enough real markup to pass the builder validation.</p><button>Play</button><script>window.score = 0;</script></body></html>',
          title: 'My game',
          type: 'game',
          summary: 'A working first version.',
          conceptsUsed: ['variables'],
        };
      }
      return Promise.resolve({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => body,
      });
    });
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
    const builderRequest = global.fetch.mock.calls.find(([url]) => url === 'http://codeit.test/api/builder');
    expect(builderRequest[1].headers).toEqual(expect.objectContaining({
      'X-CodeIt-Journey': expect.stringMatching(/^[0-9a-f-]{36}$/i),
    }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  test('keeps the guest save action available in the mobile project controls', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });

    fireEvent.click(screen.getByRole('button', { name: 'Save project to a free account' }));

    expect(JSON.parse(sessionStorage.getItem('codeit_builder_draft')).code).toContain('My game');
    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
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

    const personalizeButton = screen.getByRole('button', { name: 'Choose a color theme' });
    expect(personalizeButton).toHaveClass('bldr-activation-card__primary');
    expect(screen.getByRole('button', { name: 'Save for later' })).toHaveClass('bldr-activation-card__secondary');

    fireEvent.click(personalizeButton);
    expect(screen.getByText('Pick individual colors — updates instantly')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Candy' }));

    await screen.findByRole('heading', { name: 'Save this project before you leave.' });
    expect(screen.getByRole('button', { name: 'Save and continue' })).toHaveClass('bldr-activation-card__primary');
    expect(screen.getByRole('button', { name: 'Make another change' })).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('project_personalize', null, null);
  });

  test('gives a signed-in creator one clear publish step after saving', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 7, name: 'Alex', role: 'student' }, token: 'creator-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Website/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }));

    await screen.findByRole('heading', { name: 'Ready to show someone what you made?' });
    fireEvent.click(screen.getByRole('button', { name: 'Publish and get a link' }));

    await screen.findByRole('heading', { name: 'Invite someone to play it.' });
    expect(trackEvent).toHaveBeenCalledWith('activation_next_step', 'publish', 'creator-token');
    expect(screen.getByRole('button', { name: 'Share your project' })).toBeInTheDocument();
  });

  test('keeps a managed learner private and guides them into learning', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 8, name: 'Sam', role: 'student', managedProfile: true }, token: 'managed-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Quiz/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });
    fireEvent.click(screen.getByRole('button', { name: 'Save for later' }));

    await screen.findByRole('heading', { name: 'Now learn one thing your project uses.' });
    expect(screen.queryByRole('button', { name: 'Publish and get a link' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Learn how it works' }));
    expect(trackEvent).toHaveBeenCalledWith('activation_next_step', 'learn', 'managed-token');
    expect(await screen.findByText('This project uses variables and click events.')).toBeInTheDocument();
  });
});
