import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PredictOutput, FillBlank, OrderSteps } from './LessonInteractions';
import { BLANK, checkFillBlank, checkOrder } from './interactionGrading';

// These run on school Chromebooks and iPads. Everything a child touches has to
// be a real button. reachable by tap, by mouse, and by keyboard. because
// HTML5 drag-and-drop is none of those things on a tablet.

describe('PredictOutput', () => {
  const step = {
    type: 'predict',
    question: 'What does this print?',
    code: 'print(1 + 1)',
    choices: ['1', '2', '11', 'An error'],
    correct: 1,
  };

  test('shows the question, the code and every choice', () => {
    render(<PredictOutput step={step} chosen={undefined} onChoose={() => {}} />);
    expect(screen.getByText('What does this print?')).toBeInTheDocument();
    expect(screen.getByText('print(1 + 1)')).toBeInTheDocument();
    step.choices.forEach(choice => expect(screen.getByText(choice)).toBeInTheDocument());
  });

  test('every choice is a button, so it works by tap and by keyboard', () => {
    render(<PredictOutput step={step} chosen={undefined} onChoose={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(step.choices.length);
  });

  test('clicking a choice reports its index, not its text', () => {
    const onChoose = jest.fn();
    render(<PredictOutput step={step} chosen={undefined} onChoose={onChoose} />);
    fireEvent.click(screen.getByText('11'));
    expect(onChoose).toHaveBeenCalledWith(2);
  });

  test('the chosen answer is announced to assistive tech, not just coloured', () => {
    render(<PredictOutput step={step} chosen={1} onChoose={() => {}} />);
    const pressed = screen.getAllByRole('button', { pressed: true });
    expect(pressed).toHaveLength(1);
    expect(pressed[0]).toHaveTextContent('2');
  });

  test('once the step is done the answer cannot be changed', () => {
    const onChoose = jest.fn();
    render(<PredictOutput step={step} chosen={1} onChoose={onChoose} locked />);
    fireEvent.click(screen.getByText('11'));
    expect(onChoose).not.toHaveBeenCalled();
  });
});

describe('FillBlank', () => {
  const step = {
    type: 'fillblank',
    question: 'Finish the line.',
    template: `${BLANK} = ${BLANK}`,
    options: ['score', 'print', '10', '"ten"'],
    answers: ['score', '10'],
  };

  // A wrapper, because filling a blank is a conversation between two clicks and
  // the component holds only the "which hole is active" half of it.
  function Harness({ locked }) {
    const [filled, setFilled] = useState([null, null]);
    return (
      <>
        <FillBlank step={step} filled={filled} onFill={setFilled} locked={locked} />
        <output data-testid="state">{JSON.stringify(filled)}</output>
      </>
    );
  }

  test('shows an empty gap for each blank in the template', () => {
    render(<Harness />);
    expect(screen.getByLabelText(/Blank 1, empty/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blank 2, empty/)).toBeInTheDocument();
  });

  test('tapping a word fills the first gap, then the next', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('score'));
    expect(screen.getByTestId('state')).toHaveTextContent('["score",null]');
    fireEvent.click(screen.getByText('10'));
    expect(screen.getByTestId('state')).toHaveTextContent('["score","10"]');
  });

  test('the finished template grades as correct', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('score'));
    fireEvent.click(screen.getByText('10'));
    expect(checkFillBlank(step, ['score', '10'])).toBe(true);
  });

  test('a child who changes their mind can take a word back out', () => {
    render(<Harness />);
    fireEvent.click(screen.getByText('score'));
    fireEvent.click(screen.getByLabelText(/Blank 1, filled with score/));
    expect(screen.getByTestId('state')).toHaveTextContent('[null,null]');
  });

  test('putting the words in the wrong holes does not grade as correct', () => {
    expect(checkFillBlank(step, ['10', 'score'])).toBe(false);
  });

  test('nothing moves once the step is done', () => {
    render(<Harness locked />);
    fireEvent.click(screen.getByText('score'));
    expect(screen.getByTestId('state')).toHaveTextContent('[null,null]');
  });
});

describe('OrderSteps', () => {
  const step = {
    type: 'order',
    question: 'Put these in order.',
    shuffled: ['b = 2', 'a = 1', 'print(a + b)'],
    correctOrder: ['a = 1', 'b = 2', 'print(a + b)'],
  };

  function Harness({ locked }) {
    const [arranged, setArranged] = useState(step.shuffled);
    return (
      <>
        <OrderSteps step={step} arranged={arranged} onArrange={setArranged} locked={locked} />
        <output data-testid="state">{arranged.join(' | ')}</output>
      </>
    );
  }

  test('every line is reachable by keyboard through a labelled button', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Line 1: b = 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Move line 2 up')).toBeInTheDocument();
    expect(screen.getByLabelText('Move line 1 down')).toBeInTheDocument();
  });

  test('the first line cannot be moved up and the last cannot be moved down', () => {
    render(<Harness />);
    expect(screen.getByLabelText('Move line 1 up')).toBeDisabled();
    expect(screen.getByLabelText('Move line 3 down')).toBeDisabled();
  });

  test('moving a line up reorders the list and grades correct', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('Move line 2 up'));
    expect(screen.getByTestId('state')).toHaveTextContent('a = 1 | b = 2 | print(a + b)');
    expect(checkOrder(step, ['a = 1', 'b = 2', 'print(a + b)'])).toBe(true);
  });

  test('the starting order is wrong, so there is something to solve', () => {
    expect(checkOrder(step, step.shuffled)).toBe(false);
  });

  test('nothing moves once the step is done', () => {
    render(<Harness locked />);
    expect(screen.getByLabelText('Move line 2 up')).toBeDisabled();
  });
});
