import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import { trackEvent } from '../../utils/trackEvent';
import './SEOPage.css';

const FAQS = [
  {
    q: 'Is Python a good language for kids to learn?',
    a: 'Yes. Python is consistently ranked the best first programming language for beginners and kids. It uses simple, English-like syntax with no unnecessary punctuation, so kids can focus on thinking like a programmer rather than fighting the language. Python is also used professionally at companies like Google, NASA, and YouTube, so skills learned now remain valuable long-term.',
  },
  {
    q: 'What ages can use CodeIt?',
    a: 'Parents and legal guardians can create private managed profiles for learners ages 5 to 12 after confirming the adult account email. Independent learner accounts are for ages 13 and up, adults included.',
  },
  {
    q: 'Do kids need prior coding experience to use CodeIt?',
    a: 'No experience is needed. CodeIt\'s Lesson 1 starts from absolute zero. The very first step is writing a single line of Python. Every concept is introduced before it is used, so there are no assumptions about what a child already knows. Nothing needs to be installed; Python runs directly in the browser.',
  },
  {
    q: 'How long does each Python lesson take?',
    a: 'Most learners complete a lesson in 20 to 30 minutes, though there is no time limit. Kids can stop mid-lesson and pick up exactly where they left off at any time. Taking an extra 10 minutes to fully understand a concept is always worth more than rushing through to the next one.',
  },
  {
    q: 'Is CodeIt free to use?',
    a: 'Every lesson, the playground and building your own projects are free, and stay free. There is a paid plan, CodeIt Plus, at CA$12 a month plus tax, but you never need it to learn Python here.',
  },
];

