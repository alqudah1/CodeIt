import { act, fireEvent, render, screen } from '@testing-library/react';
import PublicProject from './PublicProject';
import { trackEvent } from '../../utils/trackEvent';

// ── "Can you beat my score?" on the page a friend opens ─────────────────────

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
    useParams: () => ({ publicId: 'abc123' }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

const CODE = '<!doctype html><html><body><h1>Rocket Dodge</h1><div id="score">0</div><button id="go">Play</button></body></html>';
const writeText = jest.fn(() => Promise.resolve());

beforeEach(() => {
  trackEvent.mockClear(); writeText.mockClear();
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  global.fetch = jest.fn((url) => Promise.resolve(String(url).endsWith('/view')
    ? { ok: true, json: async () => ({ success: true }) }
    : { ok: true, json: async () => ({ success: true, project: { title: 'Rocket Dodge', creator_name: 'Sam', created_at: new Date().toISOString(), view_count: 3, generated_code: CODE } }) }));
});

function scoreFromGame(score, type = 'CODEIT_SCORE') {
  const frame = document.querySelector('.pp-iframe');
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type, score }, source: frame.contentWindow })); });
}

test('a link with a score shows it, counts up, and says so when it is beaten', async () => {
  window.history.pushState({}, '', '/project/abc123?beat=3');
  render(<PublicProject />);
  expect(await screen.findByText('Score to beat: 3')).toBeInTheDocument();
  expect(document.querySelector('.pp-iframe').getAttribute('srcdoc')).toContain('__codeit_score_bridge');
  expect(trackEvent).toHaveBeenCalledWith('score_challenge', 'opened');

  scoreFromGame(2);
  expect(screen.getByText(/Your best: 2/)).toBeInTheDocument();
  // Not beaten yet: nothing to send back.
  expect(screen.queryByRole('button', { name: /^Send it/ })).toBeNull();
  scoreFromGame(5, 'CODEIT_LOST');
  expect(screen.getByText('You beat it: 5!')).toBeInTheDocument();
  expect(trackEvent).toHaveBeenCalledWith('score_challenge', 'beaten');

  fireEvent.click(screen.getByRole('button', { name: 'Send it back' }));
  await act(async () => {});
  expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/project\/abc123\?utm_source=project-share&beat=5$/));
  expect(trackEvent).toHaveBeenCalledWith('score_challenge', 'sent');
});

test('a message from anywhere but the game frame is ignored', async () => {
  window.history.pushState({}, '', '/project/abc123?beat=3');
  render(<PublicProject />);
  await screen.findByText('Score to beat: 3');
  act(() => { window.dispatchEvent(new MessageEvent('message', { data: { type: 'CODEIT_SCORE', score: 999 }, source: window })); });
  expect(screen.queryByText(/You beat it/)).toBeNull();
});

test('with no score in the link, the page is as it was until a score is made', async () => {
  window.history.pushState({}, '', '/project/abc123');
  render(<PublicProject />);
  await screen.findByRole('heading', { name: 'Rocket Dodge' });
  expect(document.querySelector('.pp-beat')).toBeNull();
  expect(screen.getByRole('button', { name: 'Share project' })).toBeInTheDocument();
  scoreFromGame(8);
  expect(screen.getByText('Your score: 8')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Challenge a friend to beat 8' })).toBeInTheDocument();
});
