import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import { useSEO } from '../../hooks/useSEO';
import './CreatorBrief.css';

const CHANNEL_LINKS = [
  ['instagram', 'Instagram', 'https://codeitlearn.com/?utm_source=instagram&utm_medium=creator'],
  ['tiktok', 'TikTok', 'https://codeitlearn.com/?utm_source=tiktok&utm_medium=creator'],
  ['youtube', 'YouTube', 'https://codeitlearn.com/?utm_source=youtube&utm_medium=creator'],
  ['linkedin', 'LinkedIn', 'https://codeitlearn.com/?utm_source=linkedin&utm_medium=founder'],
  ['referral', 'Direct sharing', 'https://codeitlearn.com/?utm_source=referral&utm_medium=creator'],
];

const DEMO_STEPS = [
  ['01', 'Start with the finished result', 'Open a working quiz, game, or website before explaining features.'],
  ['02', 'Show where the idea began', 'Use one short prompt, then explain that the first version removes the intimidating blank screen.'],
  ['03', 'Change one visible thing', 'Edit a colour, rule, label, or animation so viewers see that the student controls the project.'],
  ['04', 'Connect it to one concept', 'Show the code behind the score, button, loop, or condition—then end with one call to action.'],
];

const CONTENT_FORMATS = [
  {
    label: 'Project reveal',
    hook: '“I asked CodeIt to build a space quiz.”',
    sequence: 'Finished quiz → original idea → one quick edit',
    cta: 'Build a free project.',
  },
  {
    label: 'Change one thing',
    hook: '“A beginner can actually control what this makes.”',
    sequence: 'Before → colour or behaviour change → code connection',
    cta: 'Make your first project.',
  },
  {
    label: 'Parent value',
    hook: '“This shows parents what a student actually built.”',
    sequence: 'Project milestone → parent-approved update → what the student made',
    cta: 'Join the Founding Family pilot.',
  },
];

