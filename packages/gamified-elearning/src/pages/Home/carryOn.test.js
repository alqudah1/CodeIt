import { render, screen } from '@testing-library/react';
import Home from './Home';
import { rememberGuestLesson } from '../../utils/guestLessons';
import { STAGES } from '../Lessons/lessonStages';

// ── The front page forgot a child between visits ─────────────────────────────
//
// A guest can do whole lessons with no account. The next day the big orange
// button still said "Start your first Python lesson" and opened Lesson 1, to
// a child who had finished three. The lessons they finish are remembered on
// the device (utils/guestLessons.js), so the button can say where they are.

let mockAuth = { user: null, token: null };

jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to, onClick, ...props }) => React.createElement('a', {
      href: to,
      onClick: (event) => { event.preventDefault(); onClick?.(event); },
      ...props,
    }, children),
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('../Header/Header', () => () => null);
jest.mock('../../components/BrandLogo/BrandLogo', () => ({ alt = 'CodeIt', ...props }) => <img alt={alt} {...props} />);
jest.mock('../../context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn() }));

beforeEach(() => { mockAuth = { user: null, token: null }; sessionStorage.clear(); localStorage.clear(); });

test('a new visitor is offered their first lesson', () => {
  render(<Home />);
  expect(screen.getByRole('link', { name: /Start your first Python lesson/ })).toHaveAttribute('href', '/lesson/1');
  expect(screen.queryByRole('link', { name: /Carry on with Lesson/ })).not.toBeInTheDocument();
});

test('a guest who finished lessons 1 to 3 here is offered Lesson 4', () => {
  rememberGuestLesson(1); rememberGuestLesson(2); rememberGuestLesson(3);
  render(<Home />);
  const button = screen.getByRole('link', { name: /Carry on with Lesson 4/ });
  expect(button).toHaveAttribute('href', '/lesson/4');
  expect(button).toHaveAttribute('data-cta', 'hero-carry-on');
  expect(screen.queryByRole('link', { name: /Start your first Python lesson/ })).not.toBeInTheDocument();
});

test('a guest who finished every lesson is not sent to one that does not exist', () => {
  const last = STAGES[STAGES.length - 1].to;
  for (let id = 1; id <= last; id += 1) rememberGuestLesson(id);
  render(<Home />);
  expect(screen.queryByRole('link', { name: /Carry on with Lesson/ })).not.toBeInTheDocument();
});
