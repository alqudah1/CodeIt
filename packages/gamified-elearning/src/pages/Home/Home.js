import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../config/api";
import Header from "../Header/Header";
import BrandLogo from "../../components/BrandLogo/BrandLogo";
import { useSEO } from "../../hooks/useSEO";
import { trackEvent } from "../../utils/trackEvent";
import HomePilotSignup from "./HomePilotSignup";
import "./Home.css";
import "./HomeStudio.css";

const PROJECT_IDEAS = [
  {
    id: "space-quiz",
    label: "Space quiz",
    eyebrow: "Space challenge",
    title: "Mission Control Quiz",
    accent: "#6c5ce7",
    detail: "Question 2 of 5 · Which planet has the most moons?",
    concept: "Variables keep track of the score",
    code: "let score = 2;",
  },
  {
    id: "portfolio",
    label: "My first site",
    eyebrow: "Creative portfolio",
    title: "Maya Makes Things",
    accent: "#ff7a00",
    detail: "Art, experiments & tiny inventions",
    concept: "HTML gives every idea a place",
    code: "<section class=\"gallery\">",
  },
  {
    id: "reaction-game",
    label: "Reaction game",
    eyebrow: "Quick reaction game",
    title: "Lightning Tap",
    accent: "#00a896",
    detail: "Best time: 0.42 seconds",
    concept: "Events make the game respond",
    code: "button.onclick = playAgain;",
  },
];