export default function CreatorBrief() {
  const [copied, setCopied] = useState('');

  useSEO({
    title: 'CodeIt Creator Brief',
    description: 'An unlisted collaboration brief for demonstrating and promoting CodeIt accurately.',
    canonical: '/creator-brief',
    robots: 'noindex,nofollow',
  });

  const copyLink = async (channel, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(channel);
    } catch {
      setCopied('manual');
    }
  };

  return (
    <div className="creator-brief">
      <header className="creator-brief__header">
        <Link to="/" aria-label="CodeIt home"><BrandLogo className="creator-brief__logo" /></Link>
        <span>Unlisted creator briefing</span>
      </header>

      <main>
        <section className="creator-brief__hero">
          <p className="creator-brief__eyebrow">CodeIt × creator collaboration</p>
          <h1>Show the result first.<br /><span>Then show the learning.</span></h1>
          <p className="creator-brief__lead">
            This page gives you the product story, demonstration order, content hooks, tracked links,
            and claim boundaries needed to promote CodeIt clearly.
          </p>
          <blockquote>
            CodeIt helps students turn an idea into a real website, game, or quiz—then learn,
            edit, save, and share the code behind what they built.
          </blockquote>
          <div className="creator-brief__hero-actions">
            <Link to="/builder">Open the project studio <span aria-hidden="true">→</span></Link>
            <a href="#campaign-links">Get your tracked link</a>
          </div>
        </section>

        <section className="creator-brief__audience" aria-label="CodeIt audience and promise">
          <article><span>Primary user</span><strong>Young creators ages 8–17</strong><p>Parents can create private managed profiles for ages 8–12; independent student accounts begin at 13.</p></article>
          <article><span>Primary buyer</span><strong>Parents and guardians</strong><p>Adults who want visible, understandable progress.</p></article>
          <article><span>Product difference</span><strong>Build first, then understand</strong><p>General AI builders make; CodeIt connects making to learning.</p></article>
        </section>

        <section className="creator-brief__section" aria-labelledby="walkthrough-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">Three-minute walkthrough</p>
            <h2 id="walkthrough-title">One continuous story. No feature dump.</h2>
          </div>
          <div className="creator-brief__steps">
            {DEMO_STEPS.map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
          <aside className="creator-brief__prompt">
            <span>Reliable demonstration prompt</span>
            <p>Build a colourful space quiz with three questions, a score counter, and confetti when I finish.</p>
          </aside>
        </section>

        <section id="campaign-links" className="creator-brief__section creator-brief__links" aria-labelledby="links-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">Tracked campaign links</p>
            <h2 id="links-title">Five links. One website.</h2>
            <p>
              Use the Instagram link on Instagram, TikTok on TikTok, YouTube in video descriptions,
              LinkedIn for founder or investor posts, and Direct sharing for WhatsApp, email, or messages. Each opens the same CodeIt homepage;
              the tag only tells the dashboard which channel brought the visit.
            </p>
          </div>
          <div className="creator-brief__link-grid">
            {CHANNEL_LINKS.map(([channel, label, url]) => (
              <article key={channel}>
                <div><span>{label}</span>{copied === channel && <strong role="status">Copied</strong>}</div>
                <input aria-label={`${label} campaign link`} value={url} readOnly onFocus={(event) => event.target.select()} />
                <button type="button" onClick={() => copyLink(channel, url)}>Copy link</button>
              </article>
            ))}
          </div>
          {copied === 'manual' && <p className="creator-brief__copy-note" role="status">Copying was blocked by the browser. Select the link and copy it manually.</p>}
        </section>

        <section className="creator-brief__section" aria-labelledby="formats-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">Short-form content</p>
            <h2 id="formats-title">Three repeatable formats.</h2>
            <p>Keep most videos 15–35 seconds, add captions, and show the result in the first two seconds.</p>
          </div>
          <div className="creator-brief__format-grid">
            {CONTENT_FORMATS.map((format) => (
              <article key={format.label}>
                <span>{format.label}</span>
                <h3>{format.hook}</h3>
                <p>{format.sequence}</p>
                <strong>CTA: {format.cta}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="creator-brief__section creator-brief__claims" aria-labelledby="claims-title">
          <div className="creator-brief__section-heading">
            <p className="creator-brief__eyebrow">Trust comes first</p>
            <h2 id="claims-title">What you can say—and what is still planned.</h2>
          </div>
          <div>
            <article className="is-approved">
              <h3>Say this</h3>
              <ul>
                <li>Students can build, edit, save, and publish projects.</li>
                <li>CodeIt connects visible project behaviour to coding concepts.</li>
                <li>The core beginner experience has a free starting option.</li>
                <li>Confirmed parents can receive selected milestone emails from a student profile.</li>
                <li>Parents can create private managed profiles for learners ages 8–12.</li>
              </ul>
            </article>
            <article className="is-planned">
              <h3>Label this as planned</h3>
              <ul>
                <li>The Founding Family plan is proposed at US$12/month; billing is not live.</li>
                <li>Never promise grades, guaranteed learning, or career outcomes.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="creator-brief__scorecard">
          <div>
            <p className="creator-brief__eyebrow">First seven-day test</p>
            <h2>Views are not the finish line.</h2>
            <p>Publish three project videos and one parent-value video. Use one call to action per post.</p>
          </div>
          <ol>
            <li><span>01</span><strong>Qualified visits</strong><small>Did the right audience reach CodeIt?</small></li>
            <li><span>02</span><strong>Projects started</strong><small>Did visitors try the core experience?</small></li>
            <li><span>03</span><strong>Parent interest</strong><small>Did adults view pricing or join the pilot?</small></li>
          </ol>
        </section>

        <section className="creator-brief__final">
          <p className="creator-brief__eyebrow">The one-line close</p>
          <h2>Start with an idea. Leave with something real.</h2>
          <div>
            <Link to="/builder">Rehearse the demo <span aria-hidden="true">→</span></Link>
            <a href="mailto:hello@codeitlearn.com?subject=CodeIt%20creator%20collaboration">Ask a collaboration question</a>
          </div>
        </section>
      </main>
    </div>
  );
}
