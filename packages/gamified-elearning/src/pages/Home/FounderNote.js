import COMPANY from '../../config/company';
import './FounderNote.css';

// ── A person, on a page that has none ────────────────────────────────────────
//
// Nobody is named anywhere on codeitlearn.com. No one built it, no one answers
// it, no one is accountable for it. That absence is most of what makes a site
// read as machine-made, more than any individual sentence on it.
//
// This block renders only when COMPANY.founderNote has a real sentence in it.
// The sentence is not written here and is not written by me: a founder's reason
// for building something is the one line on a site that cannot be drafted by
// anybody else, and a plausible invented one is worse than an empty page.
export default function FounderNote() {
  const note = String(COMPANY.founderNote || '').trim();
  if (!note || !COMPANY.founderName) return null;

  return (
    <section className="founder" aria-labelledby="founder-title">
      {COMPANY.founderPhoto ? (
        <img className="founder__photo" src={COMPANY.founderPhoto} alt={COMPANY.founderName} />
      ) : null}
      <div className="founder__body">
        <h2 id="founder-title" className="founder__title">From the person who made this</h2>
        <p className="founder__note">{note}</p>
        {COMPANY.contactEmail ? (
          <p className="founder__contact">
            If something is broken or your child gets stuck, email me at{' '}
            <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a> and I will answer.
          </p>
        ) : null}
        <p className="founder__sign">
          {COMPANY.founderName}, {COMPANY.city}
        </p>
      </div>
    </section>
  );
}
