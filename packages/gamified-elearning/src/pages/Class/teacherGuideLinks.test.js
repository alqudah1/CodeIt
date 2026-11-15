import { render, screen } from '@testing-library/react';
import Plans from './Plans';
import Teach from './Teach';
import Schools, { FAMILY_PLAN_CHILDREN } from '../Schools/Schools';
import { PLANS_INDEX, TEACH_LANDING } from './lessonPlans';
import schoolFacts from '../../data/schoolFacts';
import GUIDE_PAGES from '../../data/guidePages';
import COMPANY from '../../config/company';
import { PRICE_PER_INTERVAL } from '../../config/pricing';
import { AuthContext } from '../../context/AuthContext';

// ── Two guides for teachers that only one page linked to ─────────────────────
//
// 15 November 2026: /guide/cs-education-week-coding-hour and
// /guide/glitch-for-classrooms were reachable from the /guide index and from
// nowhere else, so a search engine weighed them as unimportant and a teacher
// on /teach could not find them. One plain line on each teacher page, the
// same words in each place, written in the two files the static generator
// also reads, so the crawlable copy can carry the same link.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, state, ...props }) => React.createElement('a', { href: to, ...props }, children),
    useParams: () => ({}),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/teach', search: '', state: null }),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/SiteFooter/SiteFooter', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

const CS_WEEK = {
  lead: 'Planning a coding hour for CS Education Week?',
  text: 'Read the hour minute by minute',
  href: '/guide/cs-education-week-coding-hour',
};
const GLITCH = { lead: '', text: 'Moving a class off Glitch?', href: '/guide/glitch-for-classrooms' };
const facts = schoolFacts({ contactEmail: COMPANY.contactEmail, pricePerInterval: PRICE_PER_INTERVAL, maxChildren: FAMILY_PLAN_CHILDREN });

test('the words are in the files the static generator reads, the same in each place', () => {
  expect(TEACH_LANDING.guideLinks).toEqual([CS_WEEK]);
  expect(PLANS_INDEX.guideLinks).toEqual([CS_WEEK]);
  // schoolFacts.js cannot import, so the line is typed again there.
  expect(facts.guideLinks).toEqual([CS_WEEK, GLITCH]);
});

test('each link goes to a guide that exists, and none of the words has an em dash', () => {
  const slugs = GUIDE_PAGES.map((page) => `/guide/${page.slug}`);
  for (const guide of facts.guideLinks) {
    expect(slugs).toContain(guide.href);
    expect(`${guide.lead} ${guide.text}`).not.toMatch(/—/);
  }
});

test('/teach shows the line to a teacher who has not signed in yet', () => {
  render(<AuthContext.Provider value={{ user: null, token: null, login: jest.fn() }}><Teach /></AuthContext.Provider>);
  const link = screen.getByRole('link', { name: CS_WEEK.text });
  expect(link).toHaveAttribute('href', CS_WEEK.href);
  expect(link.closest('p')).toHaveTextContent('Planning a coding hour for CS Education Week? Read the hour minute by minute.');
});

test('/teach/plans shows the same line above the twelve plans', () => {
  render(<Plans />);
  const link = screen.getByRole('link', { name: CS_WEEK.text });
  expect(link).toHaveAttribute('href', CS_WEEK.href);
  expect(link.closest('p')).toHaveTextContent('Planning a coding hour for CS Education Week? Read the hour minute by minute.');
  const firstPlan = screen.getAllByRole('link', { name: /Board:/ })[0];
  expect(link.compareDocumentPosition(firstPlan) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('/schools shows the same line, and the one about Glitch', () => {
  render(<Schools />);
  const week = screen.getByRole('link', { name: CS_WEEK.text });
  expect(week).toHaveAttribute('href', CS_WEEK.href);
  expect(week.closest('p')).toHaveTextContent('Planning a coding hour for CS Education Week? Read the hour minute by minute.');
  const glitch = screen.getByRole('link', { name: 'Moving a class off Glitch?' });
  expect(glitch).toHaveAttribute('href', GLITCH.href);
  // A question that is the link has nothing added after it.
  expect(glitch.closest('p').textContent).toBe('Moving a class off Glitch?');
});
