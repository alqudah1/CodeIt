import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import './SEOPage.css';

const FAQS = [
  {
    q: 'Are there real Python coding games for kids?',
    a: 'Yes — CodeIt\'s coding puzzles are story-driven games that use real Python code, not drag-and-drop blocks. Kids type actual Python, run it in the browser, and see results immediately. Each puzzle is built around one specific Python concept, so the skill feels necessary and the win feels earned. There is also a free Python playground where kids can experiment with code outside of the structured puzzles.',
  },
  {
    q: 'Do coding games actually teach programming skills?',
    a: 'When designed well, coding games are one of the most effective ways to build programming skills. CodeIt\'s puzzles are each directly tied to a lesson, so kids apply what they just learned in a real challenge. The combination of motivation (beating the level) and application (writing real code) leads to faster, deeper understanding than passive tutorials. Research on game-based learning consistently shows better retention and higher engagement compared to standard instruction.',
  },
  {
    q: 'Can kids play the coding games without doing the lessons first?',
    a: 'On CodeIt, coding puzzles unlock after completing the matching lesson and quiz. This ensures kids have the Python skills they need before attempting each challenge — preventing frustration and making success feel earned rather than accidental. If a child gets stuck on a puzzle, they can always revisit the matching lesson for a refresher.',
  },
  {
    q: 'What Python concepts do the coding games on CodeIt teach?',
    a: 'The current five puzzles cover: print statements (Puzzle 1 — Talking Robot Adventure), variables (Puzzle 2 — Apple Game Challenge), for loops (Puzzle 3 — Loop Game Challenge), if/else statements (Puzzle 4 — Condition Game Master), and arithmetic expressions (Puzzle 5 — Math Game Quest). More puzzles covering dictionaries, file handling, exception handling, and object-oriented programming are in development.',
  },
  {
    q: 'Are the Python coding games on CodeIt free?',
    a: 'Yes — all current coding puzzles on CodeIt are free to play. The current learning path also includes 16 beginner lessons and matching quizzes. A paid family plan is being tested, but it is not live and CodeIt does not collect payment today.',
  },
];

