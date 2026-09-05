import { fireEvent, render, screen } from '@testing-library/react';
import Register from './Register';

// ── Rounds 68 to 71: the signup form ─────────────────────────────────────────
//
// On a phone the birthday field was prefilled with a real date (which undoes
// the age gate), and the subtitle repeated the heading. These hold the
// behaviour; the layout rules are in Auth.css and checked in the browser.

let mockLocation = { state: null, search: '' };
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    useLocation: () => mockLocation,
    useNavigate: () => jest.fn(),
  };
}, { virtual: true });
jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login: jest.fn() }) }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));

beforeEach(() => { sessionStorage.clear(); mockLocation = { state: null, search: '' }; });

test('the birthday starts empty, is required, and is not autofilled', () => {
  render(<Register />);
  fireEvent.click(screen.getByRole('button', { name: /I am learning to code/ }));
  const dob = screen.getByLabelText('Birthday');
  expect(dob.value).toBe('');
  expect(dob).toBeRequired();
  expect(dob.getAttribute('autocomplete')).toBe('off');
  expect(dob.getAttribute('placeholder')).toBeNull();
  expect(dob.getAttribute('max')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test('no subtitle under the heading; one line says what the form is', () => {
  render(<Register />);
  fireEvent.click(screen.getByRole('button', { name: /I am learning to code/ }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pick a name. Everything you make is saved to it.');
  expect(screen.queryByText(/Pick a username, then turn your first idea/)).toBeNull();
  expect(document.querySelector('.auth-header p')).toBeNull();
});

test('a child with a project in hand sees it running above the form', () => {
  sessionStorage.setItem('codeit_builder_draft', JSON.stringify({
    code: '<!doctype html><html><body><canvas></canvas><script>var s=0;</script></body></html>',
    prompt: 'a rocket game', savedAt: Date.now(),
  }));
  mockLocation = { state: { from: '/builder', resumeBuilderAction: 'save' }, search: '?from=builder&action=save' };
  render(<Register />);
  fireEvent.click(screen.getByRole('button', { name: /Save with a learner account/ }));
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Your project is ready. Give yourself a name and it is saved.');
  const frame = document.querySelector('.auth-draft iframe');
  expect(frame).not.toBeNull();
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
  expect(frame.getAttribute('srcdoc')).toMatch(/canvas/);
});
