import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import COMPANY from '../../config/company';
import { useSEO } from '../../hooks/useSEO';
import '../Guide/Guide.css';

export default function About() {
  useSEO({
    canonical: '/about',
  });

  return (
    <>
      <Header />
      <main className="guide-page">
        <p className="guide-page__kicker">About</p>
        <h1>About CodeIt</h1>
        <div className="guide-body">
          <p>
            CodeIt is a browser-based coding studio built for ages 8 to 14. Younger children can use it alongside an adult, and older beginners are welcome. A learner describes
            a website, game or quiz; CodeIt builds a working first version; and then the learner
            opens it up and changes it. The project stays editable rather than becoming a finished
            result you can only look at.
          </p>
          <p>
            It is built in {COMPANY.locationLine()}
            {COMPANY.founderName ? ` by ${COMPANY.founderName}` : ''}.
          </p>

          <h2>Why it exists</h2>
          <p>
            Most tools for young coders are block-based, and blocks are a good on-ramp,{' '}
            <a href="https://scratch.mit.edu/" target="_blank" rel="noopener noreferrer">Scratch</a>{' '}
            in particular has taught an enormous number of children to think in loops and
            conditionals. The gap is on the other side of it.
          </p>
          <p>
            A ten-year-old who has outgrown blocks is stuck. Block tools keep the real code
            hidden for good, and text editors ask a child to type code before they have made
            anything worth caring about. Codecademy&rsquo;s terms of service require users to be sixteen. freeCodeCamp is
            free and excellent but was not designed for children. The platforms built for kids are,
            with few exceptions, blocks-first by design. CodeIt exists for that gap.
          </p>

          <h2>How it works</h2>
          <p>
            The loop is: make something, see the code, change the code, save the project, and share
            what was built. Starting from a working project rather than an empty file means a
            beginner has something to be curious about on day one, and seeing the effect of a single
            change is where the understanding comes from. The typing was never the hard part.
          </p>
          <p>
            CodeIt also asks questions drawn from the learner&rsquo;s own project, where the correct
            answer is whatever they actually wrote. Only questions answered correctly first time
            count. That is there so a parent can see what a child could explain, not only what got
            produced.
          </p>

          <h2>Who it is for, and who it is not for</h2>
          <p>
            It suits a learner roughly between 8 and 16 who has outgrown block coding, or a beginner
            of any age who wants to build web projects and understand what they are made of. It also
            suits a parent who cannot code, because the activities use plain language and visible
            results.
          </p>
          <p>
            It is <strong>not</strong> right for a pre-reading child,{' '}
            <a href="https://www.kodable.com/" target="_blank" rel="noopener noreferrer">Kodable</a>{' '}
            and{' '}
            <a href="https://codespark.com/" target="_blank" rel="noopener noreferrer">codeSpark</a>{' '}
            are built for that and are better at it. It is not right for a learner who mainly wants
            to keep making games, where{' '}
            <a href="https://codecombat.com/" target="_blank" rel="noopener noreferrer">CodeCombat</a>{' '}
            or Roblox Studio fit better. And it is not a schools product: there is no rostering, no
            LMS integration, no standards alignment and no teacher dashboard.
          </p>

          <h2>Accounts, ages and safety</h2>
          <p>
            Parents and legal guardians create private managed profiles for learners aged 5 to 12,
            after confirming the adult account&rsquo;s email address. Independent student accounts
            begin at 13.
          </p>
          <p>
            Saved projects are private by default, and eligible independent accounts must actively
            choose Publish before a project appears publicly.{' '}
            <strong>Managed profiles for ages 5 to 12 cannot publish projects at all.</strong>{' '}
            Leaderboards use coder aliases rather than real names.
          </p>

          <h2>What it costs</h2>
          <p>
            CodeIt has a free plan that does not expire and needs no card. A paid family
            plan is available at CA$12 per month, cancellable at any time, and nothing starts
            charging on its own. We are not going to promise the free plan will always be as
            generous as it is now, because we do not know that.
          </p>

          <h2>Not to be confused with</h2>
          <p>
            CodeIt at codeitlearn.com is unrelated to CodeIT at{' '}
            <a href="https://codeitlearning.com/" target="_blank" rel="noopener noreferrer">codeitlearning.com</a>{' '}
            (a coding tutoring company in London),{' '}
            <a href="https://outreach.mit.edu/programs/mit-codeit/" target="_blank" rel="noopener noreferrer">MIT CodeIt</a>{' '}
            (a youth outreach programme at MIT), CodeIT at{' '}
            <a href="https://codeit.us/" target="_blank" rel="noopener noreferrer">codeit.us</a>{' '}
            (a software engineering services company), or CodeIt.right (a C# code analysis tool).
          </p>

          {COMPANY.contactEmail ? (
            <>
              <h2>Contact</h2>
              <p>
                <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>
                {COMPANY.founderName ? `, ${COMPANY.founderName}` : ''}
              </p>
            </>
          ) : null}
        </div>

        <nav className="guide-page__nav" aria-label="Continue on CodeIt">
          <Link to="/faq">Frequently asked questions</Link>
          <Link to="/guide">Guides</Link>
          <Link to="/coding-for-kids">Parent guide</Link>
          <Link to="/builder">Build a project</Link>
        </nav>
      </main>
    </>
  );
}
