/**
 * The facts on /press, in one place.
 *
 * This page existed only inside the static SEO generator. A crawler could read
 * it and a person could not: there was no React route for /press, and App.js
 * sends every unmatched path to the homepage, so anyone arriving from a search
 * result was silently redirected away from the page they clicked. The crawlable
 * half of a page is not the page.
 *
 * So the content lives here, and both halves render from it. The values that
 * change — the price, the free allowance, the lesson count, the founder — are
 * passed in rather than typed, because this is the page that exists so other
 * people can quote a number without asking.
 *
 * No imports: scripts/content-loader.js evaluates this file in a vm sandbox
 * that refuses require, so each side supplies its own configuration.
 */
export default function pressFacts({
  locationLine,
  founderName,
  contactEmail,
  url,
  primaryAlternateName,
  sameAs,
  pricePerInterval,
  freeMonthlyAiBuilds,
  lessonCount,
}) {
  return {
    eyebrow: "Press and facts",
    h1: "Everything you need to write about CodeIt.",
    intro: `CodeIt is a browser-based coding studio for ages 5 to 18, built in ${locationLine} by ${founderName}. This page exists so that anyone writing about the product can check a fact without asking, and so that what gets written is accurate.`,
    detail: "If something here is unclear or you need a detail that is not on this page, email and ask. A correction is cheaper than a wrong sentence.",
    sections: [
    {
      heading: "The paragraph to quote",
      paragraphs: [
        `CodeIt is a browser-based coding studio for ages 5 to 18, built in ${locationLine}. A learner describes a website, game or quiz and gets a working version they can play, changes it by moving things and picking colours or asking in plain language, then opens a separate view showing what the project is made of and the lesson behind each idea in it. Alongside the studio are ${lessonCount} beginner Python lessons and a Python playground.`,
        "Use that as written, or cut it. It is accurate as of the date at the bottom of this page.",
      ],
    },
    {
      heading: "What is actually different about it",
      paragraphs: [
        "The comprehension questions are generated from the learner's own file. The correct answer is the value that learner actually wrote, and the wrong options are other real values from the same project, so the question cannot be answered by recalling a lesson or looking anything up. Only first attempts count.",
        "What a parent reads is a sentence describing something that happened, such as \"worked out how many times a loop repeats\", rather than a score or a percentage. That is a deliberate limit: a percentage invites comparison between children and says nothing about what one child can do.",
        "Every other product in this category reports progress, meaning lessons completed, time spent, badges earned. Those answer a different question from the one parents are now asking, which is whether the child understood code an assistant produced.",
        "The avatar a child builds in the Avatar Lab is the player in the games that child builds. It is the same drawing, handed to every game the studio opens, so changing the outfit changes the character in the game. Scratch has sprites and Tynker has characters; neither takes the character the child made and puts it inside the game the child made. XP comes mostly from those first-attempt answers about the child's own code, and levels unlock things to wear.",
      ],
    },
    {
      heading: "The name",
      paragraphs: [
        `The product is CodeIt. It is registered on external profiles as "${primaryAlternateName}", because "CodeIt" alone collides with several unrelated organisations: a youth outreach programme at MIT, a tutoring company in London at codeitlearning.com, and a software services firm at codeit.us. None of them are us.`,
        `Written as one word with a capital I: CodeIt. The site is ${url}.`,
      ],
    },
    {
      heading: "What it does",
      paragraphs: [
        "A learner describes a website, game or quiz and gets a working version they can play immediately. They change it by moving elements, picking colours and fonts, or asking for changes in plain language.",
        "A separate view shows which programming ideas the finished project uses, and opens the lesson behind each one. Children see the code their project is made of; they are not typing it as the main activity, and describing it that way is the most common error in write-ups.",
        `Alongside the studio there are ${lessonCount} beginner Python lessons, each with an explanation, a runnable example, something to write, and a challenge. The lessons are where children write code.`,
      ],
    },
    {
      heading: "What it costs",
      paragraphs: [
        `Free plan: no card, ${freeMonthlyAiBuilds} AI-assisted project builds a month. The lessons and the Python playground stay free regardless of plan.`,
        `Paid family plan: ${pricePerInterval}, cancellable at any time. Prices are Canadian dollars.`,
      ],
    },
    {
      heading: "What it does not do",
      paragraphs: [
        "No rostering, no LMS integration, no standards alignment, no teacher dashboards. CodeIt is not built for school or district deployment and is not sold that way.",
        "It is not right for a pre-reading child; Kodable and codeSpark are built for that and are better at it. It is not right for a learner who mainly wants to keep making games, where CodeCombat or Roblox Studio fit better.",
      ],
    },
    {
      heading: "Children and accounts",
      paragraphs: [
        "Profiles for ages 5 to 12 are created and managed by a parent or guardian after the adult account email is confirmed. Those managed profiles cannot publish projects publicly. Independent student accounts begin at 13.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        `${founderName}, founder. ${contactEmail}. Based in ${locationLine}.`,
        `Profiles: ${sameAs.join(' · ')}`,
      ],
    },
    {
      heading: "Using the logo",
      paragraphs: [
        `The mark is at ${url}/brand/codeit-logo-trimmed.png and the square version at ${url}/brand/LogoForSM.png. Use either as-is; please do not recolour or stretch them.`,
      ],
    },
    ],
  };
}
