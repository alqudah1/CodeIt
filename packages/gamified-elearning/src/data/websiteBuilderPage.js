/**
 * /ai-website-builder-for-kids, as a function of the values that change.
 *
 * Google shows this page about 400 times a month for searches like "website
 * builder for kids", "kids website builder", "free website builder for kids"
 * and "website maker for school project", at an average position of 12.6:
 * the second page, where almost nobody clicks (Search Console, 28 days to
 * 15 November 2026).
 *
 * What it gave a reader was 379 words that never said what is free, who it
 * is for, whether a school project can be shared, or what happens to a
 * child's sentence. The React page and the crawlable copy also said different
 * things, and the React page's answer to "Is it free?" was that generation
 * "depends on current service availability", which answers nothing.
 *
 * Every sentence here was checked against the code on 15 November 2026:
 * the free allowance in config/pricing.js and the backend's entitlements.js,
 * publishing rules in entitlements.js checkPublishAllowance, class games
 * kept out of the public gallery in routes/explore.js, and what goes to the
 * AI provider in schoolFacts.js. Both halves read this file.
 */
export default function websiteBuilderPage({ pricePerInterval, freeBuilds }) {
  return {
    eyebrow: 'Creative coding, built for ages 8 to 14',
    h1: 'An AI website builder for kids that teaches the code.',
    intro: 'A child describes a website, game or quiz in a sentence and gets a working version in the browser. Then they make it their own, and can open the HTML, CSS and JavaScript behind it to see how it works.',
    sections: [
      {
        heading: 'What a child can make',
        paragraphs: [
          'A fan page about a favourite animal, a portfolio of their drawings, a quiz for their friends, a page for a school project, or a small game. They write what they want in ordinary words and press Build. Nothing is installed: it runs in the browser, including on a school Chromebook.',
          'The first version is a starting point, not the answer. They can change the words, colours, layout and rules by moving things and picking colours, or by asking for a change in a sentence.',
        ],
      },
      {
        heading: 'Where the learning happens',
        paragraphs: [
          'Most website builders hide the code. This one shows it. The preview and the code sit side by side, and a child can select something on the page and find the line that made it. A tab shows what the project is made of and opens a lesson for each idea in it.',
          'That is the point of building it this way: a child who changes one line and sees what moved has learned something a finished result cannot teach.',
        ],
      },
      {
        heading: 'What is free',
        paragraphs: [
          `Anyone can open the studio and try it without an account. The free plan does not expire and needs no card, and it includes ${freeBuilds} AI builds a month. Publishing to a public CodeIt link is free too.`,
          `CodeIt Plus is ${pricePerInterval} and adds unlimited AI builds and edits, and up to four learner profiles under one adult account.`,
        ],
      },
      {
        heading: 'For a school project',
        paragraphs: [
          'A child can build the page here and present it from the screen. Whether it gets a public link depends on age. A learner aged 13 or over chooses Publish and gets a codeitlearn.com link to share. A younger child uses a private profile a parent sets up, and that profile cannot publish publicly.',
          'In a class, it is simpler: the teacher makes a free class, children join with a code and a first name, and published work appears on the class projector. Class work is kept out of the public gallery.',
        ],
      },
      {
        heading: 'What the AI receives',
        paragraphs: [
          'The sentence the child typed and the project\'s own code. No name, no username and no identifier for the child is sent with it. The Python lessons and the Python playground use no AI at all.',
        ],
      },
      {
        heading: 'What it is not',
        paragraphs: [
          'It is not a website builder for a business. There are no custom domains, no shop and no hosting plan. It is a place for a child to make something, take it apart and understand it.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is there a free website builder for kids?',
        a: `Yes. CodeIt's free plan does not expire, needs no card and includes ${freeBuilds} AI builds a month, and anyone can try the studio without an account. CodeIt Plus is ${pricePerInterval} for unlimited builds.`,
      },
      {
        q: 'What ages is it for?',
        a: 'It is built for ages 8 to 14. A learner aged 13 or over opens their own account. For anyone younger, a parent or guardian confirms their email and creates a private managed profile.',
      },
      {
        q: 'Can my child use it for a school project?',
        a: 'Yes, and present it from the screen. A learner aged 13 or over can publish it to a public codeitlearn.com link. A younger child\'s private profile cannot publish publicly. In a teacher\'s class, published work goes to the class projector.',
      },
      {
        q: 'Does it only generate a finished website?',
        a: 'No. The first version is a starting point. A child changes the words, colours, layout and behaviour, and sees the HTML, CSS and JavaScript behind it, with a lesson for each idea in it.',
      },
      {
        q: 'What does the AI see?',
        a: 'The sentence the child typed and the project\'s code. No name, username or identifier for the child is sent with it.',
      },
    ],
  };
}
