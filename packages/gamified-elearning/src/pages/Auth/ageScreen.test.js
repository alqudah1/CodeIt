import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import Register from './Register';

// ── A gate that announces its threshold is not a gate ────────────────────────
//
// The signup form used to say "Ages 13 and up" on the account-type card, say it
// again beside the birthday field, and then explain in the error exactly which
// birthdays would have worked. A ten-year-old read the rule, changed the year,
// and continued. Fifteen seconds to defeat, on the first page a careful parent
// or a journalist pokes at.
//
// The rule stays. The way it is asked changes: no cutoff on screen, a refusal
// that does not explain itself, and the first birthday of the session is the
// one that counts.

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    Link: ({ children, to }) => React.createElement('a', { href: to }, children),
    useLocation: () => ({ state: null, search: '' }),
    useNavigate: () => mockNavigate,
  };
}, { virtual: true });
jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ login: jest.fn() }) }));
jest.mock('../../hooks/useSEO', () => ({ useSEO: jest.fn() }));
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));

const yearsAgo = (n) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
};

async function fillStudent(dob) {
  fireEvent.click(screen.getByRole('button', { name: /I am learning to code/ }));
  fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'skyfox' } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'longenough12' } });
  fireEvent.change(screen.getByLabelText('Birthday'), { target: { value: dob } });
  fireEvent.click(screen.getByRole('button', { name: /Create account/ }));
}

describe('the neutral age screen', () => {
  beforeEach(() => { sessionStorage.clear(); axios.post.mockReset(); mockNavigate.mockClear(); });

  test('the cutoff is nowhere on the screen', () => {
    render(<Register />);
    expect(document.body.textContent).not.toMatch(/13/);
    expect(document.body.textContent).not.toMatch(/5 to 12/);
    fireEvent.click(screen.getByRole('button', { name: /I am learning to code/ }));
    expect(document.body.textContent).not.toMatch(/13/);
    expect(document.body.textContent).not.toMatch(/ages? \d/i);
  });

  test('a child under the line is thanked and handed to a parent, without being told the line', async () => {
    render(<Register />);
    await fillStudent(yearsAgo(10));
    const lead = await screen.findByText(/we need a parent or guardian/);
    expect(lead).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/13|under|too young/i);
    expect(axios.post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Ask a parent to set this up/ }));
    expect(screen.getByRole('heading', { name: /Create your account|learner profile|adult account/i })).toBeInTheDocument();
  });

  test('the first birthday of the session is the one that counts', async () => {
    const { unmount } = render(<Register />);
    await fillStudent(yearsAgo(10));
    await screen.findByText(/we need a parent or guardian/);
    unmount();

    // Back again, older this time.
    render(<Register />);
    fireEvent.click(screen.getByRole('button', { name: /I am learning to code/ }));
    const field = screen.getByLabelText('Birthday');
    expect(field).toHaveValue(yearsAgo(10));
    expect(field).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'skyfox' } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'longenough12' } });
    fireEvent.click(screen.getByRole('button', { name: /Create account/ }));
    await screen.findByText(/we need a parent or guardian/);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('a learner over the line signs up as before', async () => {
    axios.post.mockResolvedValue({ data: { user: { id: 1, role: 'student' }, token: 't' } });
    render(<Register />);
    await fillStudent(yearsAgo(15));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(axios.post.mock.calls[0][1]).toMatchObject({ accountType: 'student', dob: yearsAgo(15) });
  });
});
