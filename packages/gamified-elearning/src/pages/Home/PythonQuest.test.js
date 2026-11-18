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

const QUEST = { id: 'count-to-ten', title: 'Count to ten', task: 'This counts to 5. Make it count to 10.', starter: 'for n in range(1, 6):\n    print(n)\n', hint: 'range(1, 6) stops just before 6. Which number should it stop before, to reach 10?', mustPrint: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'], mustUse: ['for', 'range'], xp: 15 };
const DONE = 'for n in range(1, 11):\n    print(n)\n';
// The child's code (the finished loop unless a test says otherwise) and what it printed.
const run = (output, code = DONE) => {
  fireEvent.change(screen.getByLabelText('code'), { target: { value: code } });
  fireEvent.change(screen.getByLabelText('output'), { target: { value: output } });
  fireEvent.click(screen.getByRole('button', { name: 'Run' }));
};

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

// ── A quest is one change the child makes ───────────────────────────────────
// Until 17 November 2026 the code that arrived was the finished answer, and
// pressing Run on it paid 15 XP and a day on the streak.

test('the code as it came is not the quest done: it says so, and nothing is sent', () => {
  global.fetch = jest.fn();
  render(<PythonQuest quest={QUEST} token="t" />);
  run('1\n2\n3\n4\n5', QUEST.starter);
  expect(screen.getByRole('status')).toHaveTextContent('That is the code as it came, and it runs. Now make the change the task asks for.');
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.queryByText(/XP banked/)).toBeNull();
});

test('the clue comes with the second run that is not there yet, not the first', () => {
  global.fetch = jest.fn();
  render(<PythonQuest quest={QUEST} token="t" />);
  run('1\n2\n3\n4\n5', QUEST.starter);
  expect(screen.queryByText(/A clue:/)).toBeNull();
  run('1\n2\n3\n4\n5\n6\n7', 'for n in range(1, 8):\n    print(n)\n');
  expect(screen.getByRole('status')).toHaveTextContent('The output should include "8".');
  expect(screen.getByRole('status')).toHaveTextContent('A clue: range(1, 6) stops just before 6. Which number should it stop before, to reach 10?');
});

test('the bank the page falls back to has no finished starters either', () => {
  const { PYTHON_QUESTS, checkPythonQuest, pythonQuestFor } = require('./pythonQuests');
  for (const quest of PYTHON_QUESTS) {
    expect(quest.starter).not.toBe(quest.solution);
    expect(checkPythonQuest(quest, quest.starter, 'anything').ok).toBe(false);
  }
  expect(pythonQuestFor('2026-11-17T10:00:00Z').solution).toBeUndefined();
});
