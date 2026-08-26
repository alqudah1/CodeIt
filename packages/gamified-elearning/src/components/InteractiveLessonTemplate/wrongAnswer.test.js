import { render, screen, fireEvent } from '@testing-library/react';
import { PredictOutput } from './LessonInteractions';

// ── What a child sees after getting one wrong ────────────────────────────────
//
// Lesson 1, on a real phone, reported by the owner. A child tapped "Hello
// Python", pressed Check my answer, and was told no — and the answer they had
// tapped looked exactly as it had a second earlier: same orange outline, same
// letter, same everything. The only sign was a sentence *below* the big orange
// button, and the button below that read "Check your answer to advance", which
// is precisely what they had just done.
//
// Nothing was broken. A second attempt worked. But three things on the screen
// said nothing had happened and one small line said it had, and no adult was
// there to explain which to believe. The whole point of this product is that
// nobody has to be.

const STEP = {
  type: 'predict',
  question: 'What does this print?',
  code: 'print("Hello")\nprint("Python")',
  choices: ['Hello Python', 'Hello\nPython', 'HelloPython', '"Hello"\n"Python"'],
  correct: 1,
};

test('before it is checked, a pick just looks picked', () => {
  render(<PredictOutput step={STEP} chosen={0} onChoose={() => {}} />);
  const first = screen.getByRole('button', { name: /Hello Python/ });
  expect(first.className).toContain('li-choice--chosen');
  expect(first.className).not.toContain('li-choice--wrong');
});

test('once it has been checked and was wrong, the answer itself says so', () => {
  render(<PredictOutput step={STEP} chosen={0} wrong={0} onChoose={() => {}} />);
  const first = screen.getByRole('button', { name: /Hello Python/ });
  expect(first.className).toContain('li-choice--wrong');
});

test('it does not say so in colour alone', () => {
  // Roughly one boy in twelve cannot tell this product's orange from its red.
  // A state carried only by a border colour is a state they do not have.
  render(<PredictOutput step={STEP} chosen={0} wrong={0} onChoose={() => {}} />);
  expect(screen.getByText('Not this one')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Hello Python/ })).toHaveTextContent('✗');
});

test('only the answer they actually chose is marked', () => {
  // Marking every wrong option would hand over the answer.
  render(<PredictOutput step={STEP} chosen={0} wrong={0} onChoose={() => {}} />);
  const marked = screen.getAllByRole('button').filter(b => b.className.includes('li-choice--wrong'));
  expect(marked).toHaveLength(1);
  expect(screen.queryAllByText('Not this one')).toHaveLength(1);
});

test('the right answer is never given away', () => {
  render(<PredictOutput step={STEP} chosen={0} wrong={0} onChoose={() => {}} />);
  const buttons = screen.getAllByRole('button');
  for (const button of buttons) {
    expect(button.className).not.toContain('li-choice--correct');
  }
});

test('they can still change their mind afterwards', () => {
  const onChoose = jest.fn();
  render(<PredictOutput step={STEP} chosen={0} wrong={0} onChoose={onChoose} />);
  fireEvent.click(screen.getByRole('button', { name: /HelloPython/ }));
  expect(onChoose).toHaveBeenCalledWith(2);
});

test('a step that is finished is locked, wrong or not', () => {
  const onChoose = jest.fn();
  render(<PredictOutput step={STEP} chosen={1} onChoose={onChoose} locked />);
  fireEvent.click(screen.getByRole('button', { name: /HelloPython/ }));
  expect(onChoose).not.toHaveBeenCalled();
});
