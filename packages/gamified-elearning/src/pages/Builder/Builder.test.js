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
const mockAwardXP = jest.fn();
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
  useCharacter: () => ({ awardXP: mockAwardXP }),
}));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({
  trackEvent: jest.fn(() => Promise.resolve(true)),
}));

/**
 * Open one of the studio's pages.
 *
 * The studio used to stack every panel down one screen. A real child using it
 * said "I feel like it's crammed in a way maybe u can make like pages?", so the
 * panels are sorted into Play / Change / The code / Keep. Reaching a tool now
 * means tapping its page first, exactly as a child does.
 */
function openStudioPage(name) {
  // Scoped to the tab bar. "Save" is a page and also the button on the phone's
  // bottom bar, and a test that grabs whichever one it finds first is a test
  // that passes while the child presses the wrong thing.
  // Matched on the label span, not the button: textContent includes the icon
  // glyph, so "Play" is really "▶Play" and every match silently failed.
  const tab = [...document.querySelectorAll('button.bldr-tab')]
    .find(el => new RegExp(`^${name}$`, 'i')
      .test((el.querySelector('.bldr-tab__label') || el).textContent.trim()));
  if (!tab) throw new Error(`No studio tab called "${name}"`);
  fireEvent.click(tab);
}

async function finishProjectQualityCheck(theme = 'Candy') {
  // Waits for the four-step checklist, not for a heading. It used to wait on
  // "Play it. Change it. Test it. Then save it." — one of four separate things
  // that were all telling a child the same sentence, and removing three of them
  // broke fourteen tests that only cared that the studio had finished building.
  // The first step existing is the real signal, and it survives a rewording.
  await screen.findByRole('button', { name: /Play everything/i });
  fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));
  openStudioPage('Change');
  fireEvent.click(screen.getByRole('button', { name: `Apply ${theme} theme` }));
  fireEvent.click(screen.getByRole('button', { name: /Play my changes/i }));
}

