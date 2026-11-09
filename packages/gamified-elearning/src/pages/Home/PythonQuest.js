// ── Today's Python quest ────────────────────────────────────────────────────
//
// One small task a day: a sentence, three lines of starter code, Run. The
// output is checked here, so the tick is instant, and again on the server,
// which pays the XP once and counts the day for the streak. A guest can do it
// and is told, once it passes, that an account would keep the XP.
//
// Python is a ten megabyte download, so the editor only fetches it on the
// first Run (loadPython 'demand'), not when Home opens.

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import CodeRunnerPython from '../../components/CodeRunnerPython';
import { API_BASE_URL } from '../../config/api';
import { trackEvent } from '../../utils/trackEvent';
import { checkPythonQuest } from './pythonQuests';
import './PythonQuest.css';

export default function PythonQuest({ quest, token, onDone }) {
  const [state, setState] = useState('idle'); // idle | wrong | saving | done | keep
  const [reason, setReason] = useState('');
  const [earned, setEarned] = useState(0);

  const handleOutput = useCallback(async (output, code) => {
    if (!quest || quest.done || state === 'done' || state === 'keep') return;
    const verdict = checkPythonQuest(quest, code, output);
    if (!verdict.ok) { setState('wrong'); setReason(verdict.reason); return; }
    setReason('');
    if (!token) {
      // Passed, with nobody to pay. Said plainly, and the streak on this page
      // is the shelf's, so it does not move.
      setState('keep');
      void trackEvent('python_quest', 'guest');
      return;
    }
    setState('saving');
    try {
      const res = await fetch(`${API_BASE_URL}/api/today/python-quest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code, output }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setState('wrong'); setReason(data.reason || 'That did not save. Run it once more.'); return; }
      setEarned(Number(data.xpEarned) || 0);
      setState('done');
      void trackEvent('python_quest', data.alreadyDone ? 'again' : 'done');
      onDone?.(data);
    } catch {
      setState('wrong'); setReason('That did not save. Run it once more.');
    }
  }, [quest, state, token, onDone]);

  if (!quest) return null;
  // The server's answer arrives after the first paint, so "done" is read from
  // the quest it hands over, not copied once into state.
  const done = state === 'done' || Boolean(quest.done);

  return (
    <section className={`pq ci-blk ci-rise${done ? ' is-done' : ''}`} aria-labelledby="pq-title">
      <div className="pq__head">
        <div>
          <div className="ci-ey pq__ey">{done ? "Today's Python: done" : "Today's Python"}</div>
          <h2 id="pq-title" className="pq__title">{quest.title}</h2>
          <p className="pq__task">{quest.task}</p>
        </div>
        <div className="pq__xp" aria-label={`${quest.xp} XP`}>{done ? (earned > 0 ? `+${earned} XP` : 'Done') : `${quest.xp} XP`}</div>
      </div>
      {!done && (
        <CodeRunnerPython
          starterCode={quest.starter}
          title="Python"
          height="150px"
          loadPython="demand"
          theme="dark"
          onOutput={handleOutput}
        />
      )}
      {state === 'wrong' && <p className="pq__note pq__note--wrong" role="status">{reason}</p>}
      {state === 'saving' && <p className="pq__note" role="status">Checking...</p>}
      {state === 'keep' && (
        <p className="pq__note pq__note--keep" role="status">
          That works. <Link to="/register">A free account</Link> keeps the {quest.xp} XP and your days in a row.
        </p>
      )}
      {done && (
        <p className="pq__note pq__note--done" role="status">
          {earned > 0 ? `Nice. ${earned} XP banked and today counts.` : 'Already done today. Tomorrow has a new one.'}
          {' '}<Link to="/lessons">Keep going in the lessons</Link>.
        </p>
      )}
    </section>
  );
}