const STARTING_POINTS = [
  {
    number: "01",
    title: "Describe the idea",
    copy: "A student starts with a website, game, quiz, or school project they genuinely want to make.",
    link: "/builder",
    linkLabel: "Try the project studio",
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

function StudioPreview() {
  const [activeId, setActiveId] = useState(PROJECT_IDEAS[0].id);
  const active = PROJECT_IDEAS.find((idea) => idea.id === activeId) || PROJECT_IDEAS[0];

  return (
    <section className="studio-preview" aria-label="Interactive example of a project made with CodeIt">
      <div className="studio-preview__toolbar">
        <span className="studio-preview__brand-mark"><BrandLogo className="studio-preview__logo" alt="" /></span>
        <span>My CodeIt project</span>
        <span className="studio-preview__status">Preview + code</span>
      </div>

      <div className="studio-preview__idea-list" role="group" aria-label="Choose an example project">
        {PROJECT_IDEAS.map((idea) => (
          <button
            type="button"
            key={idea.id}
            className={idea.id === active.id ? "is-active" : ""}
            onClick={() => setActiveId(idea.id)}
            aria-pressed={idea.id === active.id}
          >
            {idea.label}
          </button>
        ))}
      </div>

      <div className="studio-preview__body">
        <div
          className="studio-preview__canvas"
          style={{ "--project-accent": active.accent }}
          aria-live="polite"
        >
          <span className="studio-preview__made-with">Your project</span>
          <div className="studio-preview__project-card" key={active.id}>
            <span className="studio-preview__project-kicker">{active.eyebrow}</span>
            <p className="studio-preview__project-title">{active.title}</p>
            <p>{active.detail}</p>
            <div className="studio-preview__project-shapes" aria-hidden="true"><i /><i /><i /></div>
          </div>
        </div>

        <div className="studio-preview__learn" aria-live="polite">
          <div>
            <span>Behind your project</span>
            <strong>{active.concept}</strong>
          </div>
          <code>{active.code}</code>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { user, token } = useAuth();
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
    title: "CodeIt: Build Websites, Learn Code & Share Projects",
    description: "CodeIt helps students ages 8–18 build real websites, games, and quizzes, then learn, edit, save, and share the code behind them.",
    canonical: "/",
  });

  return (
    <>
      <Header />
      <div className="studio-home">
        <main>
          <section className="studio-hero" aria-labelledby="studio-title">
            <div className="studio-hero__copy">
              <p className="studio-kicker">A creative coding studio for students</p>
              {user && <p className="studio-welcome">Welcome back, {user.name || "Builder"}.</p>}
              <h1 id="studio-title">
                Make a website.
                <span>Learn the code behind it.</span>
              </h1>
              <p className="studio-hero__lead">
                Turn an idea into a real website, game, or quiz. Then learn the code, change it, save it, and share it.
              </p>
              <form className="studio-hero__idea" onSubmit={startHeroIdea}>
                <label htmlFor="studio-hero-idea">
                  {user ? "What should we build next?" : "What do you want to build?"}
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
                <small>No account needed to try. Keep names and personal details private.</small>
              </form>
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
                  to={user ? "/MainPage" : "#how-it-works"}
                  className="studio-button studio-button--quiet"
                  data-cta={user ? "member-progress" : "hero-lessons"}
                  onClick={() => { if (!user) trackEvent("landing_cta_click", "hero-lessons"); }}
                >
                  {user ? "View my progress" : "See the student journey"}
                </Link>
              </div>
              <ul className="studio-hero__audience" aria-label="Who CodeIt helps">
                <li>Students create</li>
                <li>CodeIt teaches</li>
                <li>Families see progress</li>
              </ul>
            </div>

            <div className="studio-hero__visual">
              <StudioPreview />
              <figure className="studio-pixel">
                <img
                  src="/brand/pixel-mascot-hero.png"
                  alt="Pixel, CodeIt's friendly orange build buddy, creating a project on a laptop"
                />
                <figcaption><strong>Hi, I’m Pixel.</strong> What should we build?</figcaption>
              </figure>
            </div>
          </section>

          <section className="studio-proof" aria-label="What makes CodeIt different">
            <p><strong>Build something real.</strong> Start from an idea instead of an intimidating blank file.</p>
            <p><strong>Learn what powers it.</strong> Connect every visible result to the code behind it.</p>
            <p><strong>Show meaningful progress.</strong> Save, publish, and keep parents informed.</p>
          </section>

          <section className="studio-traction" aria-labelledby="studio-traction-title">
            <div className="studio-traction__heading">
              <p className="studio-kicker">Real learning activity</p>
              <h2 id="studio-traction-title">Learners are already building momentum.</h2>
              <p>Rounded platform totals, verified in July 2026. Active usage is measured separately from these all-time milestones.</p>
            </div>
            <dl className="studio-traction__metrics">
              <div>
                <dt>Registered accounts</dt>
                <dd>200+</dd>
              </div>
              <div>
                <dt>XP earned</dt>
                <dd>140k+</dd>
              </div>
              <div>
                <dt>Lessons completed</dt>
                <dd>600+</dd>
              </div>
              <div>
                <dt>Quizzes &amp; puzzles completed</dt>
                <dd>1,900+</dd>
              </div>
              <div>
                <dt>Learners with a streak</dt>
                <dd>50+</dd>
              </div>
            </dl>
          </section>

          <section className="studio-start" aria-labelledby="studio-start-title">
            <div className="studio-section-heading">
              <p className="studio-kicker">What a student actually does</p>
              <h2 id="studio-start-title">From “I have an idea” to “I built this.”</h2>
              <p>The AI-assisted builder removes the scary first step. The lessons and exercises turn that first version into real understanding.</p>
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
                  <strong>Using CodeIt with a learner ages 8–12?</strong>
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
            <article className="studio-family__email" aria-label="Example parent progress email">
              <div className="studio-family__email-bar">
                <BrandLogo className="studio-family__email-logo" alt="" />
                <span>CodeIt progress update</span>
              </div>
              <p className="studio-family__email-label">Website published</p>
              <h3>Sam published “My Space Quiz”</h3>
              <p>Sam built an interactive quiz, learned how variables store the score, and published the project.</p>
              <div className="studio-family__email-result">
                <span>Project</span>
                <strong>My Space Quiz</strong>
                <small>Ready to view and share</small>
              </div>
            </article>
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
              <p className="studio-kicker">The build → learn → improve loop</p>
              <h2 id="studio-loop-title">A first version gives you momentum. The learning makes it yours.</h2>
              <ol>
                <li><span>1</span><div><strong>Describe</strong><p>Explain what you want to create in everyday language.</p></div></li>
                <li><span>2</span><div><strong>Build and play</strong><p>Use the working result immediately and notice what you want to change.</p></div></li>
                <li><span>3</span><div><strong>Open the code</strong><p>Learn the concept behind the behaviour, then edit and test it yourself.</p></div></li>
              </ol>
              <Link to="/builder" className="studio-text-link">See the builder in action <span aria-hidden="true">→</span></Link>
            </div>
          </section>

          <section className="studio-trust" aria-labelledby="studio-trust-title">
            <div>
              <p className="studio-kicker">What CodeIt delivers</p>
              <h2 id="studio-trust-title">One place for the complete beginner journey.</h2>
            </div>
            <div className="studio-trust__points">
              <article><strong>AI-assisted project studio</strong><p>Students quickly create a first version, then keep control of what changes next.</p></article>
              <article><strong>Lessons and hands-on exercises</strong><p>Python concepts are explained through code students can run and test immediately.</p></article>
              <article><strong>Projects that belong to the student</strong><p>Save versions, return later, improve the work, and publish when it is ready.</p></article>
              <article><strong>Parent-approved progress updates</strong><p>Confirmed parents can receive plain-language emails about completed learning and creative work.</p></article>
            </div>
          </section>

          <section className="studio-final" aria-labelledby="studio-final-title">
            <div>
              <p className="studio-kicker">The CodeIt promise</p>
              <h2 id="studio-final-title">Start with an idea. Leave with something real.</h2>
              <p>Build it. Learn how it works. Make it yours. Share what you created.</p>
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
        </main>

        <footer className="studio-footer">
          <div className="studio-footer__top">
            <div className="studio-footer__brand">
              <BrandLogo className="studio-footer__logo" />
              <p>Build something. Learn the code. Make it yours.</p>
            </div>
            <div>
              <strong>Build</strong>
              <Link to="/builder">Project studio</Link>
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
