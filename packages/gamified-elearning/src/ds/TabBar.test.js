import { render, screen } from '@testing-library/react';
import TabBar, { ADULT_TABS, tabsFor } from './TabBar';
import { AuthContext } from '../context/AuthContext';

// The phone's bottom bar. A child gets Home, Build, Arcade, Me. A signed-in
// adult gets Classes, This week, Build, Me: a teacher at the front of the room
// was shown a child's Home and Arcade and no way to the class.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });

const hrefs = () => screen.getAllByRole('link').map((a) => a.getAttribute('href'));
const mount = (user) => render(<AuthContext.Provider value={{ user }}><TabBar /></AuthContext.Provider>);

test('who gets which four', () => {
  expect(tabsFor(null).map((t) => t.label)).toEqual(['Home', 'Build', 'Arcade', 'Me']);
  expect(tabsFor({ role: 'student' }).map((t) => t.label)).toEqual(['Home', 'Build', 'Arcade', 'Me']);
  expect(tabsFor({ role: 'student', managedProfile: true }).map((t) => t.label)).toEqual(['Home', 'Build', 'Arcade', 'Me']);
  expect(tabsFor({ role: 'Educator' }).map((t) => t.label)).toEqual(['Classes', 'This week', 'Build', 'Me']);
  expect(ADULT_TABS).toHaveLength(4);
});

test('a teacher on a phone has a tab back to the class', () => {
  mount({ id: 7, role: 'educator' });
  expect(hrefs()).toEqual(['/teach', '/parent', '/build', '/profile']);
});

test('a child keeps their four, and a page with no sign-in context still renders', () => {
  mount({ id: 9, role: 'student' });
  expect(hrefs()).toEqual(['/home', '/build', '/arcade', '/profile']);
});
