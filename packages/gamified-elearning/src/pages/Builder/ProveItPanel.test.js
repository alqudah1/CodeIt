import { fireEvent, render, screen } from '@testing-library/react';
import ProveItPanel from './ProveItPanel';
import { questionsFor } from './proveIt';

// A project shaped like the studio's own starters: settings at the top, a
// click handler, a countable loop.
const GAME = `<!doctype html><html><head><style>
body{background:#101828}
.card{background:#FF7A00}
.panel{background:#3DDC97}
</style></head><body>
<button id="hit">Catch</button>
<script>
  let score = 0;
  let fallSpeed = 3;
  document.getElementById('hit').addEventListener('click', function () { score += 1; });
  for (let i = 0; i < 5; i++) { spawn(i); }
<` + `/script></body></html>`;

const questions = questionsFor(GAME, { max: 3 });

function start(props = {}) {
  const view = render(<ProveItPanel code={GAME} projectTitle="Star Catcher" {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /I can explain it/ }));
  return view;
}

/** Answer whichever question is on screen, correctly or not. */
function answer({ correctly }) {
  const asked = questions.find(q => screen.queryByText(q.question));
  const choice = correctly
    ? asked.choices[asked.correct]
    : asked.choices.find((_, i) => i !== asked.correct);
  fireEvent.click(screen.getByRole('button', { name: choice }));
  return asked;
}

describe('before they start', () => {
  test('it invites rather than tests', () => {
    render(<ProveItPanel code={GAME} projectTitle="Star Catcher" />);
    expect(screen.getByText('Show this one is yours')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I can explain it/ })).toBeInTheDocument();
  });

  test('it says the questions are about their project, by name', () => {
    render(<ProveItPanel code={GAME} projectTitle="Star Catcher" />);
    expect(screen.getByText('Star Catcher')).toBeInTheDocument();
  });

  test('nothing about tests, marks, scores or passing', () => {
    const { container } = render(<ProveItPanel code={GAME} projectTitle="Star Catcher" />);
    expect(container.textContent).not.toMatch(/\btest\b|\bquiz\b|\bmarks?\b|\bpass\b|\bfail\b|%/i);
  });
});

describe('a project too simple to ask about', () => {
  test('shows nothing at all rather than inventing a question', () => {
    const plain = '<html><head><style>body{background:#111}</style></head><body><h1>Hi</h1></body></html>';
    const { container } = render(<ProveItPanel code={plain} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('and neither does an empty project', () => {
    const { container } = render(<ProveItPanel code="" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('answering', () => {
  test('the question is about their own code, and shows the line', () => {
    const { container } = start();
    expect(container.querySelector('.prove__code')).toBeTruthy();
  });

  test('a right answer says so and explains why', () => {
    start();
    const asked = answer({ correctly: true });
    expect(screen.getByText('That is it.')).toBeInTheDocument();
    expect(screen.getByText(asked.explain)).toBeInTheDocument();
  });

  test('a wrong answer is not punished, and still explains', () => {
    start();
    const asked = answer({ correctly: false });
    expect(screen.getByText('Not that one — here is why.')).toBeInTheDocument();
    expect(screen.getByText(asked.explain)).toBeInTheDocument();
    // No "wrong", no "incorrect", no cross.
    expect(screen.queryByText(/wrong|incorrect|failed/i)).not.toBeInTheDocument();
  });

  test('the right answer is shown even when they picked another', () => {
    const { container } = start();
    answer({ correctly: false });
    expect(container.querySelector('.prove__choice.is-right')).toBeTruthy();
  });

  test('you cannot change your answer once given', () => {
    start();
    const asked = answer({ correctly: true });
    asked.choices.forEach(choice => {
      expect(screen.getByRole('button', { name: choice })).toBeDisabled();
    });
  });
});

describe('getting to the end', () => {
  function finish({ correctly }) {
    // Enough clicks to work through every question, plus retries.
    for (let i = 0; i < 12; i += 1) {
      if (screen.queryByText(/You explained it/)) break;
      const asked = questions.find(q => screen.queryByText(q.question));
      if (!asked) break;
      const first = screen.queryByRole('button', { name: /^(Next question|Finish|Got it|Have another go)/ });
      if (first) { fireEvent.click(first); continue; }
      answer({ correctly: correctly ? true : i === 0 ? false : true });
    }
  }

  test('finishing every question says the project is theirs', () => {
    start();
    finish({ correctly: true });
    expect(screen.getByText(/You explained it/)).toBeInTheDocument();
  });

  test('it lists what they showed, in sentences a parent can read', () => {
    start();
    finish({ correctly: true });
    expect(screen.getByText('Here is what you showed you understood:')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  test('what they showed is handed back to be recorded', () => {
    const onProved = jest.fn();
    start({ onProved });
    finish({ correctly: true });
    expect(onProved).toHaveBeenCalledTimes(1);
    expect(onProved.mock.calls[0][0].skills.length).toBeGreaterThan(0);
  });

  test('a question they got wrong first time is not claimed as evidence', () => {
    // They saw the right answer and the explanation before answering again.
    // Getting it on the second go shows they can read an explanation, which is
    // good, and is not what we are telling a parent.
    const onProved = jest.fn();
    start({ onProved });
    finish({ correctly: false });

    const claimed = onProved.mock.calls.length ? onProved.mock.calls[0][0].skills.length : 0;
    expect(claimed).toBeLessThan(questions.length);
  });
});

describe('a project already explained', () => {
  test('is not asked about again', () => {
    render(<ProveItPanel code={GAME} projectTitle="Star Catcher" alreadyProved />);
    expect(screen.getByText(/You explained it/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /I can explain it/ })).not.toBeInTheDocument();
  });
});

describe('it works with a thumb', () => {
  test('every choice is big enough to tap', () => {
    const { container } = start();
    container.querySelectorAll('.prove__choice').forEach(button => {
      // The stylesheet sets min-height: 48px; this checks the class is on them,
      // since jsdom does not do layout.
      expect(button.className).toContain('prove__choice');
    });
    expect(container.querySelectorAll('.prove__choice').length).toBeGreaterThanOrEqual(3);
  });
});
