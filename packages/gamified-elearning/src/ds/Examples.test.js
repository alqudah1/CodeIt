import { fireEvent, render, screen } from '@testing-library/react';
import ExampleCards, { EXAMPLES, ExampleHero, buildHref, examplesFrom } from './Examples';
import { localRecipe } from '../pages/Build/recipeLocal';

// ── Examples fill the empty places, and never pretend ───────────────────────
//
// Every card is a sentence the engine really builds, drawn with the sprites
// it really uses, tagged Example, with no name and no number on it.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });

test('every example is what the engine builds from that sentence', () => {
  expect(EXAMPLES.length).toBeGreaterThanOrEqual(12);
  for (const ex of EXAMPLES) expect(ex.kind).toBe(localRecipe(ex.sentence).kind);
  expect(new Set(EXAMPLES.map((e) => e.sentence)).size).toBe(EXAMPLES.length);
  expect(examplesFrom(EXAMPLES.length - 1, 3).map((e) => e.sentence)).toEqual([EXAMPLES[EXAMPLES.length - 1].sentence, EXAMPLES[0].sentence, EXAMPLES[1].sentence]);
});

test('cards say Example, carry no names or numbers, and open Build with the sentence', () => {
  render(<ExampleCards count={4} title="Ideas to build" />);
  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(4);
  links.forEach((a, i) => {
    expect(a).toHaveTextContent(/^Example/);
    expect(a).toHaveAttribute('href', buildHref(EXAMPLES[i].sentence));
  });
  const text = document.body.textContent.replace(/win at 30/g, '');
  expect(text).not.toMatch(/\d+\s*(plays?|xp|likes?)/i);
  expect(text).not.toMatch(/\bby [A-Z]/);
});

test('a card can pick instead of link, or just be shown', () => {
  const onPick = jest.fn();
  const picked = render(<ExampleCards from={4} count={2} onPick={onPick} />);
  fireEvent.click(screen.getAllByRole('button')[0]);
  expect(onPick).toHaveBeenCalledWith(EXAMPLES[4].sentence);
  picked.unmount();
  render(<ExampleCards count={2} link={false} />);
  expect(screen.queryAllByRole('link')).toHaveLength(0);
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});

test('the frame hero shows one example and builds it on a tap', () => {
  const onPick = jest.fn();
  render(<ExampleHero onPick={onPick} />);
  expect(screen.getByText(EXAMPLES[0].sentence)).toBeInTheDocument();
  expect(screen.getByText('Your game shows up here two seconds after you press Build.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Build this one' }));
  expect(onPick).toHaveBeenCalledWith(EXAMPLES[0].sentence);
});
