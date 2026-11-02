import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PythonQuest from './PythonQuest';
import { trackEvent } from '../../utils/trackEvent';

// ── Today's Python quest on Home ────────────────────────────────────────────
// The editor is replaced by a box that hands back whatever "output" is typed,
// so the quest's own checking and saving are what is tested, not Pyodide.

jest.mock('react-router-dom', () => {
  const React = require('react');
  return { Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children) };
}, { virtual: true });
jest.mock('../../config/api', () => ({ API_BASE_URL: 'http://codeit.test' }));
jest.mock('../../utils/trackEvent', () => ({ trackEvent: jest.fn(() => Promise.resolve(true)) }));
jest.mock('../../components/CodeRunnerPython', () => (props) => (
  <div>
    <textarea aria-label="code" defaultValue={props.starterCode} />
    <textarea aria-label="output" />
    <button type="button" onClick={() => props.onOutput(globalThis.document.querySelector('[aria-label=output]').value, globalThis.document.querySelector('[aria-label=code]').value)}>Run</button>
  </div>
));

const QUEST = { id: 'count-to-ten', title: 'Count to ten', task: 'Print 1 to 10.', starter: 'for n in range(1, 11):\n    print(n)\n', mustPrint: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], mustUse: ['for', 'range'], day: '2026-11-02', xp: 15, done: false };
const run = (output) => { fireEvent.change(screen.getByLabelText('output'), { target: { value: output } }); fireEvent.click(screen.getByRole('button', { name: 'Run' })); };

beforeEach(() => { trackEvent.mockClear(); });

test('a wrong output says what is missing; the right one is sent, paid and marked done', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: async () => ({ ok: true, xpEarned: 15, alreadyDone: false, streak: 3, level: { n: 1, xp: 15 } }) }));
  const onDone = jest.fn();
  render(<PythonQuest quest={QUEST} token="t" onDone={onDone} />);
  expect(screen.getByText('Count to ten')).toBeInTheDocument();
  expect(screen.getByText('15 XP')).toBeInTheDocument();
  run('1\n2\n3');
  expect(screen.getByRole('status')).toHaveTextContent('The output should include "4".');
  run('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');
  await waitFor(() => expect(screen.getByText(/15 XP banked and today counts/)).toBeInTheDocument());
  const [url, options] = global.fetch.mock.calls[0];
  expect(url).toBe('http://codeit.test/api/today/python-quest');
  expect(JSON.parse(options.body)).toMatchObject({ output: '1\n2\n3\n4\n5\n6\n7\n8\n9\n10' });
  expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ streak: 3 }));
  expect(trackEvent).toHaveBeenCalledWith('python_quest', 'done');
  expect(screen.getByText('+15 XP')).toBeInTheDocument();
});

test('a guest who passes is told an account keeps the XP, and nothing is sent', async () => {
  global.fetch = jest.fn();
  render(<PythonQuest quest={QUEST} token={null} />);
  run('1\n2\n3\n4\n5\n6\n7\n8\n9\n10');
  expect(await screen.findByText(/A free account/)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(trackEvent).toHaveBeenCalledWith('python_quest', 'guest');
});

test('already done today: no editor, a plain line, tomorrow has a new one', () => {
  render(<PythonQuest quest={{ ...QUEST, done: true }} token="t" />);
  expect(screen.queryByRole('button', { name: 'Run' })).toBeNull();
  expect(screen.getByText(/Already done today/)).toBeInTheDocument();
});
