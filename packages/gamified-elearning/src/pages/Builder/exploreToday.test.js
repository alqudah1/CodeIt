import { render, screen } from '@testing-library/react';
import Explore from './Explore';

// ── Today's build on Explore ────────────────────────────────────────────────
// The quest from every child's Home, and the games published from it today.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../context/AuthContext', () => {
  const React = require('react');
  return { AuthContext: React.createContext({ user: null, token: null }) };
});
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));

const QUEST = { text: 'Shoot the asteroids.', prompt: 'a ship that shoots asteroids and they get faster', day: '2026-11-02' };
const card = (over) => ({ id: 1, publicId: 'aaa111bbb222', title: 'Rock Blaster', projectType: 'game', creatorName: 'Maya', plays: 3, likes: 0, remixes: 0, ...over });

function feed(today) {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ trending: [], newest: [], mostPlayed: [], mostRemixed: [], today }) }));
}

test('the quest is there with a door straight into building it, and real entries under it', async () => {
  feed({ quest: QUEST, count: 9, entries: [card(), card({ id: 2, publicId: 'ccc333ddd444', title: 'Space Dodge' })] });
  render(<Explore />);
  expect(await screen.findByRole('heading', { name: 'Shoot the asteroids.' })).toBeInTheDocument();
  // The count is the server's, not the number of cards shown.
  expect(screen.getByText('9 made today. Play them, then make yours.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Build it' })).toHaveAttribute('href', `/build?prompt=${encodeURIComponent(QUEST.prompt)}`);
  expect(screen.getAllByText('Rock Blaster').length).toBeGreaterThan(0);
});

test('a day with none says so, with no invented count', async () => {
  feed({ quest: QUEST, count: 0, entries: [] });
  render(<Explore />);
  expect(await screen.findByText('Nobody has published one today yet. Yours could be the first.')).toBeInTheDocument();
  expect(screen.queryByText(/0 made/)).toBeNull();
});

test('an older server without it: nothing shown, nothing broken', async () => {
  feed(undefined);
  render(<Explore />);
  await screen.findByRole('heading', { level: 1 });
  expect(screen.queryByText("Today's build")).toBeNull();
});

// 19 November 2026: on a day with nothing published the card stood 190px tall
// in front of every project on a phone. With nothing to show it is one slim
// row; with entries it leads, because its cards are projects to play.
test('with nothing published today it is the quiet row, and with entries it is not', async () => {
  feed({ quest: QUEST, count: 0, entries: [] });
  const empty = render(<Explore />);
  await screen.findByRole('heading', { name: 'Shoot the asteroids.' });
  expect(empty.container.querySelector('.exp-today__head--quiet')).not.toBeNull();
  expect(empty.container.querySelector('.exp-bar--quiet')).not.toBeNull();
  // The filters are in the same wrapper, so a wide screen can put them on one row.
  expect(empty.container.querySelector('.exp-bar .exp-tabs')).not.toBeNull();
  expect(empty.container.querySelector('.exp-bar .exp-today')).not.toBeNull();
  empty.unmount();

  feed({ quest: QUEST, count: 2, entries: [card()] });
  const full = render(<Explore />);
  await screen.findByRole('heading', { name: 'Shoot the asteroids.' });
  expect(full.container.querySelector('.exp-today__head--quiet')).toBeNull();
  expect(full.container.querySelector('.exp-bar--quiet')).toBeNull();
});

test('the sentence stays in the page when a narrow screen does not show it', () => {
  const css = require('fs').readFileSync(require('path').join(__dirname, 'Explore.css'), 'utf8');
  const narrow = css.slice(css.lastIndexOf('@media (max-width: 700px)'));
  // Clipped, not display:none, so a screen reader still reads it.
  expect(narrow).toMatch(/\.exp-today__head--quiet \.exp-today__line \{[^}]*clip-path: inset\(50%\)/);
  expect(narrow.slice(0, narrow.indexOf('}'))).not.toMatch(/display:\s*none/);
});

test('on the narrowest phones Play and Remix stand one above the other, so neither is cut off', () => {
  const css = require('fs').readFileSync(require('path').join(__dirname, 'Explore.css'), 'utf8');
  const narrow = css.slice(css.lastIndexOf('@media (max-width: 360px)'));
  expect(narrow).toMatch(/\.exp-card__actions \{ flex-direction: column;/);
  expect(narrow).toMatch(/\.exp-btn--remix \{[^}]*width: 100%/);
});

// 21 November 2026: that day's quest, "Dodge the spikes in space.", takes two
// lines beside the button on a phone. The row grew 14px and the first project
// started 34% down the screen, over the third this page is held to.
test('on a phone the quiet row gives back the gap above the projects, so a two-line quest still starts them in the top third', () => {
  const css = require('fs').readFileSync(require('path').join(__dirname, 'Explore.css'), 'utf8');
  expect(css).toMatch(/@media \(max-width: 640px\) \{\s*\.exp-bar--quiet \+ \.exp-content \{ padding-top: 6px; \}\s*\.exp-today__head--quiet \{ padding: 6px 14px; \}\s*\}/);
  // The bar and the projects are siblings, which is what that rule depends on.
  const js = require('fs').readFileSync(require('path').join(__dirname, 'Explore.js'), 'utf8');
  expect(js).toMatch(/<\/div>\s*\n\s*\{\/\* Content \*\/\}\s*\n\s*<div className="exp-content" role="main">/);
});
