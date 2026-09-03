import Header from '../Header/Header';
import SiteFooter from '../../components/SiteFooter/SiteFooter';
import { useSEO } from '../../hooks/useSEO';
import COMPANY from '../../config/company';
import {
  FREE_MONTHLY_AI_BUILDS,
  INTERVAL,
  PRICE,
  PRICE_PER_INTERVAL,
} from '../../config/pricing';
import './Legal.css';

const UPDATED = 'August 22, 2026';

export default function Terms() {
  useSEO({
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
            <a href="#billing">Billing and renewal</a>
            <a href="#refunds">Cancelling and refunds</a>
            <a href="#availability">Availability</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="legal-content">
            <section id="eligibility">
              <h2>Eligibility and younger learners</h2>
              <p>Independent learner accounts are for ages 13 and up, including adults. For a learner ages 5 to 12, a parent or legal guardian must use the Parent / Educator path, confirm the adult account email, review the family privacy notice, and explicitly create a managed profile. Managed younger profiles cannot publish projects publicly.</p>
            </section>

            <section id="accounts">
              <h2>Accounts</h2>
              <p>Provide accurate age and account information, choose a non-identifying student username, protect the password, and do not share an account. Tell us promptly if someone else may have access. An adult creating a managed profile confirms that they are the learner’s parent or legal guardian and must not misstate the child’s age or their relationship.</p>
            </section>

            <section id="projects">
              <h2>Your ideas and projects</h2>
              <p>You keep your rights in original prompts, text, images, and other material you provide. You give CodeIt permission to process that material only as needed to operate, secure, improve, save, and, when you choose, publish the project.</p>
              <p>Only use material you have permission to use. Generated code may contain common patterns or resemble output available to others; CodeIt cannot promise exclusive rights in AI-generated material.</p>
            </section>

            <section id="public">
              <h2>Publishing and remixing</h2>
              <p>Saved projects are private by default. For eligible accounts, selecting Publish makes the project and a generic creator label available to anyone with the link and may list it in Explore. Publishing gives other CodeIt users permission to view, play, and remix a separate copy inside CodeIt. You can unpublish your original project. Managed profiles ages 5 to 12 cannot publish.</p>
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
              <h2>Free and paid plans</h2>
              <p>Every lesson, quiz and puzzle is free. So is the playground, editing your own project by hand, and saving your work privately. A classroom should never meet a paywall in the middle of a lesson, and none of that is behind one.</p>
              {/* This paragraph sold publishing as a paid feature. It is free,
                  PLANS.free.canPublish has been true the whole time, the
                  pricing page says so, and entitlements.js carries a comment
                  about this exact contradiction being fixed once already. Terms
                  are the document a person quotes back at you; they do not get
                  to be the optimistic version. */}
              <p>The free plan includes {FREE_MONTHLY_AI_BUILDS} AI project builds each month, and publishing a project to a public CodeIt link is free too. <strong>CodeIt Plus</strong> costs {PRICE_PER_INTERVAL} and adds unlimited AI builds and edits, play counts on published projects, and up to four learner profiles under one adult account.</p>
              <p>Requesting a family pilot spot is free and never starts a subscription. Nothing is charged unless an adult goes through checkout and confirms.</p>
            </section>

            <section id="billing">
              <h2>Billing and renewal</h2>
              <p>CodeIt Plus is a subscription. It costs {PRICE} per {INTERVAL}, charged when you subscribe and again on the same day each month until you cancel. Prices are in Canadian dollars. Any sales tax that applies is shown at checkout before you confirm.</p>
              <p>Only an adult account can subscribe. CodeIt does not sell to children: a managed learner profile, or an account whose date of birth indicates the holder is under 18, cannot start a subscription.</p>
              <p>Payment is processed by Stripe. Card details go to Stripe and never reach CodeIt. We store only Stripe's identifiers for your subscription, never a card number. Access to paid features is granted by Stripe's confirmation that a payment succeeded, not by anything your browser sends us.</p>
              <p>If a renewal payment fails, Stripe retries it. Your family keeps access to CodeIt Plus during those retries so that work your child already published does not disappear while you sort out a card. If payment never succeeds, the subscription ends and the account returns to the free plan. Saved projects are not deleted when a plan ends, and a project your child already published stays reachable at its link. We do not take a child's shared work offline because a card expired. What ends is the higher AI build allowance, play counts, and the extra learner profiles. Publishing is free and stays available.</p>
              <p>If the price changes, existing subscribers will be told before it applies to them, with enough notice to cancel first.</p>
            </section>

            <section id="refunds">
              <h2>Cancelling and refunds</h2>
              <p><strong>Cancel any time.</strong> Open the plan page and choose Manage billing, which takes you to Stripe's own page. Cancelling stops the next payment. You keep CodeIt Plus until the end of the month you have already paid for, and then the account returns to the free plan. You do not need to email anyone or give a reason.</p>
              <p><strong>A cancellation stops future payments</strong> but the month already paid for is not refunded pro rata. You keep the access you paid for until it runs out. Because CodeIt Plus is billed one month at a time and can be cancelled before the next charge, you are never committed beyond the month you are in.</p>
              <p><strong>If something went wrong,</strong> we refund it. That includes a payment taken after you cancelled, a duplicate charge, a charge on an account you did not authorise, and a month in which CodeIt Plus features were substantially unavailable. Contact us and we will put it right.</p>
              <p>Refunds are returned to the card that paid, through Stripe. They usually appear within five to ten business days, depending on your bank.</p>
              <p>Nothing here reduces the rights you have under the consumer protection law where you live.</p>
            </section>

            <section id="availability">
              <h2>Changes and availability</h2>
              <p>CodeIt is under active development. Features may change, pause, or be removed, and saved work should not be treated as the only copy of something important. We aim to keep the service available and secure but cannot guarantee uninterrupted or error-free operation.</p>
              <p>If these terms change materially, the updated date will change and important account-related changes may also be communicated inside the product.</p>
            </section>

            <section id="contact">
              <h2>Questions</h2>
              <p>Email <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a> for anything about your account, a payment, or a refund.</p>
              <p>CodeIt is operated from Toronto, Ontario, Canada, and these terms are governed by the law of Ontario. CodeIt is not yet incorporated; the registered company name and a formal notice address will be published in this section as soon as registration is complete.</p>
              <p>Payments for CodeIt Plus are sold and processed through Stripe. For subscriptions taken through Stripe&rsquo;s managed payments, the seller of record shown on your receipt is Link, LLC, 354 Oyster Point Boulevard, South San Francisco, CA, United States, which also collects and remits any sales tax that applies. Your receipt and card statement come from them, not from CodeIt.</p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
