import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import RecentProjects from './RecentProjects';
import FounderNote from './FounderNote';
import COMPANY from '../../config/company';

jest.mock('react-router-dom', () => {
  const R = require('react');
  return { Link: ({ children, to, ...p }) => R.createElement('a', { href: to, ...p }, children) };
}, { virtual: true });
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

const project = (id, title, name, type = 'game') => ({
  publicId: id, title, creatorName: name, projectType: type,
});

function mockFeed(newest) {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ newest }) }));
}

// ── Real projects or nothing ─────────────────────────────────────────────────
//
// The home page carried a mock parent email about a child called Sam who
// published a project called "My Space Quiz". Neither existed. It was the only
// thing on the page that looked like evidence, and it was invented, which is
// the worst of both.
//
// What replaced it can only ever show projects that exist. These tests are
// about the failure mode: what it does on a quiet day.
describe('the projects strip', () => {
  afterEach(() => { delete global.fetch; });

  test('shows real titles and the initial of the person who made them', async () => {
    mockFeed([project('a1', 'Cat vs Dog Battle', 'Layla'), project('b2', 'Space Maths', 'Omar', 'quiz'),
      project('c3', 'My Football Club', 'Sara', 'website')]);
    render(<RecentProjects />);
    expect(await screen.findByText('Cat vs Dog Battle')).toBeInTheDocument();
    expect(screen.getByText('Space Maths')).toBeInTheDocument();
    expect(screen.getByText('Made by L')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cat vs Dog Battle/ })).toHaveAttribute('href', '/project/a1');
  });

  test('renders nothing at all when there are fewer than three', async () => {
    mockFeed([project('a1', 'Cat vs Dog Battle', 'Layla'), project('b2', 'Space Maths', 'Omar')]);
    const { container } = render(<RecentProjects />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container.querySelector('.recent')).toBeNull();
  });

  test('renders nothing when the gallery cannot be reached', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Failed to fetch')));
    const { container } = render(<RecentProjects />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(container.querySelector('.recent')).toBeNull();
  });

  test('never invents a name or a title', () => {
    const source = require('fs').readFileSync(`${__dirname}/RecentProjects.js`, 'utf8');
    for (const invented of ['Sam', 'My Space Quiz', 'Example', 'placeholder', 'Coming soon']) {
      expect(source.split('//')[0] + source.replace(/\/\/[^\n]*/g, '')).not.toContain(`'${invented}'`);
    }
  });
});

describe('the founder note', () => {
  test('says nothing until a real person has written something', () => {
    // Empty by default, on purpose: a plausible invented founder sentence is
    // worse than no founder at all.
    const { container } = render(<FounderNote />);
    if (!String(COMPANY.founderNote || '').trim()) {
      expect(container.firstChild).toBeNull();
    } else {
      expect(screen.getByText(COMPANY.founderNote)).toBeInTheDocument();
    }
  });

  test('when it does speak, it is signed and gives a mailbox', () => {
    const original = COMPANY.founderNote;
    COMPANY.founderNote = 'I built CodeIt in Toronto for one specific reason.';
    render(<FounderNote />);
    expect(screen.getByText('I built CodeIt in Toronto for one specific reason.')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(COMPANY.founderName))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: COMPANY.contactEmail }))
      .toHaveAttribute('href', `mailto:${COMPANY.contactEmail}`);
    COMPANY.founderNote = original;
  });
});
