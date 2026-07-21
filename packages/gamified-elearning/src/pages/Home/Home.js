import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Header from "../Header/Header";
import { useSEO } from "../../hooks/useSEO";
import "./Home.css";
import "./HomeStudio.css";

const PROJECT_IDEAS = [
  {
    id: "space-quiz",
    label: "Space quiz",
    prompt: "Build a five-question space quiz with a score and a restart button.",
    title: "Mission Control Quiz",
    accent: "#6c5ce7",
    detail: "Question 2 of 5",
    action: "Launch answer",
  },
  {
    id: "portfolio",
    label: "My first site",
    prompt: "Make a bright portfolio about my drawings, with a gallery and contact button.",
    title: "Maya Makes Things",
    accent: "#ff7a00",
    detail: "Art, experiments & tiny inventions",
    action: "View gallery",
  },
  {
    id: "reaction-game",
    label: "Reaction game",
    prompt: "Create a reaction game that tracks my fastest time and lets me play again.",
    title: "Lightning Tap",
    accent: "#00a896",
    detail: "Best time: 0.42 seconds",
    action: "Play again",
  },
];

const STARTING_POINTS = [
  {
    number: "01",
    title: "Build something personal",
    copy: "Start with a game, fan page, quiz, or school project that already matters to you.",
    link: "/builder",
    linkLabel: "Open the AI studio",
  },
  {
    number: "02",
    title: "See the code behind it",
    copy: "Move between the working project and the code so every change has a visible reason.",
    link: "/playground",
    linkLabel: "Try the code playground",
  },
  {
    number: "03",
    title: "Learn, edit, and make it yours",
    copy: "Use short lessons to understand a concept, then bring it back into your own project.",
    link: "/lessons",
    linkLabel: "Browse beginner lessons",
  },
];

const POPULAR_LESSONS = [
  [1, "Your first Python program"],
  [2, "Variables and stored information"],
  [4, "Making decisions with if statements"],
  [6, "Repeating ideas with loops"],
];

function trackConversion(action) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("codeit:conversion", { detail: { action } }));
  if (typeof window.gtag === "function") {
    window.gtag("event", action, { event_category: "homepage" });
  }
}