export default function PythonGamesForKids() {
  useSEO({
    title:       'Python Games for Kids | Coding Puzzles — CodeIt',
    description: 'Python games for kids — solve coding puzzles and beat game challenges to learn Python on CodeIt. Unlock new games as you complete each lesson.',
    canonical:   '/python-games-for-kids',
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
            <span className="seo-eyebrow">Real Python, playful challenges</span>
            <h1 className="seo-h1">
              Python games that make every line matter.
            </h1>
            <p className="seo-hero-desc">
              Each short challenge gives a beginner a reason to use loops, variables, or conditions.
              They type real Python, run it, and see what their code changed.
            </p>
            <Link to="/games" className="seo-cta-btn">
              Explore the Coding Puzzles &rarr;
            </Link>
          </header>

          {/* ── Answer Box ────────────────────────────────── */}
          <section className="seo-answer-box" aria-label="Quick answer">
            <span className="seo-answer-box__label">Quick Answer</span>
            <p className="seo-answer-box__answer">
              CodeIt's Python games for kids are story-driven coding puzzles where each game is
              solved by writing real Python code — not dragging blocks — making skills transfer
              directly to real-world programming.
            </p>
            <p className="seo-answer-box__detail">
              Unlike visual coding platforms, CodeIt uses actual Python syntax from the very first
              lesson, so what kids learn in the games is exactly what professional developers use.
              Each puzzle unlocks after its matching lesson and covers one specific concept: Puzzle 1
              uses <code>print()</code>, Puzzle 2 uses variables, Puzzle 3 uses for loops, Puzzle 4
              uses if/else statements, and Puzzle 5 uses arithmetic expressions. For example, in the
              Apple Game Challenge, kids use variables to track and update a score as the game
              plays out — making an abstract concept immediately concrete and fun.
            </p>
          </section>

          {/* ── Body ──────────────────────────────────────── */}
          <div className="seo-body">

            <section className="seo-section">
              <h2 className="seo-h2">Why Games Are the Best Way to Learn Python</h2>
              <p className="seo-p">
                When kids learn Python through games, something different happens. Instead of
                asking "why do I need to know this?", they ask "how do I make this work?" That
                shift in motivation is enormous.
              </p>
              <p className="seo-p">
                A traditional lesson might explain loops by showing five lines of code with an
                arrow diagram. A puzzle makes loops the only tool that can beat the level. One
                feels abstract; the other feels urgent. Kids remember what they worked hard to
                figure out, not what they were told.
              </p>
              <p className="seo-p">
                Research on game-based learning consistently shows better retention, higher
                engagement, and more time-on-task compared to standard tutorials. CodeIt is built
                around this evidence. Between puzzles, kids can also experiment in the{' '}
                <Link to="/playground">Python playground</Link> — a free browser-based editor for
                testing ideas and practising concepts without any constraints.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">The CodeIt Coding Puzzle Collection</h2>
              <p className="seo-p">
                Each puzzle on CodeIt is tied directly to a lesson. Completing the lesson unlocks
                the puzzle; solving the puzzle earns XP and unlocks the next chapter. Here's the
                current puzzle lineup:
              </p>
              <ul className="seo-list">
                <li><strong>Puzzle 1 — Talking Robot Adventure:</strong> Use print() to guide a
                  robot through a story. Covers Lesson 1: Hello Python.</li>
                <li><strong>Puzzle 2 — Apple Game Challenge:</strong> Use variables to track and
                  update a score in an apple-catching challenge. Covers Lesson 2: Variables.</li>
                <li><strong>Puzzle 3 — Loop Game Challenge:</strong> Use for loops to repeat actions
                  and make a programme more efficient. Covers loops.</li>
                <li><strong>Puzzle 4 — Condition Game Master:</strong> Use if/else to make
                  a character respond differently to different situations. Covers Lesson 4:
                  If Statements.</li>
                <li><strong>Puzzle 5 — Math Game Quest:</strong> Use arithmetic expressions to
                  solve challenges and advance through levels. Covers expressions.</li>
              </ul>
              <p className="seo-p">
                More puzzles — covering dictionaries, file handling, exceptions, OOP, and modules
                — are coming soon. View the full list on the{' '}
                <Link to="/games">coding puzzles page</Link>.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">How the Coding Journey Works</h2>
              <p className="seo-p">
                CodeIt isn't just a collection of isolated puzzles — it's a complete learning
                adventure. The <Link to="/journey">Journey Map</Link> shows the full path: lessons,
                quizzes, and puzzles connected in a sequence that builds skills progressively.
              </p>
              <p className="seo-p">
                Here's how each chapter works:
              </p>
              <ul className="seo-list">
                <li>Complete the lesson to unlock the quiz</li>
                <li>Pass the quiz to unlock the puzzle</li>
                <li>Solve the puzzle to earn XP and advance to the next chapter</li>
              </ul>
              <p className="seo-p">
                Each chapter also includes mini puzzles and a boss challenge. The boss puzzle
                requires combining multiple concepts — it's a real test of what the kid has
                learned, not just a repeat of the lesson's examples.
              </p>
              <p className="seo-p">
                Progress is saved automatically. Kids can pick up where they left off at any time,
                on any device.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">What Python Skill Each Game Teaches</h2>
              <p className="seo-p">
                Every puzzle on CodeIt is designed to make a specific Python concept feel natural
                and necessary. Here's the skill map:
              </p>
              <ul className="seo-list">
                <li><strong>print() and output:</strong> Talking Robot Adventure (Puzzle 1)</li>
                <li><strong>Variables and assignment:</strong> Apple Game Challenge (Puzzle 2)</li>
                <li><strong>For loops and range():</strong> Loop Game Challenge (Puzzle 3)</li>
                <li><strong>If/else and conditionals:</strong> Condition Game Master (Puzzle 4)</li>
                <li><strong>Arithmetic expressions:</strong> Math Game Quest (Puzzle 5)</li>
              </ul>
              <p className="seo-p">
                Because each puzzle maps directly to a lesson, kids who are struggling with a
                concept can revisit the matching <Link to="/lessons">Python lesson</Link>, then try
                the puzzle again with fresh understanding. The cycle of learn → test → play →
                revisit is how lasting skill is built.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Tips for Kids Trying Coding Games for the First Time</h2>
              <p className="seo-p">
                A few habits that make coding puzzles much more manageable:
              </p>
              <ul className="seo-list">
                <li><strong>Read the goal first:</strong> Before writing any code, understand what
                  the puzzle is asking. Half of getting unstuck is knowing exactly what "success"
                  looks like.</li>
                <li><strong>Start small:</strong> Write one line, run it, see what happens.
                  Don't try to write the whole solution before testing anything.</li>
                <li><strong>Use the lesson:</strong> Each puzzle links back to its lesson. If
                  you're stuck, re-read the relevant section — the answer is usually in
                  the examples.</li>
                <li><strong>Try the playground:</strong> The <Link to="/playground">Python
                  playground</Link> is a great place to experiment with an idea before
                  bringing it into a puzzle.</li>
                <li><strong>Don't rush:</strong> Taking five minutes to understand a concept
                  properly is faster than spending an hour stuck because you skipped it.</li>
              </ul>
              <p className="seo-p">
                The puzzles on CodeIt have no time limit and no penalty for wrong answers. Try
                as many times as needed — the goal is understanding, not speed.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Python Games vs. Drag-and-Drop Coding</h2>
              <p className="seo-p">
                Many children's coding platforms use drag-and-drop blocks (like Scratch) as a
                starting point. These are great for introducing logic, but they have a ceiling —
                block-based coding doesn't translate to real programming languages, and kids
                eventually need to make the jump to text-based code.
              </p>
              <p className="seo-p">
                CodeIt uses real Python from Lesson 1. Kids type actual code, read error messages,
                and learn to debug — the same skills professional developers use. The puzzles make
                this feel like a game rather than a chore, so the transition from blocks to text
                is smooth and natural.
              </p>
              <p className="seo-p">
                Explore more in our guide to{' '}
                <Link to="/blog/best-coding-games-for-kids">the best coding games for kids</Link>,
                or read about{' '}
                <Link to="/learn-python-for-kids">why Python is the best first language</Link> for
                young learners.
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
            <h2>Ready to Play Your First Python Game?</h2>
            <p>
              Start with Lesson 1 to unlock Puzzle 1 — or jump straight to the games
              page to see everything available. All free, no download needed.
            </p>
            <Link to="/journey" className="seo-cta-btn">
              Start the Python Journey &rarr;
            </Link>
          </div>

          {/* ── Related links ─────────────────────────────── */}
          <nav className="seo-related" aria-label="Related pages">
            <p className="seo-related__title">Explore on CodeIt</p>
            <div className="seo-related__links">
              <Link to="/" className="seo-related__link">Home</Link>
              <Link to="/games" className="seo-related__link">All Coding Puzzles</Link>
              <Link to="/journey" className="seo-related__link">Journey Map</Link>
              <Link to="/lessons" className="seo-related__link">Python Lessons</Link>
              <Link to="/playground" className="seo-related__link">Python Playground</Link>
              <Link to="/learn-python-for-kids" className="seo-related__link">Learn Python for Kids</Link>
              <Link to="/coding-for-kids" className="seo-related__link">Coding for Kids</Link>
              <Link to="/blog/best-coding-games-for-kids" className="seo-related__link">Blog: Best Coding Games</Link>
              <Link to="/blog/python-coding-games" className="seo-related__link">Blog: Python Coding Games</Link>
              <Link to="/blog" className="seo-related__link">All Blog Posts</Link>
            </div>
          </nav>

        </div>
      </div>
    </>
  );
}
