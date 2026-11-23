/**
 * The questions on /learn-python-for-kids, read by both halves.
 *
 * They lived only in the React component, so the HTML a crawler is served
 * first carried none of them and no FAQPage, on the page that gets the most
 * Python searches: "python for kids online" was shown 327 times in the 28 days
 * to 22 November 2026 at position 7.1, "python for kids" 202 times at 16.7
 * (Search Console). An FAQPage answer is the most quotable thing a page has,
 * and Google's AI answers for both searches were naming other sites.
 *
 * Changed on the way in:
 * - "Most learners complete a lesson in 20 to 30 minutes" had nothing behind
 *   it. What can be counted is the steps: every lesson in lessonData has five
 *   to seven. Resuming is real: a signed-in learner's answered steps are on
 *   the server, so the lesson reopens at their place on any computer, and a
 *   visitor's place is kept in that browser (stepMemory.js, 23 November).
 * - "Is CodeIt free to use?" is asked as a parent searches it, and now says
 *   what "online" means here: nothing to install, Chromebooks included, and
 *   Lesson 1 with no account.
 *
 * A function of the values that change, like websiteBuilderPage.js, so the
 * build script can load it without the app's imports.
 */
export default function learnPythonFaqs({ agesStatement, price, interval }) {
  return [
    {
      q: 'Is Python a good language for kids to learn?',
      a: 'Yes. Python reads close to English, so a child can focus on the idea rather than the punctuation. Adults use Python for real work in data, science and automation; it is not a toy language, so what a child learns in it stays useful.',
    },
    {
      q: 'What ages can use CodeIt?',
      a: `${agesStatement} Adults learning from scratch are welcome too. A learner aged 13 or over opens their own account. For anyone younger, a parent or legal guardian confirms their email and creates a private managed profile, which CodeIt supports from age 5.`,
    },
    {
      q: 'Can kids learn Python online for free?',
      a: `Yes. Every CodeIt lesson, the Python playground and building your own projects are free, and stay free. Python runs in the browser, so there is nothing to install and it works on a school Chromebook. Lesson 1 and the playground open without an account. There is a paid plan, CodeIt Plus, at ${price} a ${interval} plus tax, but you never need it to learn Python here.`,
    },
    {
      q: 'Do kids need prior coding experience to use CodeIt?',
      a: "No experience is needed. Lesson 1 starts from absolute zero: the very first step is running a single line of Python. Every idea is introduced before it is used, so nothing is assumed about what a child already knows.",
    },
    {
      q: 'How long does each Python lesson take?',
      a: 'Each lesson is five to seven short steps: run an example, take it apart, then change the code yourself. There is no time limit. A lesson left halfway reopens at the step the learner reached: on any computer when they are signed in, and in the same browser when they are not.',
    },
    {
      q: 'How do I know my child understood the code and did not just finish it?',
      a: 'CodeIt asks them about their own file. If their project has a variable called score set to 0, the question is what score starts as, and the right answer is whatever that child actually wrote, so it cannot be answered by recalling a lesson or by a sibling who did the last one. Only first attempts count: a wrong answer shows the right one with an explanation and stops counting. What you read back is a sentence describing something that happened, such as "worked out how many times a loop repeats", rather than a score or a percentage, because a percentage invites comparison between children and says nothing about your own.',
    },
  ];
}
