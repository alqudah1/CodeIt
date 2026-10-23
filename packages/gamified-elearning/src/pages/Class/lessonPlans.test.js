import { render, screen } from '@testing-library/react';
import Plans from './Plans';
import { PLANS } from './lessonPlans';
import { POWERS } from '../Powers/powers';

// ── Twelve plans, one per power, each a class a teacher can read aloud ──────

let mockParams = {};
jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children), useParams: () => mockParams };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));

test('every power has a plan with a board sentence, six timed steps inside 45 minutes, and what to look for', () => {
  expect(PLANS).toHaveLength(POWERS.length);
  for (const plan of PLANS) {
    expect(plan.sentence.length).toBeGreaterThan(10);
    expect(plan.lookFor.length).toBeGreaterThan(20);
    expect(plan.steps).toHaveLength(6);
    expect(plan.steps[0].min).toBe(0);
    expect(plan.steps[plan.steps.length - 1].min).toBeLessThan(45);
    expect(plan.steps.map((s) => s.min)).toEqual([...plan.steps.map((s) => s.min)].sort((a, b) => a - b));
    const text = [plan.title, plan.sentence, plan.lookFor, ...plan.steps.map((s) => s.text)].join(' ');
    expect(text).not.toMatch(/—/);
  }
});

test('the index lists twelve and a plan reads as a class', () => {
  mockParams = {};
  const index = render(<Plans />);
  expect(screen.getAllByRole('link', { name: /Board:/ })).toHaveLength(12);
  index.unmount();
  mockParams = { slug: 'loops' };
  render(<Plans />);
  expect(screen.getByText('Loops. Make waves.')).toBeInTheDocument();
  expect(screen.getByText('a ship that shoots asteroids that come in waves')).toBeInTheDocument();
  expect(screen.getByText('The power: Loops')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Next: Timers' })).toHaveAttribute('href', '/teach/plans/timers');
  expect(screen.getByRole('link', { name: 'Open the power' })).toHaveAttribute('href', '/powers/loops');
});
