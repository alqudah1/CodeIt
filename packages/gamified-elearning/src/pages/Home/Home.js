import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";
import Header from "../Header/Header";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { useSEO } from "../../hooks/useSEO";
import { trackEvent } from "../../utils/trackEvent";
import HomePilotSignup from "./HomePilotSignup";
import { HOME_PICKS } from "../Builder/starterGames";
import { conceptsIn } from "../Builder/codeConcepts";
import Icon from "../../components/Icon/Icon";
import { STARTER_PROJECTS } from "../Builder/starterProjects";
import { TOTAL_LESSONS } from "../Lessons/lessonRegistry";
import { CURRENCY_SYMBOL } from "../../config/pricing";
import YourShelf from "./YourShelf";
import RecentProjects from "./RecentProjects";
import FounderNote from "./FounderNote";
import Evidence from "./Evidence";
import TryPython from "./TryPython";
import { listProjects, migrateLegacyDraft } from "../../utils/projectShelf";
import "./Home.css";
import "./HomeStudio.css";
import CharacterAvatar from '../../components/CharacterAvatar/CharacterAvatar';
import { useCharacterDisplay } from '../../context/CharacterContext';

// A three-panel mock of a project called "Mission Control Quiz" used to cycle
// here, beside a picture of a laptop. It was a drawing of the product, and the
// hero column it filled now holds the product itself: a real editor running
// real Python in the visitor's own browser. You draw a picture of the thing
// when you cannot show the thing.

const STARTING_POINTS = [
  {
    number: "01",
    title: "Describe the idea",
    copy: "A student starts with a website, game, quiz, or school project they genuinely want to make.",
    link: "/builder",
    linkLabel: "Open the studio",
  },
  {
    number: "02",
    title: "Build and experiment",
    copy: "CodeIt creates a working first version. The student plays with it, edits it, and sees every change.",
    link: "/playground",
    linkLabel: "Explore the playground",
  },
  {
    number: "03",
    title: "Learn, own, and share it",
    copy: "Short lessons explain the code, then the student saves or publishes a project they understand.",
    link: "/lessons",
    linkLabel: "See the learning path",
  },
];

const POPULAR_LESSONS = [
  [1, "Your first Python program"],
  [2, "Variables and stored information"],
  [4, "Making decisions with if statements"],
  [6, "Repeating ideas with loops"],
];
const HOME_VIEW_SESSION_KEY = "codeit_homepage_view_recorded";