function StudioPreview() {
  const [activeId, setActiveId] = useState(PROJECT_IDEAS[0].id);
  const active = PROJECT_IDEAS.find((idea) => idea.id === activeId) || PROJECT_IDEAS[0];

  return (
    <div className="studio-preview" aria-label="Example of a project made with CodeIt">
      <div className="studio-preview__toolbar">
        <div className="studio-preview__traffic" aria-hidden="true"><i /><i /><i /></div>
        <span>CodeIt studio</span>
        <span className="studio-preview__status"><i /> Live preview</span>
      </div>

      <div className="studio-preview__body">
        <aside className="studio-preview__prompt">
          <p className="studio-preview__label">Try an idea</p>
          <div className="studio-preview__idea-list" role="list" aria-label="Example project ideas">
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
          <div className="studio-preview__prompt-box">
            <span>Prompt</span>
            <p>{active.prompt}</p>
          </div>
          <div className="studio-preview__code" aria-hidden="true">
            <span><b>const</b> project = createIdea();</span>
            <span>project.<em>makeInteractive</em>();</span>
          </div>
        </aside>

        <div
          className="studio-preview__canvas"
          style={{ "--project-accent": active.accent }}
          aria-live="polite"
        >
          <span className="studio-preview__made-with">Made with CodeIt</span>
          <div className="studio-preview__project-card" key={active.id}>
            <span className="studio-preview__project-kicker">A working project, not a template</span>
            <h2>{active.title}</h2>
            <p>{active.detail}</p>
            <span className="studio-preview__project-action" aria-hidden="true">{active.action}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  useSEO({
    title: "AI Coding for Kids: Build Websites & Learn the Code | CodeIt",
    description: "CodeIt is a beginner-friendly AI coding studio where kids build websites, games, and quizzes, then learn the code behind their projects.",
    canonical: "/",
  });

  useEffect(() => {
    const schemaId = "codeit-home-schema";
    let script = document.getElementById(schemaId);
    if (!script) {
      script = document.createElement("script");
      script.id = schemaId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "CodeIt",
      url: "https://codeitlearn.com/",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description: "A beginner-friendly AI coding studio where students build websites, games, and quizzes and learn the code behind their projects.",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: "Kids and beginner coders",
      },
      isAccessibleForFree: true,
    });
    return () => script?.remove();
  }, []);

  return (
    <>
      <Header />
      <div className="studio-home">
        <main>
          <section className="studio-hero" aria-labelledby="studio-title">
            <div className="studio-hero__copy">
              <p className="studio-kicker">AI coding studio for curious beginners</p>
              {user && <p className="studio-welcome">Welcome back, {user.name || "Builder"}.</p>}
              <h1 id="studio-title">
                Turn an idea into a real website.
                <span>Then learn the code behind it.</span>
              </h1>
              <p className="studio-hero__lead">
                Build games, quizzes, and websites with AI—then open the code, change how it works,
                and grow from creator to coder.
              </p>
              <div className="studio-hero__actions">
                <Link
                  to="/builder"
                  className="studio-button studio-button--primary"
                  data-cta="hero-build"
                  onClick={() => trackConversion("hero_build_started")}
                >
                  Build your first project <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/lessons"
                  className="studio-button studio-button--quiet"
                  data-cta="hero-lessons"
                  onClick={() => trackConversion("hero_lessons_opened")}
                >
                  Explore beginner lessons
                </Link>
              </div>
              <ul className="studio-assurances" aria-label="CodeIt benefits">
                <li>No software to install</li>
                <li>Try the builder before signing up</li>
                <li>Edit with words or code</li>
              </ul>
            </div>

            <StudioPreview />
          </section>

          <section className="studio-proof" aria-label="What makes CodeIt different">
            <p><strong>Make it work.</strong> Start from an idea instead of a blank file.</p>
            <p><strong>Understand it.</strong> Connect each visible result to the code.</p>
            <p><strong>Make it yours.</strong> Keep editing after the AI is finished.</p>
          </section>

          <section className="studio-start" aria-labelledby="studio-start-title">
            <div className="studio-section-heading">
              <p className="studio-kicker">A better first step into coding</p>
              <h2 id="studio-start-title">Creation first. Understanding follows.</h2>
              <p>CodeIt keeps the excitement of AI building, but turns every project into something a student can inspect, change, and learn from.</p>
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
              <h2 id="studio-loop-title">The AI gives you momentum. The learning makes it yours.</h2>
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
              <p className="studio-kicker">For students, parents, and educators</p>
              <h2 id="studio-trust-title">Creative freedom with a clear learning path.</h2>
            </div>
            <div className="studio-trust__points">
              <article><strong>Beginner-friendly by design</strong><p>Start without setup, jargon, or an intimidating blank editor.</p></article>
              <article><strong>Projects with a purpose</strong><p>Each lesson connects back to something students can build and improve.</p></article>
              <article><strong>Visible progress</strong><p>Lessons, projects, XP, and milestones make the next step easier to understand.</p></article>
            </div>
          </section>

          <section className="studio-final" aria-labelledby="studio-final-title">
            <div>
              <p className="studio-kicker">Your first project can start today</p>
              <h2 id="studio-final-title">What do you want to make?</h2>
              <p>Bring one idea. CodeIt will help you build it, understand it, and keep improving it.</p>
            </div>
            <Link
              to="/builder"
              className="studio-button studio-button--dark"
              data-cta="final-build"
              onClick={() => trackConversion("final_build_started")}
            >
              Start building for free <span aria-hidden="true">→</span>
            </Link>
          </section>
        </main>

        <footer className="studio-footer">
          <div className="studio-footer__top">
            <div className="studio-footer__brand">
              <img src="/brand/CodeItRG.svg" alt="CodeIt" />
              <p>Build with AI. Learn the code. Make it yours.</p>
            </div>
            <div>
              <strong>Build</strong>
              <Link to="/builder">AI project studio</Link>
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
              <Link to="/blog">Guides and ideas</Link>
              <a href="mailto:hello@codeitlearn.com">Contact</a>
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
