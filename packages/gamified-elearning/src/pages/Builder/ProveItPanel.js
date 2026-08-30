// ── "Show it's yours" ────────────────────────────────────────────────────────
//
// The engine behind this has existed for a while and nobody has ever seen it.
// It reads a child's own project and generates questions that can only be
// answered by someone who has looked at their own code: not "what does let
// mean" but "in YOUR project, what does score start as" — where the right
// answer is whatever they actually wrote.
//
// This is the screen that makes CodeIt worth paying for, and the framing is the
// whole design. It is not a test and it must never feel like one:
//
//   * It is called showing the project is yours, because that is what it is.
//     An AI wrote the first draft; answering these is how it stops being the
//     AI's project and starts being theirs.
//   * A wrong answer costs nothing. It explains, and the question comes back
//     later in the same run. Nobody fails; they either finish or they leave.
//   * There is no score and no timer. A percentage would invite comparison
//     between children and tell a parent nothing about their own.
//   * It is skippable. A gate a five-year-old cannot pass is a wall.
//
// What a child gets is a moment. What a parent gets is the only honest answer
// to the question every parent is now asking: the machine wrote the code, so
// what did my child actually do?

import { useMemo, useState } from 'react';
import { isEnoughToProve, questionsFor } from './proveIt';
import { skillsShown } from '../../utils/understanding';
import './ProveItPanel.css';

// Named ProveItPanel, not ProveIt: the engine next door is proveIt.js, and two
// files whose names differ only by case cannot coexist on a case-insensitive
// filesystem — which is what every Mac in this project's history has used. The
// build catches it, but only after the rename has already been made.
export default function ProveItPanel({ code, projectTitle = 'this project', onProved, alreadyProved = false }) {
  const questions = useMemo(() => questionsFor(code, { max: 3 }), [code]);

  const [stage, setStage] = useState(alreadyProved ? 'done' : 'idle');
  const [order, setOrder] = useState([]);
  const [at, setAt] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [missed, setMissed] = useState([]);
  const [shown, setShown] = useState([]);

  // Nothing we can ask about honestly, so we do not ask. A child is never shown
  // a made-up question about a project too simple to have anything in it.
  if (!isEnoughToProve(questions)) return null;

  const question = questions[order[at]];

  function begin() {
    setOrder(questions.map((_, index) => index));
    setAt(0);
    setChosen(null);
    setMissed([]);
    setStage('asking');
  }

  function choose(index) {
    if (chosen !== null) return;
    setChosen(index);
    if (index !== question.correct && !missed.includes(question.id)) {
      setMissed(list => [...list, question.id]);
    }
  }

  function next() {
    const wasRight = chosen === question.correct;

    if (!wasRight) {
      // Ask it again rather than marking them down. The point is that they end
      // up understanding it, not that we measure the first try.
      const remaining = [...order];
      const [current] = remaining.splice(at, 1);
      remaining.push(current);
      setOrder(remaining);
      setChosen(null);
      return;
    }

    if (at + 1 >= order.length) {
      // Only questions they got right FIRST time count as evidence.
      //
      // A wrong answer here shows the right one along with the explanation, so
      // getting it on the second go proves they can read an explanation, which
      // is good but is not the thing we are claiming. An earlier version of
      // this graded against an answer key it built itself out of the correct
      // answers — which meant every question always counted and the record was
      // worthless the moment anyone retried.
      const skills = skillsShown(questions, missed);
      // The ids travel too: the server refuses to take sentences from the
      // client and writes its own from these ids.
      const questionIds = (questions || [])
        .filter(question => question && !missed.includes(question.id))
        .map(question => question.id);
      setShown(skills);
      setStage('done');
      if (skills.length) onProved?.({ skills, questionIds });
      return;
    }

    setAt(at + 1);
    setChosen(null);
  }

  if (stage === 'idle') {
    return (
      <section className="prove prove--idle" aria-labelledby="prove-title">
        <h3 className="prove__title" id="prove-title">Show this one is yours</h3>
        <p className="prove__lead">
          {questions.length} questions about the code in <strong>{projectTitle}</strong>. Not
          about coding in general. About the lines in your project.
        </p>
        <button type="button" className="prove__start" onClick={begin}>
          I can explain it →
        </button>
      </section>
    );
  }

  if (stage === 'done') {
    return (
      <section className="prove prove--done" aria-labelledby="prove-title">
        <h3 className="prove__title" id="prove-title">
          <span className="prove__tick" aria-hidden="true">✓</span>
          You explained it. This one is yours.
        </h3>
        {shown.length > 0 ? (
          <>
            <p className="prove__lead">Here is what you showed you understood:</p>
            <ul className="prove__skills">
              {shown.map(skill => <li key={skill}>{skill}</li>)}
            </ul>
          </>
        ) : (
          <p className="prove__lead">
            You worked all of them out. Have a go at another project and see if you can
            explain that one straight away.
          </p>
        )}
        {shown.length > 0 && (
          <p className="prove__note">A grown-up can see this on your progress page.</p>
        )}
      </section>
    );
  }

  const answered = chosen !== null;
  const right = answered && chosen === question.correct;

  return (
    <section className="prove prove--asking" aria-labelledby="prove-title">
      <div className="prove__head">
        <h3 className="prove__title" id="prove-title">Show this one is yours</h3>
        <span className="prove__count">{at + 1} of {order.length}</span>
      </div>

      <p className="prove__question">{question.question}</p>

      {question.code && (
        <pre className="prove__code"><code>{question.code}</code></pre>
      )}

      <ul className="prove__choices">
        {question.choices.map((choice, index) => {
          const state = !answered ? ''
            : index === question.correct ? ' is-right'
            : index === chosen ? ' is-wrong'
            : ' is-dim';
          return (
            <li key={choice}>
              <button
                type="button"
                className={`prove__choice${state}`}
                onClick={() => choose(index)}
                disabled={answered}
              >
                {choice}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div className={`prove__after${right ? ' is-right' : ' is-wrong'}`} role="status">
          <strong>{right ? 'That is it.' : 'Not that one. Here is why.'}</strong>
          <p>{question.explain}</p>
          <button type="button" className="prove__next" onClick={next}>
            {right
              ? (at + 1 >= order.length ? 'Finish' : 'Next question')
              : (order.length > 1 ? 'Got it. Carry on' : 'Have another go')}
          </button>
        </div>
      )}
    </section>
  );
}