describe('studio opening', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    localStorage.clear();
    sessionStorage.clear();
    mockNavigate.mockClear();
    mockAwardXP.mockClear();
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
          xp_awarded: 25,
        };
      } else if (target.includes('/versions')) {
        body = { success: true };
      } else if (target.endsWith('/publish')) {
        body = { success: true, public_id: 'public-99', xp_awarded: 25 };
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
    expect(screen.getByText('Studio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Build my project' })).toBeDisabled();
    expect(screen.getByRole('region', { name: 'About the studio' })).toHaveTextContent('Private until published');
    expect(screen.queryByText(/AI Builder/i)).not.toBeInTheDocument();
  });

  test('welcomes a new account directly into a savable first project', () => {
    mockBuilderLocation.search = '?welcome=1';
    render(
      <AuthContext.Provider value={{ user: { id: 17, name: 'New Coder', role: 'Student' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    // Two live regions now greet a brand-new account: the welcome banner and
    // Pixel opening with step one — which is the product working, not a clash,
    // so the assertion names the banner instead of assuming there is only one
    // thing on the page allowed to speak.
    const welcome = screen.getAllByRole('status').find(el => el.classList.contains('bldr-account-ready'));
    expect(welcome).toHaveTextContent('Your account is ready.');
    expect(welcome).toHaveTextContent('Your first saved project will stay in this account.');
    expect(screen.getByRole('button', { name: /Build a Game/i })).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('new_account_studio_view', null, 'student-token');
  });

  test('reads each step out loud to an early learner, and remembers quiet', () => {
    // For a child who cannot read yet, the bubble text is a wall however
    // short it is — the words have to arrive as sound, without the child
    // having to find a button first. The mute must stick, because a
    // classroom of thirty auto-reading tablets is its own disaster.
    const speak = jest.fn();
    const cancel = jest.fn();
    window.speechSynthesis = { speak, cancel };
    window.SpeechSynthesisUtterance = function utter(text) { this.text = text; };

    render(
      <AuthContext.Provider value={{ user: { id: 5, name: 'Little Coder', role: 'student', learningMode: 'early' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    // Step one spoke on arrival, unprompted.
    expect(speak).toHaveBeenCalled();
    expect(speak.mock.calls[0][0].text).toMatch(/Tap a game to open it/i);

    // The quiet key silences him and is remembered on this device.
    fireEvent.click(screen.getByRole('button', { name: /Stop Pixel reading out loud/i }));
    expect(localStorage.getItem('codeit_pixel_quiet')).toBe('1');
    expect(cancel).toHaveBeenCalled();

    speak.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    // The step changed; a muted Pixel stays silent.
    expect(speak).not.toHaveBeenCalled();
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
  });

  test('gives an early learner larger step-by-step help and lets an adult change the level', () => {
    render(
      <AuthContext.Provider value={{ user: { id: 5, name: 'Little Coder', role: 'student', learningMode: 'early' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    expect(screen.getByRole('button', { name: /Big help/i })).toHaveAttribute('aria-pressed', 'true');
    // The coach text box became Pixel's speech bubble; the rule it carried
    // survives the costume change: an early learner gets the bigger voice,
    // with Show me and Read to me.
    expect(screen.getByRole('status')).toHaveClass('pixel-guide__bubble--early');
    expect(screen.getByRole('button', { name: /Show me/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Read to me/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Explore myself/i }));
    expect(screen.getByRole('button', { name: /Explore myself/i })).toHaveAttribute('aria-pressed', 'true');
    // Independent learners keep Pixel himself — resting in the corner, ready
    // to be asked — but the bubble stays closed until they ask.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ask Pixel what to do next/i })).toBeInTheDocument();
    expect(localStorage.getItem('codeit_guide_level')).toBe('independent');
  });

  test('preserves a guest project before opening the save account gate', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await finishProjectQualityCheck();
    fireEvent.click(screen.getByRole('button', { name: /Keep my project/i }));

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
    await finishProjectQualityCheck();

    fireEvent.click(screen.getByRole('button', { name: 'Save project to a free account' }));

    expect(JSON.parse(sessionStorage.getItem('codeit_builder_draft')).code).toContain('My game');
    expect(mockNavigate).toHaveBeenCalledWith('/register?from=builder&action=save', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
  });

  test('keeps a guest project private until it is saved to an account', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Quiz/i }));
    await finishProjectQualityCheck();
    openStudioPage('Save');
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Keep my project/i })).toBeEnabled();
  });

  test('makes keeping the project primary while personalization stays optional', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Website/i }));
    // The guidance has to come after the project, not before it. That is the
    // whole point of the layout: the child's game is the thing on the screen and
    // the instructions are underneath it. Anchored to the checklist rather than
    // to any particular wording of the heading above it.
    const firstStep = await screen.findByRole('button', { name: /Play everything/i });
    const projectPreview = screen.getByTitle('Project preview');

    expect(projectPreview.compareDocumentPosition(firstStep) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Keep my project/i })).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Project quality steps' })).toHaveTextContent('Play everything');

    fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply Candy theme' }));

    expect(screen.getByRole('button', { name: /Play my changes/i })).toHaveClass('bldr-activation-card__primary');
    fireEvent.click(screen.getByRole('button', { name: /Play my changes/i }));
    expect(screen.getByRole('button', { name: /Keep my project/i })).toHaveClass('bldr-activation-card__primary');
    // Counted by name rather than in total. The total was 1 until the studio
    // started reporting its own arrivals, and a test that fails when an
    // unrelated event is added is a test about the wrong thing: the invariant
    // here is that personalising fires exactly one project_personalize, not
    // that the studio is silent.
    const personalizeCalls = trackEvent.mock.calls.filter(c => c[0] === 'project_personalize');
    expect(personalizeCalls).toHaveLength(1);
    expect(trackEvent).toHaveBeenCalledWith('project_personalize', null, null);
  });

  test('guides a young creator through one-tap change ideas and sends their signed-in identity', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 17, name: 'Young Coder', role: 'Student' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('button', { name: /Play everything/i });
    fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));
    openStudioPage('Change');
    fireEvent.click(screen.getByRole('button', { name: 'Change my project' }));

    expect(screen.getByRole('group', { name: 'How to change your project' })).toHaveTextContent('Pick an idea');
    fireEvent.click(screen.getByRole('button', { name: /Change the colours/i }));
    expect(screen.getByLabelText('Or type your own idea')).toHaveValue('Change the game to bright rainbow colours.');
    fireEvent.click(screen.getByRole('button', { name: 'Make my change' }));

    await waitFor(() => {
      const editRequest = global.fetch.mock.calls.find(([url]) => url === 'http://codeit.test/api/builder/edit');
      expect(editRequest[1].headers).toEqual(expect.objectContaining({
        Authorization: 'Bearer student-token',
        'X-CodeIt-Journey': expect.stringMatching(/^[0-9a-f-]{36}$/i),
      }));
    });
  });

  test('turns an AI limit into a clear wait time with useful non-AI choices', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('button', { name: /Play everything/i });
    fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));

    const normalFetch = global.fetch.getMockImplementation();
    global.fetch.mockImplementation((url, options = {}) => {
      if (String(url).endsWith('/api/builder/edit')) {
        return Promise.resolve({
          ok: false,
          status: 429,
          headers: { get: name => name.toLowerCase() === 'retry-after' ? '120' : 'application/json' },
          json: async () => ({ code: 'AI_LIMIT_REACHED', retryAfterSeconds: 120 }),
        });
      }
      return normalFetch(url, options);
    });

    openStudioPage('Change');
    fireEvent.click(screen.getByRole('button', { name: 'Change my project' }));
    fireEvent.click(screen.getByRole('button', { name: /Add a power-up/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Make my change' }));

    expect(await screen.findByText(/Your project is safe!/)).toBeInTheDocument();
    expect(screen.getByText(/Your project is safe!/).closest('[role="status"]')).toHaveTextContent('2 minutes');
    expect(screen.getByRole('button', { name: /Play my project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Change colours/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wait 2 minutes/i })).toBeDisabled();
  }, 10000);

  test('backs up a generated guest project only in the current browser', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Website/i }));
    await screen.findByRole('button', { name: /Play everything/i });

    // On Keep, not on Play. Telling a child about browser storage before they
    // have played the thing they just made is the wrong moment for a true
    // message.
    expect(screen.queryByLabelText('Guest project recovery')).not.toBeInTheDocument();
    openStudioPage('Save');
    expect(screen.getByLabelText('Guest project recovery')).toHaveTextContent('Saved in this browser');
    expect(screen.getByLabelText('Guest project recovery')).toHaveTextContent('Only on this computer, for 7 days');
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

    expect(await screen.findByText('Welcome back! Your game is still here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Play everything/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Keep my project/i })).toBeInTheDocument();
    expect(trackEvent).toHaveBeenCalledWith('guest_draft_recovered');

    fireEvent.click(screen.getByRole('button', { name: 'Keep it forever, free' }));
    expect(mockNavigate).toHaveBeenCalledWith('/register?from=builder&action=save', {
      state: { from: '/builder', resumeBuilderAction: 'save' },
    });
  });

  test('removes an expired guest recovery copy instead of restoring it', () => {
    saveGuestProjectDraft(localStorage, {
      code: '<!doctype html><html><head><style>body{color:#432c23}</style></head><body><h1>Expired idea</h1><p>This should not return after the recovery window.</p></body></html>',
    }, Date.now() - GUEST_PROJECT_DRAFT_TTL_MS - 1);

    render(<Builder />);

    expect(screen.queryByText('Welcome back! Your game is still here.')).not.toBeInTheDocument();
    expect(localStorage.getItem(GUEST_PROJECT_DRAFT_KEY)).toBeNull();
  });

  test('gives a signed-in creator one clear publish step after saving', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 7, name: 'Alex', role: 'student' }, token: 'creator-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Website/i }));
    await finishProjectQualityCheck();
    expect(mockAwardXP).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Save my project/i }));

    openStudioPage('Save');
    await screen.findByRole('heading', { name: 'Now your project is ready to publish.' });
    expect(mockAwardXP).toHaveBeenCalledWith(25);
    fireEvent.click(screen.getByRole('button', { name: 'Publish and get a link' }));

    await screen.findByRole('heading', { name: 'Invite someone to play it.' });
    expect(mockAwardXP).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenCalledWith('activation_next_step', 'publish', 'creator-token');
    expect(screen.getByRole('button', { name: 'Share your project' })).toBeInTheDocument();

    // The proudest second in the product used to be the word "copied" on a
    // button for three seconds. Now it is a celebration that shows the real
    // link, says what it means — anyone can play it, no app, no account —
    // and stays until the child closes it, because pride does not expire on
    // a timer.
    openStudioPage('Save');
    const live = await screen.findByText(/is on the internet now/i);
    expect(live).toBeInTheDocument();
    expect(screen.getByText(/codeitlearn\.com\/project\//)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send it to someone' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByText(/is on the internet now/i)).not.toBeInTheDocument();
  });

  // ── "Too much text and talking" ────────────────────────────────────────
  //
  // From a 23-year-old who signed up to learn to code. The level called
  // "Explore myself" is what an adult account gets by default, and it used to
  // change almost nothing: the mascot reopened after every build, a companion
  // appeared, and a confetti overlay covered the project.
  test('an independent learner is not narrated at', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 11, name: 'Omar', role: 'student', learningMode: 'independent' }, token: 'adult-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Quiz/i }));
    await screen.findByRole('button', { name: /Play everything/i });

    expect(document.querySelector('.bldr-wow-overlay')).toBeNull();
    expect(document.querySelector('.pixel-guide__title')).toBeNull();
  });

  // The same studio, for a child. Everything above still has to be there.
  test('a guided learner still gets the guidance', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 12, name: 'Sara', role: 'student', learningMode: 'guided' }, token: 'child-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Quiz/i }));
    await screen.findByRole('button', { name: /Play everything/i });

    expect(document.querySelector('.pixel-guide__title')).not.toBeNull();
  });

  test('keeps a managed learner private and guides them into learning', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 8, name: 'Sam', role: 'student', managedProfile: true }, token: 'managed-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Quiz/i }));
    await finishProjectQualityCheck();
    fireEvent.click(screen.getByRole('button', { name: /Save my project/i }));

    openStudioPage('Save');
    await screen.findByRole('heading', { name: 'Great work. Show your grown-up or teacher.' });
    expect(screen.queryByRole('button', { name: 'Publish and get a link' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Learn how it works' }));
    expect(trackEvent).toHaveBeenCalledWith('activation_next_step', 'learn', 'managed-token');
    openStudioPage('The code');
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
      hasPersonalized: true,
      hasPlayedOnce: true,
      hasTestedLatest: true,
      savedAt: Date.now(),
    }));
    mockBuilderLocation.state = { resumeBuilderAction: 'save' };

    render(
      <AuthContext.Provider value={{ user: { id: 11, name: 'New learner', role: 'student' }, token: 'new-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    openStudioPage('Save');
    await screen.findByRole('heading', { name: 'Now your project is ready to publish.' });
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
      hasPersonalized: true,
      hasPlayedOnce: true,
      hasTestedLatest: true,
      savedAt: Date.now(),
    }));
    mockBuilderLocation.state = { resumeBuilderAction: 'publish' };

    render(
      <AuthContext.Provider value={{ user: { id: 12, name: 'New creator', role: 'student' }, token: 'creator-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    openStudioPage('Save');
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

  test('lets a returning eligible creator publish directly from My projects', async () => {
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

  test('shares a live saved project directly from My projects', async () => {
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

  test('keeps managed saved projects family-private in My projects', async () => {
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
  test('lets a student change, test and save a project without any AI call', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('button', { name: /Play everything/i });
    fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));

    const editCallsBefore = global.fetch.mock.calls.filter(([url]) => String(url).includes('/edit')).length;

    openStudioPage('Change');
    fireEvent.click(screen.getAllByRole('button', { name: /Change my project/i })[0]);
    fireEvent.click(await screen.findByRole('button', { name: 'Text size: Big' }));

    // The change is real and immediate, and it never leaves the browser.
    expect(screen.getByRole('button', { name: 'Text size: Big' })).toHaveAttribute('aria-pressed', 'true');
    const editCallsAfter = global.fetch.mock.calls.filter(([url]) => String(url).includes('/edit')).length;
    expect(editCallsAfter).toBe(editCallsBefore);

    fireEvent.click(screen.getAllByRole('button', { name: /Play my changes/i })[0]);
    expect(screen.getAllByRole('button', { name: /Keep my project/i })[0]).toBeEnabled();
  });

  test('remembers instant choices when the panel is reopened', async () => {
    render(<Builder />);

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('button', { name: /Play everything/i });
    fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));
    openStudioPage('Change');
    fireEvent.click(screen.getAllByRole('button', { name: /Change my project/i })[0]);

    fireEvent.click(await screen.findByRole('button', { name: 'Letter style: Bubbly' }));
    fireEvent.click(screen.getAllByRole('button', { name: '\u00d7' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Make it mine' })[0]);

    expect(await screen.findByRole('button', { name: 'Letter style: Bubbly' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test('renames the project from the panel and saves the name the student chose', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 21, name: 'Sara', role: 'Student' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('button', { name: /Play everything/i });
    fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));
    openStudioPage('Change');
    fireEvent.click(screen.getAllByRole('button', { name: /Change my project/i })[0]);

    fireEvent.change(await screen.findByLabelText(/Give your project its own name/i), {
      target: { value: 'Star Catcher' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use this name' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Play my changes/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Save my project/i })[0]);

    await waitFor(() => {
      const save = global.fetch.mock.calls.find(
        ([url, options]) => String(url).endsWith('/api/builder/projects') && options?.method === 'POST'
      );
      expect(save).toBeDefined();
      expect(JSON.parse(save[1].body).title).toBe('Star Catcher');
    });
  });

  test('shows an early learner fewer, picture-led choices and no advanced controls', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 5, name: 'Little Coder', role: 'student', learningMode: 'early' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Build a Game/i }));
    await screen.findByRole('button', { name: /Play everything/i });
    fireEvent.click(screen.getByRole('button', { name: /Play it now/i }));
    openStudioPage('Change');
    fireEvent.click(screen.getAllByRole('button', { name: /Change my project/i })[0]);

    expect(await screen.findByText(/Tap a picture to change your project/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Corners: / })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Letter style: / })).not.toBeInTheDocument();
    // No typing route is offered as the way forward at this age.
    expect(screen.queryByRole('button', { name: /describe a change in words/i })).not.toBeInTheDocument();
  });
  test('shows a creator how many people played their published project', async () => {
    global.fetch.mockImplementation((url) => {
      const target = String(url);
      if (target.includes('/missions')) {
        return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ missions: [] }) });
      }
      if (target.endsWith('/api/builder/projects')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            projects: [
              {
                id: 1, title: 'Star Catcher', prompt: 'a star game', project_type: 'game',
                is_public: 1, public_id: 'abc123', view_count: 42, remix_count: 3,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              },
              {
                id: 2, title: 'Secret Quiz', prompt: 'a quiz', project_type: 'quiz',
                is_public: 0, public_id: null, view_count: 0, remix_count: 0,
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({}) });
    });

    render(
      <AuthContext.Provider value={{ user: { id: 9, name: 'Sara', role: 'Student' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    expect(await screen.findByText(/42 plays/)).toBeInTheDocument();
    expect(screen.getByText(/3 remixed/)).toBeInTheDocument();
    // A private project has no audience, so no count is claimed for it.
    await screen.findByText('Secret Quiz');
    expect(screen.queryByText(/No plays yet/)).not.toBeInTheDocument();
  });

  test('tells a creator plainly when nobody has played it yet', async () => {
    global.fetch.mockImplementation((url) => {
      const target = String(url);
      if (target.includes('/missions')) {
        return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ missions: [] }) });
      }
      if (target.endsWith('/api/builder/projects')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            projects: [{
              id: 3, title: 'Brand New', prompt: 'x', project_type: 'game',
              is_public: 1, public_id: 'zzz999', view_count: 0, remix_count: 0,
              created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }],
          }),
        });
      }
      return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({}) });
    });

    render(
      <AuthContext.Provider value={{ user: { id: 9, name: 'Sara', role: 'Student' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    // "0 plays" reads as failure; this reads as an invitation.
    expect(await screen.findByText(/No plays yet. Share your link/)).toBeInTheDocument();
  });

  test('a single play is not pluralised', async () => {
    global.fetch.mockImplementation((url) => {
      const target = String(url);
      if (target.includes('/missions')) {
        return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({ missions: [] }) });
      }
      if (target.endsWith('/api/builder/projects')) {
        return Promise.resolve({
          ok: true,
          headers: { get: () => 'application/json' },
          json: async () => ({
            success: true,
            projects: [{
              id: 4, title: 'One Player', prompt: 'x', project_type: 'game',
              is_public: 1, public_id: 'one111', view_count: 1, remix_count: 0,
              created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            }],
          }),
        });
      }
      return Promise.resolve({ ok: true, headers: { get: () => 'application/json' }, json: async () => ({}) });
    });

    render(
      <AuthContext.Provider value={{ user: { id: 9, name: 'Sara', role: 'Student' }, token: 'student-token' }}>
        <Builder />
      </AuthContext.Provider>
    );

    expect(await screen.findByText(/1 play$/)).toBeInTheDocument();
  });
});

