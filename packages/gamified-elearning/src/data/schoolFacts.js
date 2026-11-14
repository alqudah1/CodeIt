/**
 * What a school's IT or privacy reviewer needs to know, on /schools.
 *
 * A teacher can start a class in about a minute. The teacher is not who says
 * no. Their IT or privacy reviewer is, and that person searches the site for
 * the answers to a standard form. On 13 November 2026 a Head of Computing
 * could not run a lesson because his school's web filter was stopping part of
 * the site, and there was no page to send to whoever looks after that filter.
 * This is that page: the reviewer's form, answered, in order, in plain words.
 *
 * Every sentence here was checked against the code or measured before it was
 * written, and src/pages/Schools/Schools.test.js holds the ones a test can
 * hold. Where the answer is "no", it says no. Do not soften a sentence into
 * something vaguer: the specifics are the whole value.
 *
 * Three sections were written and held back until 14 November 2026, because
 * each said something that was not yet true on the live site: class games were
 * still listed in the public gallery, a teacher could not delete a child, and
 * the axe sweep still reported a serious violation on the lesson map. All
 * three were fixed that day and checked here before the sections went in.
 *
 * No imports: scripts/content-loader.js evaluates this file in a vm sandbox
 * that refuses require, so each side supplies its own configuration.
 */
export default function schoolFacts({ contactEmail, pricePerInterval, maxChildren }) {
  return {
    eyebrow: 'For schools',
    h1: 'CodeIt for a school: what your IT and privacy reviewers need to know',
    intro: 'This page answers the questions a school asks before a class uses a website: what has to be allowed on the network, what is stored about a child, who can see their work, and what CodeIt cannot offer. Each answer was checked against the product itself.',
    sections: [
      {
        heading: 'One address to allow',
        paragraphs: [
          'CodeIt needs one domain allowed: codeitlearn.com. The lessons, the Python editor and the games all work once that one address is reachable. There are no firewall routes, no plug-ins, nothing to install and nothing to push to a device.',
          'Python runs inside the browser and is served through codeitlearn.com, not from another company\'s server that the school would also have to allow.',
          'To test a school computer, open codeitlearn.com/check on it. That page tries everything CodeIt needs from that computer, on that network, and lists exactly what arrives and what is stopped, in words that can be copied and sent to whoever looks after the filter.',
        ],
      },
      {
        heading: 'Web filters that read inside files',
        paragraphs: [
          'Some school filters do more than allow or block an address: they inspect each file and can stop a script on a site they do not know. When that happens CodeIt notices that its files did not arrive and switches by itself to a version made only of small files, so the lessons, the quizzes, the Python playground and the game studio still open.',
          'In that version the code editor is plain, without colours. To get the full version back, allow codeitlearn.com for all file types and leave it out of content inspection.',
        ],
      },
      {
        heading: 'No third-party tracking',
        paragraphs: [
          'CodeIt loads no analytics pixels, no advertising tags and no fonts from another company\'s server. Every request the pages make goes to codeitlearn.com. There is nothing on these pages that reports a child\'s activity to anyone but CodeIt.',
        ],
      },
      {
        heading: 'What a classroom account holds',
        paragraphs: [
          'A child joins by typing a class code and a first name. The account that creates holds a first name, a username made from that first name and the class code, and a password the child never sees and never types.',
          'It holds no email address, no parent\'s email address, no date of birth and no surname.',
        ],
      },
      {
        heading: 'Who the adult is',
        paragraphs: [
          'The teacher who created the class is the adult on record for every child in it. The code is the secret, and the first name is how the room knows who made what. A child typing the same name into the same class signs back into the same work, which is how a child on a shared laptop gets back to yesterday\'s project without a password to lose.',
        ],
      },
      {
        heading: 'What leaves the classroom',
        paragraphs: [
          'Work made in a class is for the class. When a child publishes, the game appears on the class board and in the class arcade, where the room can play it. It is never listed in CodeIt\'s public gallery, and the page it opens on is hidden from search engines.',
          'Each game has a private link made of random characters, shown only inside the class. Anyone the link is given to can open it, the same way anyone given the class code can join the class.',
        ],
      },
      {
        heading: 'Deleting a child\'s data',
        paragraphs: [
          'A teacher can delete any child in their own class, and it removes everything: their projects, their lesson progress, their quiz answers, their comprehension records, their XP, their activity and the account itself. Nothing is kept as an archive.',
          'A parent who created a managed profile at home can do the same from the family account.',
        ],
      },
      {
        heading: 'Publishing',
        paragraphs: [
          'Saved work is private until someone chooses Publish. A managed profile for a child under 13 cannot publish at all. A classroom account publishes to its class, as described above, and never to the public gallery.',
          'Wherever a project is published, the page credits "CodeIt creator" and never shows the child\'s name.',
        ],
      },
      {
        heading: 'What the AI receives',
        paragraphs: [
          'When a child asks CodeIt to build something, what goes to the AI provider is the sentence the child typed and the project\'s own code. No name, no username, no account number and no identifier for the child is sent with it.',
          'The lessons and the Python playground use no AI at all. A child types Python and Python answers.',
        ],
      },
      {
        heading: 'Accessibility',
        paragraphs: [
          'Every main screen is checked against WCAG 2.1 AA with axe-core, the same engine behind Lighthouse, on every change. When it was last run, on 14 November 2026, it reported no serious or critical violations across the nine screens it covers.',
          'Text has a 13px floor, checked at phone, tablet and laptop widths. Every screen can be completed with taps alone.',
        ],
      },
      {
        heading: 'Ages',
        paragraphs: [
          'A learner aged 13 or over opens their own account. For anyone younger, a parent or guardian confirms their email and creates a private managed profile, which CodeIt supports from age 5. In a classroom, the teacher creates the class and children join with a code.',
        ],
      },
      {
        heading: 'What CodeIt does not have',
        paragraphs: [
          'CodeIt is a small product. It has no signed data processing agreement to offer, no SOC 2 report, no student data privacy pledge signature and no VPAT. If your district requires any of those before a trial, CodeIt cannot meet that today.',
          `Classes are free, and there is no school or district plan to buy. The one paid plan is ${pricePerInterval} for a family, covering up to ${maxChildren} children on one adult account.`,
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [
          `If your review needs an answer that is not on this page, write to ${contactEmail}. A person reads it.`,
        ],
      },
    ],
    detail: 'This page states what was checked, not a grade. If something here stops being true, the page changes.',
  };
}
