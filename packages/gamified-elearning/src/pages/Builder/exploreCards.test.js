import { render, screen } from '@testing-library/react';
import Explore, { typeCategory, typeWord } from './Explore';
import { AuthContext } from '../../context/AuthContext';

// ── Message 68: the Explore cards ────────────────────────────────────────────

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/explore' }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

const project = (over = {}) => ({
  id: 1, publicId: 'abc', title: 'Colorful one-page website with About, Features and Contact sections',
  projectType: 'interactive-website', creatorName: 'CodeIt Studio', plays: 3, likes: 0, remixes: 0, ...over,
});

function show(list) {
  global.fetch = jest.fn(() => Promise.resolve({
    ok: true,
    json: async () => ({ trending: list, newest: [], mostPlayed: [], mostRemixed: [] }),
  }));
  return render(
    <AuthContext.Provider value={{ user: null, token: null }}>
      <Explore />
    </AuthContext.Provider>
  );
}

test('types the model names freely still land in the right category, with a one-word label', () => {
  expect(typeCategory('interactive-website')).toBe('web');
  expect(typeCategory('clicker-game')).toBe('game');
  expect(typeCategory('trivia quiz')).toBe('quiz');
  expect(typeCategory('unit converter')).toBe('tool');
  for (const t of ['interactive-website', 'clicker', 'quiz', 'tool', 'restaurant', 'platformer', 'something-new']) {
    expect(typeWord(t).split(/[\s-]/)).toHaveLength(1);
  }
  expect(typeWord('interactive-website')).toBe('Website');
});

test('the title appears once, below the art, cut at a word boundary', async () => {
  show([project()]);
  const card = await screen.findByText('Colorful one-page website');
  expect(card.className).toBe('exp-card__title');
  expect(document.querySelectorAll('.exp-card__thumb-title')).toHaveLength(0);
  expect(document.querySelectorAll('.exp-card__title')).toHaveLength(1);
  expect(screen.queryByText(/About, Features/)).toBeNull();
});

test('a website card shows the browser sticker, not the controller', async () => {
  show([project(), project({ id: 2, publicId: 'def', projectType: 'clicker', title: 'Reaction Rush' })]);
  await screen.findByText('Reaction Rush');
  const cards = document.querySelectorAll('.exp-card');
  expect(cards[0].className).toMatch(/exp-card--web/);
  expect(cards[1].className).toMatch(/exp-card--game/);
  expect(cards[0].querySelector('.arcade-sticker')?.outerHTML).not.toBe(cards[1].querySelector('.arcade-sticker')?.outerHTML);
});

test('the heading promises what the page holds', async () => {
  show([project()]);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Explore projects to play and remix');
  expect(screen.queryByText(/other learners/)).toBeNull();
});

test('the Play icon is the site play icon rather than an emoji', async () => {
  show([project()]);
  const play = await screen.findByRole('link', { name: /Play/ });
  expect(play.querySelector('svg')).not.toBeNull();
  expect(play.textContent).not.toMatch(/▶/);
  expect(document.querySelector('.exp-stat__icon svg')).not.toBeNull();
});

test('"Just made" means the last few days, not every card', async () => {
  const { isJustMade } = require('./Explore');
  const now = Date.parse('2026-09-05T12:00:00Z');
  expect(isJustMade('2026-09-04T12:00:00Z', now)).toBe(true);
  expect(isJustMade('2026-08-20T12:00:00Z', now)).toBe(false);
  expect(isJustMade(undefined, now)).toBe(false);
  show([project({ plays: 0, createdAt: '2026-01-01T00:00:00Z' })]);
  await screen.findByText('Colorful one-page website');
  expect(screen.queryByText('Just made')).toBeNull();
});

test('the card art rests on the sticker and only runs the project while on screen', async () => {
  show([project()]);
  await screen.findByText('Colorful one-page website');
  // In a renderer with no IntersectionObserver nothing is on screen, so the
  // sticker stays and no frame is mounted: the resting state is the icon.
  expect(document.querySelector('.exp-card__live .livecard__rest .arcade-sticker, .exp-card__live .livecard__rest svg')).not.toBeNull();
  expect(document.querySelector('.exp-card__live iframe')).toBeNull();
});