// ── The parent trail ─────────────────────────────────────────────────────────
//
// "Start building free" on /pricing sends a parent into their child's studio —
// the honest demo — with ?from=pricing. One dismissible line bridges them back
// to the decision. It must never exist for a plain visit: no child builds next
// to an advert.
describe('the parent trail from pricing', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    localStorage.clear();
    sessionStorage.clear();
    trackEvent.mockClear();
    mockBuilderLocation.search = '';
    mockBuilderLocation.state = null;
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ missions: [] }) }));
  });

  test('shows the bridge back only for arrivals from pricing, and stays dismissed', () => {
    mockBuilderLocation.search = '?from=pricing';
    const { unmount } = render(<Builder />);
    expect(screen.getByText(/this is exactly what your child uses/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /family pilot is free/i })).toHaveAttribute('href', '/pricing#family-pilot');

    fireEvent.click(screen.getByRole('button', { name: /Dismiss this note/i }));
    expect(screen.queryByText(/this is exactly what your child uses/i)).not.toBeInTheDocument();
    unmount();

    // Dismissed once is dismissed for the visit, even on a fresh mount.
    render(<Builder />);
    expect(screen.queryByText(/this is exactly what your child uses/i)).not.toBeInTheDocument();
  });

  test('a plain visit to the studio never shows it', () => {
    render(<Builder />);
    expect(screen.queryByText(/this is exactly what your child uses/i)).not.toBeInTheDocument();
  });
});
