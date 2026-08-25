// ── What a parent gets for their money ───────────────────────────────────────
//
// Every parent looking at an AI coding tool is asking the same quiet question:
// the machine wrote the code, so what did my child actually do?
//
// A streak does not answer it. Nor does "12 projects created", nor minutes
// spent, nor a level. Those are facts about our product. This is a fact about
// their child: they were asked something about a line in a game they made, and
// they got it right.
//
// It sits on the front page rather than behind an account, because the parent
// most likely to be persuaded is the one standing behind a child who has been
// using CodeIt without one.
//
// The child's own screen says "a grown-up can see this on your progress page".
// This is the thing that makes that sentence true, and it should never say more
// than the record actually holds.

import { listUnderstanding, summarise } from '../../utils/understanding';
import './Evidence.css';

function when(at) {
  const days = Math.floor((Date.now() - Number(at)) / 86_400_000);
  if (!Number.isFinite(days) || days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return 'earlier';
}

export default function Evidence({ records = null }) {
  let list = records;
  if (list === null) {
    try {
      list = listUnderstanding(window.localStorage);
    } catch {
      list = [];
    }
  }

  if (!list.length) return null;

  const summary = summarise(list);
  const skills = [...new Set(list.flatMap(entry => entry.skills || []))];

  return (
    <section className="evidence" aria-labelledby="evidence-title">
      <h2 className="evidence__title" id="evidence-title">For a grown-up</h2>
      <p className="evidence__summary">{summary}</p>

      <ul className="evidence__skills">
        {skills.map(skill => <li key={skill}>{skill}</li>)}
      </ul>

      <ul className="evidence__projects">
        {list.slice(0, 4).map(entry => (
          <li key={entry.projectId}>
            <span className="evidence__project">{entry.projectTitle}</span>
            <span className="evidence__when">explained {when(entry.at)}</span>
          </li>
        ))}
      </ul>

      <p className="evidence__note">
        Each of these was a question generated from that child's own code. The answer was
        whatever they had written, so it could not be guessed by someone who had not read it.
      </p>
    </section>
  );
}
