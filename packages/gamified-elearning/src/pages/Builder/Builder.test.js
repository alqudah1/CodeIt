import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Builder from './Builder';
import { trackEvent } from '../../utils/trackEvent';
import { AuthContext } from '../../context/AuthContext';
import {
  GUEST_PROJECT_DRAFT_KEY,
  GUEST_PROJECT_DRAFT_TTL_MS,
  saveGuestProjectDraft,
} from '../../utils/guestProjectDraft';

const mockNavigate = jest.fn();
const mockBuilderLocation = { search: '', state: null };

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useLocation: () => mockBuilderLocation,
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
    window.scrollTo = jest.fn();
    localStorage.clear();
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockBuilderLocation.search = '';
    mockBuilderLocation.state = null;
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

  test('welcomes a new account directly into a savable first project', () => {
    mockBuilderLocation.search = '?welcome=1';
    render(
      <AuthContext.Provider value={{ user: { id: 17, name: 'New Coder', role: 'Student' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Your account is ready.');
    expect(screen.getByRole('status')).toHaveTextContent('Your first saved project will stay in this account.');
    expect(screen.getByRole('button', { name: /Build a Game/i })).toBeInTheDocument();
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
    expect(mockNavigate).toHaveBeenCalledWith('/register?from=builder&action=save', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
    expect(trackEvent).toHaveBeenCalledWith('activation_account_gate', 'save', null);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  test('keeps the guest save action available in the mobile project controls', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });

    fireEvent.click(screen.getByRole('button', { name: 'Save project to a free account' }));

    expect(JSON.parse(sessionStorage.getItem('codeit_builder_draft')).code).toContain('My game');
    expect(mockNavigate).toHaveBeenCalledWith('/register?from=builder&action=save', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
  });

  test('preserves a guest project and remembers a request to publish', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Quiz/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(JSON.parse(sessionStorage.getItem('codeit_builder_draft')).code).toContain('My game');
    expect(mockNavigate).toHaveBeenCalledWith('/register?from=builder&action=publish', {
      state: { from: '/builder', resumeBuilderAction: 'publish' },
    });
    expect(trackEvent).toHaveBeenCalledWith('activation_account_gate', 'publish', null);
  });

  test('moves a first-time guest from creating to personalizing before save becomes primary', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Website/i }));
    const nextStepHeading = await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });
    const projectPreview = screen.getByTitle('Project preview');

    expect(projectPreview.compareDocumentPosition(nextStepHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole('group', { name: 'Choose a color theme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save for later' })).toHaveClass('bldr-activation-card__secondary');

    fireEvent.click(screen.getByRole('button', { name: 'Apply Candy theme' }));

    await screen.findByRole('heading', { name: 'Save this project before you leave.' });
    expect(screen.getByRole('button', { name: 'Save and continue' })).toHaveClass('bldr-activation-card__primary');
    expect(screen.getByRole('button', { name: 'Make another change' })).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith('project_personalize', null, null);
  });

  test('backs up a generated guest project only in the current browser', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Website/i }));
    await screen.findByRole('heading', { name: 'Change one thing so this project becomes yours.' });

    expect(screen.getByLabelText('Guest project recovery')).toHaveTextContent('Backed up in this browser');
    expect(screen.getByLabelText('Guest project recovery')).toHaveTextContent('only on this device for up to 7 days');
    await waitFor(() => expect(JSON.parse(localStorage.getItem(GUEST_PROJECT_DRAFT_KEY))).toEqual(expect.objectContaining({
      code: expect.stringContaining('My game'),
      projectType: 'game',
    })));
  });

  test('recovers a fresh guest project on a later visit and offers account backup', async () => {
    saveGuestProjectDraft(localStorage, {
      code: '<!doctype html><html><head><style>body{background:#fffaf4;color:#432c23;padding:2rem}</style></head><body><h1>Recovered idea</h1><p>A complete local project that can return safely on this device.</p><button>Play</button></body></html>',
      prompt: 'a recovered idea',
      builtPrompt: 'a recovered idea',
      projectType: 'website',
      aiTitle: 'Recovered idea',
      promptHistory: ['a recovered idea'],
      hasPersonalized: true,
    });

    render(<Builder />);

    expect(await screen.findByText('Welcome back—your project was recovered.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Save this project before you leave.' })).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('guest_draft_recovered');

    fireEvent.click(screen.getByRole('button', { name: 'Keep it in a free account' }));
    expect(mockNavigate).toHaveBeenCalledWith('/register?from=builder&action=save', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
  });

  test('removes an expired guest recovery copy instead of restoring it', () => {
    saveGuestProjectDraft(localStorage, {
      code: '<!doctype html><html><head><style>body{color:#432c23}</style></head><body><h1>Expired idea</h1><p>This should not return after the recovery window.</p></body></html>',
    }, Date.now() - GUEST_PROJECT_DRAFT_TTL_MS - 1);

    render(<Builder />);

    expect(screen.queryByText('Welcome back—your project was recovered.')).not.toBeInTheDocument();
    expect(localStorage.getItem(GUEST_PROJECT_DRAFT_KEY)).toBeNull();
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

  test('automatically completes a fresh guest save after account setup', async () => {
    sessionStorage.setItem('codeit_builder_draft', JSON.stringify({
      code: '<!doctype html><html><head><style>body{background:#fffaf4;color:#432c23;padding:2rem}</style></head><body><h1>Saved idea</h1><p>A complete draft with enough markup to restore safely after account setup.</p><button>Play</button></body></html>',
      prompt: 'a saved idea',
      builtPrompt: 'a saved idea',
      projectType: 'website',
      aiTitle: 'Saved idea',
      promptHistory: ['a saved idea'],
      savedAt: Date.now(),
    }));
    mockBuilderLocation.state = { resumeBuilderAction: 'save' };

    render(
      <AuthContext.Provider value={{ user: { id: 11, name: 'New learner', role: 'student' }, token: 'new-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    await screen.findByRole('heading', { name: 'Ready to show someone what you made?' });
    expect(sessionStorage.getItem('codeit_builder_draft')).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://codeit.test/api/builder/projects',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer new-token' }),
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('/builder', { replace: true, state: null });
  });

  test('automatically saves and publishes a fresh guest project after account setup', async () => {
    sessionStorage.setItem('codeit_builder_draft', JSON.stringify({
      code: '<!doctype html><html><head><style>body{background:#fffaf4;color:#432c23;padding:2rem}</style></head><body><h1>Published idea</h1><p>A complete draft with enough markup to restore safely after account setup.</p><button>Play</button></body></html>',
      prompt: 'a published idea',
      builtPrompt: 'a published idea',
      projectType: 'website',
      aiTitle: 'Published idea',
      promptHistory: ['a published idea'],
      savedAt: Date.now(),
    }));
    mockBuilderLocation.state = { resumeBuilderAction: 'publish' };

    render(
      <AuthContext.Provider value={{ user: { id: 12, name: 'New creator', role: 'student' }, token: 'creator-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    await screen.findByRole('heading', { name: 'Invite someone to play it.' });
    expect(sessionStorage.getItem('codeit_builder_draft')).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://codeit.test/api/builder/projects/99/publish',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer creator-token' }),
      })
    );
  });

  test('lets a returning eligible creator publish directly from My Creations', async () => {
    const savedProject = {
      id: 42,
      title: 'Mission Control Quiz',
      prompt: 'A colorful space quiz',
      project_type: 'quiz',
      is_public: 0,
      public_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    global.fetch = jest.fn((url, options = {}) => {
      const target = String(url);
      if (target.endsWith('/api/builder/projects') && !options.method) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, projects: [savedProject] }),
        });
      }
      if (target.endsWith('/api/builder/projects/42/publish')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, public_id: 'public-42' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    render(
      <AuthContext.Provider value={{ user: { id: 7, name: 'Alex', role: 'student' }, token: 'creator-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    await screen.findByText('Mission Control Quiz');
    expect(screen.getByText('Private')).toBeInTheDocument();
    expect(screen.getByText(/unpublish anytime/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Publish Mission Control Quiz' }));

    await screen.findByText('Live');
    expect(screen.getByRole('button', { name: 'Share Mission Control Quiz' })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://codeit.test/api/builder/projects/42/publish',
      expect.objectContaining({ method: 'POST' })
    );
    expect(trackEvent).toHaveBeenCalledWith('activation_next_step', 'publish', 'creator-token');
  });

  test('opens the exact saved project linked from the returning-student homepage', async () => {
    mockBuilderLocation.search = '?project=42';
    const savedProject = {
      id: 42,
      title: 'Mission Control Quiz',
      prompt: 'A colorful space quiz',
      project_type: 'quiz',
      is_public: 0,
      public_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    global.fetch = jest.fn((url) => {
      const target = String(url);
      if (target.endsWith('/api/builder/projects')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, projects: [savedProject] }) });
      }
      if (target.endsWith('/api/builder/projects/42')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            project: {
              ...savedProject,
              generated_code: '<!doctype html><html><body><h1>Mission Control Quiz</h1></body></html>',
            },
          }),
        });
      }
      if (target.includes('/api/builder/projects/42/versions')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, versions: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
    });

    render(
      <AuthContext.Provider value={{ user: { id: 7, name: 'Alex', role: 'student' }, token: 'creator-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    expect(await screen.findByRole('heading', { name: 'Mission Control Quiz' })).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'http://codeit.test/api/builder/projects/42',
      expect.objectContaining({ headers: { Authorization: 'Bearer creator-token' } })
    );
  });

  test('shares a live saved project directly from My Creations', async () => {
    const clipboardWrite = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        projects: [{
          id: 43,
          title: 'Reaction Rush',
          prompt: 'A reaction timer game',
          project_type: 'game',
          is_public: 1,
          public_id: 'public-43',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      }),
    }));

    render(
      <AuthContext.Provider value={{ user: { id: 7, name: 'Alex', role: 'student' }, token: 'creator-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    await screen.findByText('Reaction Rush');
    fireEvent.click(screen.getByRole('button', { name: 'Share Reaction Rush' }));

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledWith(
      `${window.location.origin}/project/public-43?utm_source=project-share`
    ));
    expect(screen.getByRole('button', { name: 'Share Reaction Rush' })).toHaveTextContent('Link copied!');
    expect(trackEvent).toHaveBeenCalledWith('project_share', 'creator', 'creator-token');
  });

  test('keeps managed saved projects family-private in My Creations', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({
        success: true,
        projects: [{
          id: 44,
          title: 'Private Space Quiz',
          prompt: 'A private family quiz',
          project_type: 'quiz',
          is_public: 0,
          public_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }],
      }),
    }));

    render(
      <AuthContext.Provider value={{ user: { id: 8, name: 'Sam', role: 'student', managedProfile: true }, token: 'managed-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    await screen.findByText('Private Space Quiz');
    expect(screen.getByText('Family private')).toBeInTheDocument();
    expect(screen.getByText(/only your family account can open it/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish Private Space Quiz' })).not.toBeInTheDocument();
  });
});