export default function Home() {
  const { user, token } = useAuth();
  const { character } = useCharacterDisplay();
  const navigate = useNavigate();
  const ideaInputRef = useRef(null);
  const [heroIdea, setHeroIdea] = useState("");
  const [latestProject, setLatestProject] = useState(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(HOME_VIEW_SESSION_KEY) === "yes") return;
      sessionStorage.setItem(HOME_VIEW_SESSION_KEY, "yes");
      void trackEvent("homepage_view", null, token);
    } catch (_) {
      // Measurement must never interrupt the homepage.
    }
  }, [token]);

  useEffect(() => {
    if (!user || !token) {
      setLatestProject(null);
      return undefined;
    }

    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/builder/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.projects?.length) setLatestProject(data.projects[0]);
      })
      .catch(() => {});

    return () => controller.abort();
  }, [user, token]);

  // What this child has already made, on this device. Read once on mount: a
  // returning child should see their own work before they see anything we have
  // to say about ourselves.
  const [shelf, setShelf] = useState([]);

  // The first game on the shelf, read for real. Three concepts is what fits on
  // a phone without the section becoming a wall; the reader returns them in the
  // order they appear in CONCEPTS, which runs simple to less simple.
  const firstGame = HOME_PICKS[0];
  const insideFirstGame = useMemo(
    () => (firstGame ? conceptsIn(firstGame.html || firstGame.code).slice(0, 3) : []),
    [firstGame]
  );
  useEffect(() => {
    try {
      migrateLegacyDraft(window.localStorage);
      setShelf(listProjects(window.localStorage));
    } catch {
      // No storage (private window, locked-down device). The picker below still
      // works; there is simply nothing to carry on with.
      setShelf([]);
    }
  }, []);

  const startHeroIdea = (event) => {
    event.preventDefault();
    const idea = heroIdea.trim();
    if (!idea) {
      ideaInputRef.current?.focus();
      return;
    }
    trackEvent("landing_cta_click", "hero-idea");
    navigate(`/builder?prompt=${encodeURIComponent(idea)}`);
  };

  useSEO({
    canonical: "/",
  });

  return (
    <>
      <Header />
      <div className="studio-home">
        <main>
          <section className="studio-hero" aria-labelledby="studio-title">
            <div className="studio-hero__copy">
              <p className="studio-kicker">Coding for ages 5 to 18</p>
              {/* A returning kid gets their OWN face here, not just their name.
                  The same avatar they built in the lab and play as in their
                  games — so the hero is unmistakably theirs. */}
              {user && (
                <p className="studio-welcome">
                  <span className="studio-welcome__face" aria-hidden="true">
                    <CharacterAvatar character={character} compact size={44} />
                  </span>
                  Welcome back, {user.name || "Builder"}.
                </p>
              )}
              {/* A returning child does not need the pitch. They have already
                  bought it. They made something. On a phone this headline is
                  350px tall, which pushed their own work off the first screen,
                  so when there is work to come back to it steps aside.

                  Search engines and first-time visitors still get the full
                  heading: the shelf only fills from this device's storage, so
                  a crawler never has one. */}
              {shelf.length ? (
                <h1 id="studio-title" className="studio-hero__title--compact">
                  Welcome back. Your work is right here.
                </h1>
              ) : (
                /* "Make a real game. Then see the code inside it." led this
                   page for months, and the first section under it was the AI
                   studio: describe an idea and we make it. That is precisely
                   the sentence a parent worried the computer does the work for
                   their child is scanning for a reason to leave.
                   The two strongest things this site owns answer that worry
                   directly: lesson 1 and the playground both open with no
                   account and neither has any AI in it. They lead now. */
                <h1 id="studio-title">
                  Your child types the Python.
                  <span>The computer does not do it for them.</span>
                </h1>
              )}
              <YourShelf
                projects={shelf}
                onOpen={() => trackEvent("landing_cta_click", "shelf")}
              />

              {/* ── The sentence the page never said out loud ────────────────
                  It has been true since the day the lessons shipped and it is
                  the whole differentiator, and a visitor had no way of knowing
                  it. Stated plainly, above the fold, with both doors beside
                  it. */}
              <p className="studio-hero__nolie">
                <strong>No AI in the lessons or the playground.</strong>{" "}
                Your child types the code, and Python answers.
              </p>

              <Evidence />

              {/* Two doors, both of which open on a real thing with no
                  account: lesson 1 is a written lesson with a Python editor in
                  it, and the playground is eleven templates and a Run button.
                  "See how it works" used to sit here, which is an invitation to
                  read further down a page rather than to use the product. */}
              <div className="studio-hero__actions">
                {latestProject && (
                  <Link
                    to={`/builder?project=${encodeURIComponent(latestProject.id)}`}
                    className="studio-button studio-button--primary"
                    onClick={() => trackEvent("landing_cta_click", "member-resume-project", token)}
                  >
                    Continue {latestProject.title} <span aria-hidden="true">→</span>
                  </Link>
                )}
                <Link
                  to="/lesson/1"
                  className={`studio-button ${latestProject ? "studio-button--quiet" : "studio-button--primary"}`}
                  data-cta="hero-lesson-one"
                  onClick={() => trackEvent("landing_cta_click", "hero-lesson-one")}
                >
                  Open Lesson 1 free <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/playground"
                  className="studio-button studio-button--quiet"
                  data-cta="hero-playground"
                  onClick={() => trackEvent("landing_cta_click", "hero-playground")}
                >
                  Try the Python playground
                </Link>
                {user && (
                  <Link
                    to="/MainPage"
                    className="studio-button studio-button--quiet"
                    data-cta="member-progress"
                  >
                    View my progress
                  </Link>
                )}
              </div>
              {/* Three pills reading "Students create", "CodeIt teaches",
                  "Families see progress" sat here. Nobody can check any of
                  them, they are true of every product in this category, and
                  they were the last thing above the fold: the space where a
                  visitor decides whether this is a real company. Facts in the
                  same space instead, all three verifiable in a minute and each
                  one wired to the data rather than typed. */}
              <ul className="studio-hero__audience" aria-label="What is here">
                <li>{TOTAL_LESSONS} lessons</li>
                <li>{STARTER_PROJECTS.length} projects that open instantly</li>
                <li>No account needed</li>
              </ul>
            </div>

            {/* A returning child does not need the pitch panel. The headline
                already steps aside when there is work on the shelf; the demo
                beside it is the same pitch in pictures, and its three example
                buttons look exactly like the three buttons that start a real
                project — six near-identical taps, three of which only change a
                drawing. */}
            {/* The mock project panel that used to fill this column was a
                picture of the product. This is the product: a real editor, real
                Python, running in the visitor's own browser. A picture of a
                thing is what you show when you cannot show the thing. */}
            <div className="studio-hero__visual">
              {!shelf.length && <TryPython />}
              <figure className="studio-pixel">
                <img
                  src="/brand/pixel-mascot-hero.png"
                  alt="Pixel, CodeIt's friendly orange build buddy, creating a project on a laptop"
                />
                <figcaption><strong>Hi, I’m Pixel.</strong> What should we build?</figcaption>
              </figure>
            </div>
          </section>

          {/* ── Second, not first ────────────────────────────────────────────
              These three cards and the idea box are the AI studio, and they led
              this page. They are genuinely good and they are not the reason a
              parent should trust us, so they come after the part a parent can
              check. Everything in this section is optional; nothing above it
              touches the AI. */}
          <section className="studio-make" aria-labelledby="studio-make-title">
            <div className="studio-section-heading">
              <p className="studio-kicker">And when they want to make something</p>
              <h2 id="studio-make-title">The studio writes a first version, then hands it over.</h2>
              <p>This is where the AI lives, and it is optional. Separate from the lessons, and no account needed for it either.</p>
            </div>
            <div className="pick">
              <p className="pick__ask" id="pick-ask">
                {shelf.length
                  ? "Or start something new"
                  : user
                    ? "What do you want to make next?"
                    : "Tap a game. It starts now!"}
              </p>
              <ul className="pick__row" aria-labelledby="pick-ask">
                {HOME_PICKS.map((game) => (
                  <li key={game.id}>
                    <Link
                      className="pick__card"
                      to={`/builder?start=${game.id}`}
                      onClick={() => trackEvent("landing_cta_click", "starter")}
                    >
                      <span className="pick__emoji"><Icon name={game.icon} size={40} strokeWidth={1.5} /></span>
                      <span className="pick__label">{game.label}</span>
                      <span className="pick__blurb">{game.blurb}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <details className="pick__own">
                <summary>Or type your own idea</summary>
                <form className="studio-hero__idea" onSubmit={startHeroIdea}>
                  <label htmlFor="studio-hero-idea" className="pick__own-label">
                    What do you want to build?
                  </label>
                  <div className="studio-hero__idea-row">
                    <input
                      ref={ideaInputRef}
                      id="studio-hero-idea"
                      value={heroIdea}
                      onChange={(event) => setHeroIdea(event.target.value)}
                      placeholder="A space quiz, a football game…"
                      maxLength={240}
                      autoComplete="off"
                    />
                    <button type="submit">
                      Build it <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </form>
              </details>

              {/* "No account needed" also appears in the facts row below,
                  and saying it twice on one screen is how a claim starts to
                  sound like a slogan. This keeps the half the row does not
                  carry. */}
              <small className="pick__note">Nothing to download.</small>

              {/* "Play real games. Open them up. Make them yours." used to
                  sit here, saying for a third time on one screen what the
                  heading and the line above the cards already say. A
                  confident product says it once and shows the rest. */}
            </div>
          </section>

          <section className="studio-proof" aria-label="What makes CodeIt different">
            <p><strong>Make something real.</strong> You start with a game that already works, not an empty page.</p>
            <p><strong>See how it works.</strong> Every colour, score and speed on the screen is a line you can find and change.</p>
            <p><strong>Show someone.</strong> Save it, share a link, and your grown-up can see what you understood.</p>
          </section>

          {/* Real projects, by real children, near the top. /explore is the
              most convincing thing CodeIt has and the home page linked it once,
              as a text link, next to the footer. */}
          <RecentProjects />

          {/* ── The claim, demonstrated rather than asserted ─────────────────
              Three lines above this section say "every colour, score and speed
              on the screen is a line you can find and change". A stranger has
              no reason to believe that, and until now the page offered nothing
              to check it against: a picture of a project, and a sentence.

              These rows are read out of the real starter file at render time by
              the same reader the studio uses, so the line numbers are the line
              numbers, and the snippets are what is in the file. Nothing here
              can drift into a claim: if the game changes, this changes with it,
              and homeCodeProof.test.js fails if a line stops matching. */}
          {insideFirstGame.length > 0 && (
            <section className="studio-inside" aria-labelledby="studio-inside-title">
              <div className="studio-inside__heading">
                <p className="studio-kicker">Nothing is hidden</p>
                <h2 id="studio-inside-title">Open “{firstGame.label}” and this is what is inside it.</h2>
                <p>Real lines from the file the game runs on, and the lesson each one belongs to.</p>
              </div>
              <ul className="studio-inside__rows">
                {insideFirstGame.map((concept) => (
                  <li key={concept.id}>
                    <code className="studio-inside__code">{concept.snippet}</code>
                    <span className="studio-inside__line">line {concept.line}</span>
                    <Link
                      className="studio-inside__lesson"
                      to={`/lesson/${concept.lessonId}`}
                      onClick={() => trackEvent("landing_cta_click", "hero-lessons")}
                    >
                      {concept.label}, lesson {concept.lessonId}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="studio-inside__open" to={`/builder?start=${firstGame.id}`}>
                Open it and change a line
              </Link>
            </section>
          )}

          {/* ── What is true, rather than what sounds impressive ──────────────
              This block used to carry five rounded usage numbers and the words
              "verified in July 2026": a hard-coded date with nothing behind it,
              on a page whose whole job is being believed. Every number here is
              instead a fact about the product that a visitor can check in the
              next sixty seconds without an account. */}
          <section className="studio-traction" aria-labelledby="studio-traction-title">
            <div className="studio-traction__heading">
              <p className="studio-kicker">Free, and no account needed</p>
              <h2 id="studio-traction-title">You can check every number here yourself.</h2>
              <p>Nothing below asks for a card, an email, or a download. Open a game and it plays.</p>
            </div>
            <dl className="studio-traction__metrics">
              <div>
                <dt>Beginner Python lessons</dt>
                <dd>{TOTAL_LESSONS}</dd>
              </div>
              <div>
                <dt>Games, quizzes and shops you can open and change</dt>
                <dd>{STARTER_PROJECTS.length}</dd>
              </div>
              <div>
                <dt>Cost to start</dt>
                <dd>{CURRENCY_SYMBOL}0</dd>
              </div>
              <div>
                <dt>Things to install</dt>
                <dd>None</dd>
              </div>
            </dl>
          </section>

          <section className="studio-start" aria-labelledby="studio-start-title">
            <div className="studio-section-heading">
              <p className="studio-kicker">What a student actually does</p>
              <h2 id="studio-start-title">From “I have an idea” to “I built this.”</h2>
              <p>Starting is the hard part, so CodeIt writes a first version that already works. The lessons turn it into something you understand and can change yourself.</p>
            </div>
            <div className="studio-start__grid">
              {STARTING_POINTS.map((item) => (
                <article className="studio-start-card" key={item.number}>
                  <span className="studio-start-card__number">{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <Link to={item.link}>{item.linkLabel} <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          </section>

          <section id="family-pilot" className="studio-family" aria-labelledby="studio-family-title">
            <div className="studio-family__copy">
              <p className="studio-kicker">Progress parents can actually see</p>
              <h2 id="studio-family-title">Learning does not disappear when the screen closes.</h2>
              <p>CodeIt can send a parent-approved update when a student:</p>
              <ul>
                <li>finishes a lesson, exercise, quiz, or challenge;</li>
                <li>creates a new website or project;</li>
                <li>publishes something ready to share.</li>
              </ul>
              <small>Available from a student profile. Emails begin only after a parent confirms and chooses the updates they receive.</small>
              <div className="studio-family__setup">
                <div>
                  <strong>Using CodeIt with a learner ages 5 to 12?</strong>
                  <span>Create a free adult account, confirm your email, and make their private profile.</span>
                </div>
                <Link
                  to="/register?for=family"
                  onClick={() => trackEvent("parent_cta_click", "create-family-account")}
                >
                  Create a learner profile <span aria-hidden="true">→</span>
                </Link>
              </div>
              <HomePilotSignup />
              <Link
                to="/pricing"
                className="studio-family__cta"
                data-cta="family-pilot"
                onClick={() => trackEvent("parent_cta_click", "view-pricing")}
              >
                See full pilot details <span aria-hidden="true">→</span>
              </Link>
            </div>
            {/* A mock progress email about a child called Sam who published a
                project called "My Space Quiz" stood here. Neither exists. It
                was the only thing on the page that looked like evidence, and it
                was invented, which is the worst combination available.

                Real published projects now have their own section further up.
                An empty space is better than a fabricated child. */}
          </section>

          <section id="how-it-works" className="studio-loop" aria-labelledby="studio-loop-title">
            <div className="studio-loop__visual" aria-hidden="true">
              <div className="studio-loop__window">
                <div className="studio-loop__window-head"><i /><i /><i /><span>project.js</span></div>
                <pre><code><b>function</b> celebrate(score) {`{`}{"\n"}  <em>if</em> (score &gt; 3) {`{`}{"\n"}    showConfetti();{"\n"}  {`}`}{"\n"}{`}`}</code></pre>
              </div>
              <div className="studio-loop__lesson-card">
                <span>Concept unlocked</span>
                <strong>If statements</strong>
                <small>Use a condition to make your project react.</small>
              </div>
            </div>
            <div className="studio-loop__copy">
              {/* Was "The build → learn → improve loop". An arrow inside a
                  heading is a diagram someone could not be bothered to draw. */}
              <p className="studio-kicker">How a project actually gets made</p>
              <h2 id="studio-loop-title">A first version gives you momentum. The learning makes it yours.</h2>
              <ol>
                <li><span>1</span><div><strong>Describe</strong><p>Explain what you want to create in everyday language.</p></div></li>
                <li><span>2</span><div><strong>Build and play</strong><p>Use the working result immediately and notice what you want to change.</p></div></li>
                <li><span>3</span><div><strong>Open the code</strong><p>Learn the concept behind the behaviour, then edit and test it yourself.</p></div></li>
              </ol>
              <Link to="/builder" className="studio-text-link">See the studio in action <span aria-hidden="true">→</span></Link>
            </div>
          </section>

          <section className="studio-trust" aria-labelledby="studio-trust-title">
            <div>
              <p className="studio-kicker">What CodeIt delivers</p>
              <h2 id="studio-trust-title">One place for the complete beginner journey.</h2>
            </div>
            <div className="studio-trust__points">
              <article><strong>AI studio</strong><p>Students quickly create a first version, then keep control of what changes next.</p></article>
              <article><strong>Lessons and hands-on exercises</strong><p>Python concepts are explained through code students can run and test immediately.</p></article>
              <article><strong>Projects that belong to the student</strong><p>Save versions, return later, improve the work, and publish when it is ready.</p></article>
              <article><strong>Parent-approved progress updates</strong><p>Confirmed parents can receive plain-language emails about completed learning and creative work.</p></article>
            </div>
          </section>

          <section className="studio-final" aria-labelledby="studio-final-title">
            <div>
              <p className="studio-kicker">The CodeIt promise</p>
              {/* "Build it. Learn how it works. Make it yours. Share what you
                  created." sat under this headline, which is the same sentence
                  in different words, and the footer carried a third version of
                  it. Three of the same sentence on one page does not sound
                  confident; it sounds like a page trying to convince itself. */}
              <h2 id="studio-final-title">Start with an idea. Leave with something real.</h2>
            </div>
            <Link
              to="/builder"
              className="studio-button studio-button--dark"
              data-cta="final-build"
              onClick={() => trackEvent("landing_cta_click", "final-build")}
            >
              {user ? "Keep building" : "Start building for free"} <span aria-hidden="true">→</span>
            </Link>
          </section>
          <FounderNote />
        </main>

        <footer className="studio-footer">
          <div className="studio-footer__top">
            <div className="studio-footer__brand">
              <BrandLogo className="studio-footer__logo" />
            </div>
            <div>
              <strong>Build</strong>
              <Link to="/builder">Studio</Link>
              <Link to="/explore">Play and remix projects</Link>
              <Link to="/playground">Python playground</Link>
              <Link to="/lessons">Beginner lessons</Link>
            </div>
            <div>
              <strong>Learn</strong>
              {POPULAR_LESSONS.map(([id, title]) => <Link key={id} to={`/lesson/${id}`}>{title}</Link>)}
            </div>
            <div>
              <strong>About</strong>
              <Link to="/coding-for-kids">Coding for kids</Link>
              <Link to="/ai-website-builder-for-kids">AI website builder for kids</Link>
              <Link to="/blog">Guides and ideas</Link>
              <Link to="/pricing">Pricing</Link>
              <Link to="/pricing">Join the family pilot</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
          <div className="studio-footer__bottom">
            <span>© {new Date().getFullYear()} CodeIt</span>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
