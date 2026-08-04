import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import './Legal.css';

const UPDATED = 'July 28, 2026';

export default function Terms() {
  useSEO({
    title: 'Terms of Use | CodeIt',
    description: 'The rules for using CodeIt lessons, coding tools, AI-assisted projects, accounts, public sharing, and planned paid features.',
    canonical: '/terms',
  });

  return (
    <div className="legal-page">
      <Header />
      <main>
        <header className="legal-hero">
          <p className="legal-kicker">Terms of use</p>
          <h1>Build freely. Learn responsibly. Keep people safe.</h1>
          <p>These terms explain the current rules for using CodeIt. By creating an account or using the service, you agree to follow them.</p>
          <small>Last updated {UPDATED}</small>
        </header>

        <div className="legal-layout legal-layout--terms">
          <nav className="legal-toc" aria-label="On this page">
            <strong>On this page</strong>
            <a href="#eligibility">Eligibility</a>
            <a href="#accounts">Accounts</a>
            <a href="#projects">Projects and ownership</a>
            <a href="#public">Public projects</a>
            <a href="#acceptable">Acceptable use</a>
            <a href="#ai">AI-generated results</a>
            <a href="#plans">Free and paid plans</a>
            <a href="#availability">Availability</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="legal-content">
            <section id="eligibility">
              <h2>Eligibility and younger learners</h2>
              <p>Independent student accounts are for learners ages 13–18. For a learner ages 5–12, a parent or legal guardian must use the Parent / Educator path, confirm the adult account email, review the family privacy notice, and explicitly create a managed profile. Managed younger profiles cannot publish projects publicly.</p>
            </section>

            <section id="accounts">
              <h2>Accounts</h2>
              <p>Provide accurate age and account information, choose a non-identifying student username, protect the password, and do not share an account. Tell us promptly if someone else may have access. An adult creating a managed profile confirms that they are the learner’s parent or legal guardian and must not misstate the child’s age or their relationship.</p>
            </section>

            <section id="projects">
              <h2>Your ideas and projects</h2>
              <p>You keep your rights in original prompts, text, images, and other material you provide. You give CodeIt permission to process that material only as needed to operate, secure, improve, save, and—when you choose—publish the project.</p>
              <p>Only use material you have permission to use. Generated code may contain common patterns or resemble output available to others; CodeIt cannot promise exclusive rights in AI-generated material.</p>
            </section>

            <section id="public">
              <h2>Publishing and remixing</h2>
              <p>Saved projects are private by default. For eligible accounts, selecting Publish makes the project and a generic creator label available to anyone with the link and may list it in Explore. Publishing gives other CodeIt users permission to view, play, and remix a separate copy inside CodeIt. You can unpublish your original project. Managed profiles ages 5–12 cannot publish.</p>
              <p>Do not publish personal contact information, school details, precise location, private images, passwords, or information about another person without permission.</p>
            </section>

            <section id="acceptable">
              <h2>Acceptable use</h2>
              <p>Do not use CodeIt to harm, threaten, bully, impersonate, exploit, or deceive anyone; create sexual content involving minors; distribute malware; evade security or usage limits; access another account; violate privacy or intellectual-property rights; or break the law.</p>
              <p>We may remove public material or restrict an account when reasonably necessary to protect learners, other users, the service, or legal rights.</p>
            </section>

            <section id="ai">
              <h2>AI-assisted results</h2>
              <p>AI output can be incomplete, incorrect, insecure, or unsuitable. Review and test a project before relying on or publishing it. CodeIt is a learning and creative tool, not professional legal, medical, financial, safety, or cybersecurity advice.</p>
            </section>

            <section id="plans">
              <h2>Free access and planned paid features</h2>
              <p>CodeIt currently offers free access and is testing interest in a Founding Family plan. No subscription starts from an interest button. Before taking payment, CodeIt will show the price, included usage, renewal terms, cancellation method, taxes if applicable, and any trial conditions for confirmation.</p>
            </section>

            <section id="availability">
              <h2>Changes and availability</h2>
              <p>CodeIt is under active development. Features may change, pause, or be removed, and saved work should not be treated as the only copy of something important. We aim to keep the service available and secure but cannot guarantee uninterrupted or error-free operation.</p>
              <p>If these terms change materially, the updated date will change and important account-related changes may also be communicated inside the product.</p>
            </section>

            <section id="contact">
              <h2>Questions</h2>
              <p>Email <a href="mailto:hello@codeitlearn.com">hello@codeitlearn.com</a>. Company registration, governing-law, and formal notice details will be completed before paid subscriptions open.</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