export default function LearnPythonForKids() {
  useSEO({
    canonical:   '/learn-python-for-kids',
  });
  useFAQSchema(FAQS);

  return (
    <>
      <Header />
      <div className="seo-page">
        <div className="seo-container">

          <Link to="/" className="seo-back">&larr; Back to Home</Link>

          {/* ── Hero ──────────────────────────────────────── */}
          <header className="seo-hero">
            <span className="seo-eyebrow">Beginner Python, in the browser</span>
            <h1 className="seo-h1">
              Learn Python by making something work.
            </h1>
            <p className="seo-hero-desc">
              Write a line, run it, and see what changed. CodeIt gives beginners a clear path
              through real Python, free to start, with no download or signup needed for Lesson 1.
            </p>
            <div className="seo-cta-row">
              <Link
                to="/lesson/1"
                className="seo-cta-btn"
                onClick={() => void trackEvent('learning_start', 'lesson-one')}
              >
                Start Lesson 1. no signup &rarr;
              </Link>
              <Link
                to="/playground"
                className="seo-cta-link"
                onClick={() => void trackEvent('learning_start', 'playground')}
              >
                Try Python in the playground
              </Link>
            </div>
          </header>

          {/* ── Answer Box ────────────────────────────────── */}
          <section className="seo-answer-box" aria-label="Quick answer">
            <span className="seo-answer-box__label">Quick Answer</span>
            <p className="seo-answer-box__answer">
              CodeIt helps kids, teens, and other beginners learn Python through 31 interactive
              lessons, each covering one concept at a time. No experience or downloads needed.
            </p>
            <p className="seo-answer-box__detail">
              Every lesson includes a live code editor built into the page, so kids write and run
              real Python directly in their browser. After each lesson, a short quiz locks in the
              learning, and a story-driven coding puzzle makes the concept feel real and rewarding.
              For example, after Lesson 1, kids use <code>print()</code> to guide a robot through
              an adventure story. Applying the skill immediately in a fun context.
            </p>
          </section>

          {/* ── Body ──────────────────────────────────────── */}
          <div className="seo-body">

            <section className="seo-section">
              <h2 className="seo-h2">Why Python Is the Best First Language for Kids</h2>
              <p className="seo-p">
                Before a kid can build a game, a chatbot, or a calculator, they need a language that
                doesn't get in the way. Python is that language. It reads almost like plain English,
                so beginners can focus on learning how to think like a programmer. Not fighting with
                semicolons and curly braces.
              </p>
              <p className="seo-p">
                A Python program that says hello looks like this:
              </p>
              <div className="seo-highlight">
                <p>print("Hello, World!")</p>
              </div>
              <p className="seo-p">
                That's it. One line. Compare that to C++ or Java, where the same thing takes ten
                lines of boilerplate. Python's simplicity means kids get to the fun part faster.
              </p>
              <p className="seo-p">
                Python is also used everywhere: at Google, NASA, YouTube, and in data science and
                machine learning. Learning Python today opens real doors tomorrow. But right now,
                the most important thing is that it's fun to learn.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">What Kids Learn in CodeIt's Python Lessons</h2>
              <p className="seo-p">
                CodeIt teaches Python through 31 beginner lessons, each focused on one core concept.
                By the end, kids have a solid foundation in real Python programming:
              </p>
              <ul className="seo-list">
                <li><strong>Lesson 1:</strong> Hello Python. Using print() to display output</li>
                <li><strong>Lesson 2:</strong> Variables. Storing and updating information</li>
                <li><strong>Lesson 3:</strong> Strings. Working with text and basic string methods</li>
                <li><strong>Lesson 4:</strong> If Statements. Making decisions in code</li>
                <li><strong>Lesson 5:</strong> Simple Loops. Repeating actions with for and range()</li>
                <li><strong>Lesson 6:</strong> For Loops. Looping through strings and combining with if</li>
                <li><strong>Lesson 7:</strong> Lists. Creating and manipulating collections of data</li>
                <li><strong>Lesson 8:</strong> Loops with Lists. Combining loops and lists together</li>
                <li><strong>Lesson 9:</strong> Functions. Writing reusable blocks of code</li>
                <li><strong>Lesson 10:</strong> Combining Concepts. Functions, loops, and lists working together</li>
                <li><strong>Lesson 11:</strong> Numbers &amp; Arithmetic. Calculating with integers and decimals</li>
                <li><strong>Lesson 12:</strong> Booleans &amp; Comparisons. Testing whether something is true</li>
                <li><strong>Lesson 13:</strong> Logical Operators. Combining several conditions</li>
                <li><strong>Lesson 14:</strong> Type Casting. Converting between text and numbers</li>
                <li><strong>Lesson 15:</strong> String Formatting. Building messages with f-strings</li>
                <li><strong>Lesson 16:</strong> String Methods. Cleaning, searching, and changing text</li>
              </ul>
              <p className="seo-p">
                Each lesson has an interactive code editor built right into the page. No downloads,
                no setup. Kids write Python, run it, and see results instantly. You can also
                experiment freely in the <Link to="/playground">Python playground</Link> between
                lessons. A blank editor with starter presets, no account required.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Step-by-Step Beginner Python Lessons</h2>
              <p className="seo-p">
                The biggest mistake in learning to code is trying to learn too much at once. CodeIt
                solves this by introducing exactly one new concept per lesson, then reinforcing it
                through examples, practice exercises, and an interactive quiz before moving on.
              </p>
              <p className="seo-p">
                Each lesson follows the same pattern:
              </p>
              <ul className="seo-list">
                <li>A clear explanation of the concept in simple language</li>
                <li>A worked example with code the kid can read and run</li>
                <li>A practice challenge where they write code themselves</li>
                <li>A short quiz to lock in what they learned</li>
                <li>A coding puzzle that uses the new concept in a fun context</li>
              </ul>
              <p className="seo-p">
                This structure means kids are never just watching. They're coding from the very first
                lesson. Active practice is the fastest way to build programming skills, especially for
                young learners.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Coding Puzzles That Reinforce Every Lesson</h2>
              <p className="seo-p">
                After each lesson and quiz, a coding puzzle unlocks. These aren't abstract
                exercises. They're story-driven challenges where the concept the kid just learned
                is the key to solving the puzzle.
              </p>
              <p className="seo-p">
                After Lesson 1, kids guide a robot through a story using print(). After Lesson 2,
                they use variables to track scores in an apple-catching game. After Lesson 4, they
                use if statements to control a character's decisions. The puzzle makes the concept
                feel real and worthwhile.
              </p>
              <p className="seo-p">
                You can explore all the <Link to="/games">coding puzzles for kids</Link> on CodeIt,
                or jump straight into the <Link to="/journey">Python coding journey</Link> to unlock
                them in order.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Who Is This For?</h2>
              <p className="seo-p">
                Parents and legal guardians can create private managed profiles for learners ages
                5 to 12 after confirming the adult account email. Independent student accounts are
                open to anyone aged 13 or over. No coding experience is needed, the first lesson starts from zero,
                the language is simple, the instructions
                are friendly, and there's nothing to install.
              </p>
              <p className="seo-p">
                It's also a great fit for:
              </p>
              <ul className="seo-list">
                <li>Parents who want a structured, safe place for their child to learn coding</li>
                <li>Teachers looking for a free, self-paced Python resource for students</li>
                <li>Older beginners (teens and adults) who want a gentle introduction to Python</li>
                <li>Kids who've tried other platforms but found them too hard or too boring</li>
              </ul>
              <p className="seo-p">
                The gamified format. XP, leaderboards, an avatar system, and a journey map. Keeps
                young learners motivated well past the first few lessons.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">How to Start Learning Python Today</h2>
              <p className="seo-p">
                Open Lesson 1 and write your first line of Python. CodeIt currently includes 16
                beginner lessons, quizzes, and five coding puzzles, with useful activities available
                free while the family plan is still being tested.
              </p>
              <p className="seo-p">
                Want to explore before signing up? Try the{' '}
                <Link to="/playground">free Python playground</Link>. write and run Python in your
                browser instantly, no account needed. Read our{' '}
                <Link to="/blog/learn-python-for-kids">guide to learning Python for kids</Link>
                {' '}for more tips, or check the <Link to="/blog">CodeIt blog</Link> for articles on
                coding games and beginner Python guides.
              </p>
            </section>

            {/* ── FAQ Section ───────────────────────────────── */}
            <section className="seo-section">
              <h2 className="seo-h2">Frequently Asked Questions</h2>
              <div className="seo-faq" itemScope itemType="https://schema.org/FAQPage">
                {FAQS.map(({ q, a }) => (
                  <div
                    key={q}
                    className="seo-faq__item"
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <p className="seo-faq__q" itemProp="name">{q}</p>
                    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                      <p className="seo-faq__a" itemProp="text">{a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* ── Bottom CTA ────────────────────────────────── */}
          <div className="seo-bottom-cta">
            <h2>Ready to Learn Python?</h2>
            <p>
              31 free beginner lessons, no downloads, no credit card. Start Lesson 1 in under a
              minute. Or try the playground first to see Python in action.
            </p>
            <Link
              to="/lesson/1"
              className="seo-cta-btn"
              onClick={() => void trackEvent('learning_start', 'lesson-one')}
            >
              Open Lesson 1. No Signup Needed &rarr;
            </Link>
          </div>

          {/* ── Related links ─────────────────────────────── */}
          <nav className="seo-related" aria-label="Related pages">
            <p className="seo-related__title">Explore on CodeIt</p>
            <div className="seo-related__links">
              <Link to="/" className="seo-related__link">Home</Link>
              <Link to="/lessons" className="seo-related__link">All Python Lessons</Link>
              <Link to="/playground" className="seo-related__link">Python Playground</Link>
              <Link to="/games" className="seo-related__link">Coding Puzzles</Link>
              <Link to="/coding-for-kids" className="seo-related__link">Coding for Kids</Link>
              <Link to="/python-games-for-kids" className="seo-related__link">Python Games for Kids</Link>
              <Link to="/blog/learn-python-for-kids" className="seo-related__link">Blog: Learn Python for Kids</Link>
              <Link to="/blog" className="seo-related__link">All Blog Posts</Link>
              <Link to="/guide/after-scratch" className="seo-related__link">Guide: What to use after Scratch</Link>
              <Link to="/guide/coding-for-kids-by-age" className="seo-related__link">Guide: Coding for kids, by age</Link>
            </div>
          </nav>

        </div>
      </div>
    </>
  );
}
