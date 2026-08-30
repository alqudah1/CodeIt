import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api';
import './EvidenceShare.css';

// ── The page a parent sends ─────────────────────────────────────────────────
//
// Every competitor issues a certificate, and a certificate proves attendance.
// This page holds the thing no certificate holds: the sentences the server
// wrote only after this child answered questions about code in their own
// project. It opens from a link on any phone, needs no account, and shows a
// first name, the sentences, and nothing else.

const EvidenceShare = () => {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let alive = true;
    fetch(`${API_BASE_URL}/api/understanding/shared/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(body => {
        if (!alive) return;
        if (body.success) setState({ status: 'ok', ...body });
        else setState({ status: 'gone', message: body.error });
      })
      .catch(() => alive && setState({ status: 'gone', message: 'Could not load the page. Check your connection and try again.' }));
    return () => { alive = false; };
  }, [token]);

  if (state.status === 'loading') {
    return <div className="evs"><p className="evs__quiet">Opening…</p></div>;
  }

  if (state.status === 'gone') {
    return (
      <div className="evs">
        <div className="evs__card">
          <h1 className="evs__title">This link has expired</h1>
          <p>{state.message || 'Ask the family for a fresh one — they can make another in a few seconds.'}</p>
          <Link className="evs__home" to="/">What is CodeIt?</Link>
        </div>
      </div>
    );
  }

  const { name, records } = state;
  const shown = (records || []).filter(r => (r.skills || []).length > 0);

  return (
    <div className="evs">
      <div className="evs__card">
        <p className="evs__kicker">Real understanding, in {name}&rsquo;s own words</p>
        <h1 className="evs__title">What {name} can explain</h1>
        <p className="evs__how">
          {name} built these projects on CodeIt, then answered questions about the code inside
          them. Each sentence below was recorded only after a correct explanation — nothing here
          is generated, estimated, or awarded for showing up.
        </p>

        {shown.length === 0 && (
          <p className="evs__quiet">
            {name} hasn&rsquo;t recorded an explanation yet — the first one lands here the moment
            they prove one in the studio.
          </p>
        )}

        <ul className="evs__list">
          {shown.map(record => (
            <li className="evs__project" key={record.projectKey}>
              <div className="evs__project-head">
                <span className="evs__project-title">{record.projectTitle}</span>
                {record.at && (
                  <span className="evs__date">
                    {new Date(record.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
              {record.skills.map(skill => (
                <p className="evs__skill" key={skill}><span aria-hidden="true">✓</span> {skill}</p>
              ))}
            </li>
          ))}
        </ul>

        <p className="evs__foot">
          From <Link to="/">CodeIt</Link> — where kids describe an idea, get a real program,
          and learn to change the code inside it.
        </p>
      </div>
    </div>
  );
};

export default EvidenceShare;
