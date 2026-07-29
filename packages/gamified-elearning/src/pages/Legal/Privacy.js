import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import './Legal.css';

const UPDATED = 'July 29, 2026';

export default function Privacy() {
  useSEO({
    title: 'Privacy & Safety | CodeIt',
    description: 'How CodeIt handles account information, learning progress, projects, AI processing, analytics, public sharing, and child safety.',
    canonical: '/privacy',
  });

  return (
    <div className="legal-page">
      <Header />
      <main>
        <header className="legal-hero">
          <p className="legal-kicker">Privacy &amp; safety</p>
          <h1>Clear information about what CodeIt collects—and why.</h1>
          <p>This page describes the current CodeIt product. We collect information needed to run accounts, save learning progress, and build projects. We do not sell personal information or run behavioural advertising.</p>
          <small>Last updated {UPDATED}</small>
        </header>

        <section className="legal-summary" aria-label="Privacy summary">
          <article><strong>No advertising profiles</strong><p>CodeIt does not use third-party advertising trackers or sell personal information.</p></article>
          <article><strong>Projects are private by default</strong><p>A saved project becomes public only after its owner chooses Publish.</p></article>
          <article><strong>Minimal product analytics</strong><p>We measure a fixed set of actions, not project prompts, generated code, email addresses, or stored IP addresses.</p></article>
        </section>

        <div className="legal-layout">
          <nav className="legal-toc" aria-label="On this page">
            <strong>On this page</strong>
            <a href="#accounts">Accounts</a>
            <a href="#learning">Learning and projects</a>
            <a href="#ai">AI processing</a>
            <a href="#analytics">Analytics</a>
            <a href="#sharing">Public sharing</a>
            <a href="#children">Children and parents</a>
            <a href="#retention">Retention and choices</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="legal-content">
            <section id="accounts">
              <h2>Account information</h2>
              <p>Independent student accounts collect a username, password, and birthday, plus an optional parent or guardian email. Student passwords are stored as one-way password hashes, not readable passwords. Parent and educator accounts collect a name, email address, and hashed password.</p>
              <p>After confirming the adult account email and accepting the current family notice, a parent or legal guardian may create a private profile for a learner ages 8–12. The managed profile uses a non-identifying username, birthday, hashed password, the adult account email, relationship type, consent date, and notice version. It does not collect a child email address.</p>
              <p>The browser keeps the signed-in session token and basic account display information in local storage so the account remains signed in. Signing out removes that local session information.</p>
            </section>

            <section id="learning">
              <h2>Learning progress and projects</h2>
              <p>When someone uses a signed-in account, CodeIt may save lesson completion, quiz attempts and scores, puzzle progress, XP, game scores, avatar choices, and daily activity.</p>
              <p>Saved projects can include the project title, original idea or prompt, later edit instructions, generated HTML/CSS/JavaScript, project versions, colours, project type, and timestamps. Before account signup, an unsaved guest project may be kept only in that browser for up to seven days so a refresh or later visit does not immediately erase the work. It is not uploaded as a saved account project unless the creator explicitly continues into an account-backed save, and it can be removed by starting a new project or clearing browser storage.</p>
            </section>

            <section id="ai">
              <h2>AI-assisted project processing</h2>
              <p>CodeIt uses Anthropic models to create, edit, explain, and improve projects. The relevant prompt, edit instruction, project code, or requested explanation is sent to Anthropic to produce the result. Do not enter a real name, email, school, address, password, or other sensitive information in a project prompt.</p>
              <p>CodeIt records model and token totals for cost measurement, but that usage table does not contain the prompt, generated code, email address, or user ID.</p>
            </section>

            <section id="analytics">
              <h2>Product analytics</h2>
              <p>CodeIt records a short allowlisted set of actions such as landing-page clicks, builds started and completed, account creation, project saves and publishes, return days, pricing-page views, and plan-interest clicks. When someone is signed in, an action may be connected to the account ID.</p>
              <p>A random first-party journey number is kept only in the current browser session. It lets CodeIt understand whether a visit led to a build, signup, save, or publish. It is not used across other websites, contains no name or contact details, and disappears from the browser when that session ends.</p>
              <p>Analytics events do not store prompts, generated code, email addresses, browser user-agent strings, or IP addresses. An IP address may be held in server memory for about 60 seconds solely to rate-limit analytics requests; it is not written to the analytics table.</p>
            </section>

            <section id="waitlist">
              <h2>Founding Family waitlist</h2>
              <p>An adult may choose to submit an email address and consent to receive updates about the Founding Family pilot. That contact email is stored separately from product analytics and is used only for the pilot, not for unrelated marketing.</p>
              <p>Waitlist requests are rate-limited in server memory to reduce abuse. You may leave the waitlist at any time by replying to an update or contacting the privacy address below.</p>
            </section>

            <section id="sharing">
              <h2>Publishing and community sharing</h2>
              <p>Projects are not listed publicly until an eligible owner selects Publish. A public project may display its title, working code, project type, generic creator label, creation date, and play/like/remix counts. Anyone with the public link may open it, and signed-in users may remix a copy. Unpublishing removes it from public access. Public publishing is disabled for managed profiles ages 8–12.</p>
              <p>Before publishing, remove personal details from the project, title, visible content, and creator display name.</p>
            </section>

            <section id="children">
              <h2>Children, parents, and guardians</h2>
              <p>Learners ages 13–18 may create independent student accounts. For ages 8–12, an adult must use a Parent / Educator account, confirm its email, identify as the parent or legal guardian, review this notice, and explicitly create the managed profile. Managed younger profiles stay private and cannot publish projects publicly.</p>
              <p>The adult may separately choose progress emails for a managed profile. When enabled, CodeIt sends the confirmed adult email selected lesson, exercise, quiz, and project-creation milestones. The adult can pause these emails from the family controls, and each email also includes an unsubscribe link.</p>
              <p>Email confirmation establishes control of the adult account email; CodeIt does not claim that email confirmation alone proves legal identity or satisfies every law in every location. A parent or guardian can view their linked profiles, delete a managed profile and its connected data, or contact us to ask for access, correction, or deletion.</p>
              <p>Some legacy accounts created before this flow may indicate that the learner is under 13. CodeIt does not treat an unverified parent email as consent. Those accounts are paused without deleting their saved work, and connected projects are kept private, until a parent or guardian completes the review and links the learner to a confirmed adult account.</p>
              <p>For a legacy review, CodeIt may collect a parent or guardian email only to send the review notice. If the review is not completed within 14 days, the pending review and that email address are deleted. The adult may approve the private managed account or contact the privacy address below to decline and request deletion.</p>
            </section>

            <section id="retention">
              <h2>Retention, security, and choices</h2>
              <p>Account, progress, and saved-project information is retained while the account is active or as needed to provide the service. Product analytics and AI usage totals are automatically removed after 13 months. Waitlist contact information is kept until the adult opts out or the pilot outreach ends. Public projects remain available until they are unpublished or deleted.</p>
              <p>CodeIt uses access controls, password hashing, authenticated routes, and encrypted HTTPS connections. No online service can promise perfect security. If you believe an account or project is exposed, contact us promptly.</p>
              <p>You may ask to access, correct, export, unpublish, or delete personal information by emailing the privacy contact below. We may need to verify the requester’s identity and, for a child’s account, their authority as parent or guardian.</p>
            </section>

            <section id="contact">
              <h2>Privacy contact</h2>
              <p>Questions or requests can be sent to <a href="mailto:hello@codeitlearn.com">hello@codeitlearn.com</a> with “Privacy” in the subject line. Company registration and mailing details will be added before paid subscriptions open.</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
