import fs from 'fs';
import path from 'path';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AvatarInGame from './AvatarInGame';

// ── The most distinctive thing in the product was a secret ───────────────────
//
// utils/avatarSprite.js turns the lab's avatar into a sprite and the studio
// hands it to every game; the star game draws it as the catcher. It worked,
// and nothing on the home page, in the nav, on /character or in any guide said
// so. These tests keep it on the home page, shown rather than described.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, onClick, ...p }) => React.createElement('a', { href: to, onClick, ...p }, children) };
}, { virtual: true });
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

describe('the avatar demo on the home page', () => {
  test('three picks and one button put the character in a real game', async () => {
    render(<AvatarInGame />);
    fireEvent.click(screen.getByRole('radio', { name: 'Cocoa' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Blue' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Hacker' }));
    fireEvent.click(screen.getByRole('button', { name: 'Put me in the game' }));

    const frame = await waitFor(() => {
      const el = document.querySelector('iframe.avdemo__frame');
      if (!el) throw new Error('no game yet');
      return el;
    });
    const doc = frame.getAttribute('srcdoc');
    // The sprite is the lab's own drawing, in the colours just chosen.
    expect(doc).toContain('window.CODEIT_PLAYER_SPRITE=');
    const sprite = decodeURIComponent(doc.match(/CODEIT_PLAYER_SPRITE="([^"]+)"/)[1]);
    expect(sprite).toContain('#2b7de9'); // blue hair
    expect(sprite).toContain('#20a372'); // hacker green
    // And the game is the real starter, which draws that sprite as the catcher.
    expect(doc).toContain('if (window.CODEIT_PLAYER_SPRITE)');
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  });

  test('it links to the Avatar Lab, where the avatar is kept', () => {
    render(<AvatarInGame />);
    expect(screen.getByRole('link', { name: /Build the full avatar/ })).toHaveAttribute('href', '/character');
  });
});

describe('the avatar has a job, and the site says so', () => {
  const read = (rel) => fs.readFileSync(path.join(__dirname, rel), 'utf8');

  test('the home page hero shows it', () => {
    const home = read('Home.js');
    expect(home).toMatch(/<AvatarInGame \/>/);
    // In the hero column, not further down.
    expect(home.indexOf('<AvatarInGame />')).toBeLessThan(home.indexOf('<TryPython />'));
  });

  test('/character tells the child what the avatar is for', () => {
    const lab = read('../CharacterLab/CharacterLab.js');
    expect(lab).toMatch(/This is you in your own games/);
    expect(lab).toMatch(/Play as me in a game/);
  });

  test('/press lists it under what is actually different', () => {
    const facts = read('../../data/pressFacts.js');
    const section = facts.slice(facts.indexOf('What is actually different about it'), facts.indexOf('heading: "The name"'));
    expect(section).toMatch(/avatar[\s\S]*is the player in the games that child builds/i);
  });
});
