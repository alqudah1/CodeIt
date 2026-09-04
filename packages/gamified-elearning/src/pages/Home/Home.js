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
import { CURRENCY_SYMBOL } from "../../config/pricing";
import { AGE_RANGE } from "../../config/company";
import YourShelf from "./YourShelf";
import RecentProjects from "./RecentProjects";
import FounderNote from "./FounderNote";
import Evidence from "./Evidence";
import TryPython from "./TryPython";
import AvatarInGame from "./AvatarInGame";
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
              {/* "Coding for ages 5 to 18" sat here. A number in the hero is a
                  label, and this one was wrong: /press says a pre-reading child
                  should use a different product. The range now lives once,
                  lower down, in plain words, and in the schema and meta where
                  machines read it. */}
              <p className="studio-kicker">Coding for kids, in the browser</p>
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
              {/* A row of pills reading "31 lessons · 21 projects · No account
                  needed" sat here. A number invites a comparison, and this is
                  a comparison we lose every time we invite it: Tynker publishes
                  thousands of activities and Code.org has a curriculum a school
                  district signs off on. "31" beside those reads as small, and
                  the parent reading it has no idea whether 31 is a lot. The
                  counts still live on /lessons and /press, where somebody has
                  asked. */}
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
            {/* The hero shows the most distinctive thing in the product: the
                character a child builds is the player in the game that child
                builds. It was working since 31 August and nothing on the site
                said so. The live Python editor, which was here, is the next
                thing down the page: still above the studio, still no AI. */}
            <div className="studio-hero__visual">
              {!shelf.length && <AvatarInGame />}
              {/* Pixel used to stand here, bottom right, overlapping the code.
                  The child never sees this page; they land in the studio or a
                  lesson. This page is read by the adult deciding whether to let
                  them, and on that page a mascot is the product's clothes on
                  the wrong body. Pixel stays in the studio and the lessons,
                  where a nine-year-old is meant to feel invited. */}
            </div>
          </section>

          {/* ── Type Python here ─────────────────────────────────────────────
              Real CodeMirror, real Pyodide, no account and no AI. It led the
              hero until the avatar demo took that spot; it is still the first
              thing after the hero and still before the studio. */}
          {!shelf.length && (
            <section className="studio-python" aria-label="Try Python in this page">
              <TryPython />
            </section>
          )}

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

          {/* ── Two claims, not four counts ───────────────────────────────
              This block carried "31 lessons" and "21 projects" beside CA$0 and
              None. The counts invite comparisons we lose. The other two are
              not counts, they are claims, and no competitor can match either.
              So the block says what the lessons are instead of how many, and
              keeps the two numbers that mean something. */}
          <section className="studio-cost" aria-labelledby="studio-cost-title">
            <div className="studio-cost__copy">
              <p className="studio-kicker">What it costs, and who it is for</p>
              <h2 id="studio-cost-title">Beginner Python, from <code>print()</code> to functions. Free, no account.</h2>
              <p>Nothing on this page asks for a card, an email, or a download. Open a lesson and it starts.</p>
              <p className="studio-cost__ages">{AGE_RANGE.statement}</p>
            </div>
            <dl className="studio-cost__facts">
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


          {/* Three sections used to sit between here and the footer: a
              three-step "describe, build, learn" strip, a drawn browser window
              with an invented project.js in it, and four generic articles
              headed "What CodeIt delivers". Every one of them said the same
              thing as the sections above, at a larger size. Fewer sections and
              more room around each is what "expensive" is made of; more
              content is what "poster" is made of. */}
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
