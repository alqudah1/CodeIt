import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import './SEOPage.css';

const FAQS = [
  {
    q: 'Are there real Python coding games for kids?',
    a: 'Yes. CodeIt\'s coding puzzles are story-driven games that use real Python code, not drag-and-drop blocks. Kids type actual Python, run it in the browser, and see results immediately. Each puzzle is built around one specific Python concept, so the skill feels necessary and the win feels earned. There is also a free Python playground where kids can experiment with code outside of the structured puzzles.',
  },
  {
    q: 'Do coding games actually teach programming skills?',
    a: 'When designed well, coding games are one of the most effective ways to build programming skills. CodeIt\'s puzzles are each directly tied to a lesson, so kids apply what they just learned in a real challenge. The combination of motivation (beating the level) and application (writing real code) leads to faster, deeper understanding than passive tutorials. Research on game-based learning consistently shows better retention and higher engagement compared to standard instruction.',
  },
  {
    q: 'Can kids play the coding games without doing the lessons first?',
    a: 'A lesson opens its three puzzles, and they are taken in order: the two practice puzzles, then the boss. Clearing the boss earns XP and opens the next lesson. If a child gets stuck, the lessons are always there to go back to, and a wrong answer costs nothing: the puzzle says which value was wrong and the child tries again.',
  },
  {
    q: 'What Python concepts do the coding games on CodeIt teach?',
    a: 'Lessons 1 to 10 each open three puzzles: two that practise the new idea and a boss that uses all of it. Lesson 1 covers print() with Hello World!, Space Mail and the boss Mission Banner; lesson 2 covers variables with Variable Vault, My Introduction and Profile Card; and it continues through strings, if statements, repetition, for loops, lists, loops with lists, functions, and a final lesson that combines them in Function + Loop, Loop + List + If and the boss Mini Program.',
  },
  {
    q: 'Are the Python coding games on CodeIt free?',
    a: 'Yes. Every coding puzzle on CodeIt is free to play, and so is the beginner Python path that goes with them. There is a paid plan, CodeIt Plus, at CA$12 a month plus tax, but none of the puzzles are behind it.',
  },
];

export default function PythonGamesForKids() {
  useSEO({
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
              solved by writing real Python code. Not dragging blocks. Making skills transfer
              directly to real-world programming.
            </p>
            <p className="seo-answer-box__detail">
              Unlike visual coding platforms, CodeIt uses actual Python syntax from the very first
              lesson, so what kids learn in the games is exactly what professional developers use.
              Lessons 1 to 10 each have three: two practice puzzles and a boss. The boss is the one
              that asks for everything the lesson covered at once, and clearing it opens the next
              lesson on the map.
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
                <Link to="/playground">Python playground</Link>. a free browser-based editor for
                testing ideas and practising concepts without any constraints.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">The puzzles, in the order a child meets them</h2>
              <p className="seo-p">
                Each lesson from 1 to 10 opens three puzzles: two that practise the idea and a boss
                that uses all of it. Solving the boss earns XP and opens the next lesson on the
                next lesson.
              </p>
              <ul className="seo-list">
                <li><strong>Lesson 1, print():</strong> Hello World!, Space Mail, and the boss,
                  Mission Banner.</li>
                <li><strong>Lesson 2, variables:</strong> Variable Vault, My Introduction, and the
                  boss, Profile Card.</li>
                <li><strong>Lesson 3, strings:</strong> String Joiner, String Tricks, and the boss,
                  Message Builder.</li>
                <li><strong>Lesson 4, if statements:</strong> Weather Check, Grade Checker, and the
                  boss, Temperature Report.</li>
                <li><strong>Lesson 5, repetition:</strong> Repeat It, Count Up, and the boss, Round
                  Counter.</li>
                <li><strong>Lesson 6, for loops:</strong> Letter Loop, Vowel Finder, and the boss,
                  Vowel Counter.</li>
                <li><strong>Lesson 7, lists:</strong> List Creator, List Builder, and the boss,
                  List Boss.</li>
                <li><strong>Lesson 8, loops with lists:</strong> List Printer, Loop Filter, and the
                  boss, Score Counter.</li>
                <li><strong>Lesson 9, functions:</strong> First Function, Function Return, and the
                  boss, Function Boss.</li>
                <li><strong>Lesson 10, putting it together:</strong> Function + Loop, Loop + List +
                  If, and the boss, Mini Program.</li>
              </ul>
              <p className="seo-p">
                All of them are free. The{' '}
                <Link to="/games">coding puzzles page</Link> opens the first of each of lessons 1
                to 5; the rest are reached by working through the lessons themselves.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">The puzzle checks what you wrote, not whether something ran</h2>
              <p className="seo-p">
                A puzzle that accepts any output is a puzzle a child can pass without learning
                anything, and for a long time most of these did exactly that. They looked for the
                right text appearing somewhere rather than asking whether the output was right.
                Printing the number 1 cleared the lesson 9 boss, whose task is to define a function,
                return a value from it, and call it.
              </p>
              <p className="seo-p">
                Now a puzzle expects specific lines in a specific order and nothing else. When a
                line is wrong, the message names the value that is wrong rather than saying the
                answer is incorrect, and it reports the first difference before it mentions the line
                count, because three different mistakes can produce the same number of lines. Every
                expected answer was produced by running the puzzle's own worked solution rather than
                typed by hand, which is how the old ones drifted away from what the lesson teaches.
              </p>
              <p className="seo-p">
                Where the goal names something the output cannot show, such as whether a function
                was actually defined, the code itself is checked. That is a last resort rather than
                the first move: a pattern that looks for the word "def" is easy to satisfy without
                understanding anything.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">How the Coding Journey Works</h2>
              <p className="seo-p">
                CodeIt isn't just a collection of isolated puzzles. It's a complete learning
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
                requires combining multiple concepts. It's a real test of what the kid has
                learned, not just a repeat of the lesson's examples.
              </p>
              <p className="seo-p">
                Progress is saved automatically. Kids can pick up where they left off at any time,
                on any device.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">What Python skill each chapter teaches</h2>
              <p className="seo-p">
                Nothing is asked for before it has been taught. The puzzles follow the lessons
                exactly, so a child never meets a challenge that needs something they have not seen:
              </p>
              <ul className="seo-list">
                <li><strong>print() and output:</strong> showing a message, then several in order</li>
                <li><strong>Variables:</strong> storing a value, then using it inside print()</li>
                <li><strong>Strings:</strong> joining text together and changing it</li>
                <li><strong>If statements:</strong> doing one thing or another depending on a value</li>
                <li><strong>Repetition:</strong> doing something a set number of times</li>
                <li><strong>For loops:</strong> walking through a word one letter at a time</li>
                <li><strong>Lists:</strong> holding several values and reaching one of them</li>
                <li><strong>Loops with lists:</strong> visiting every item, and counting only some</li>
                <li><strong>Functions:</strong> naming a piece of code, then giving an answer back</li>
                <li><strong>All of it together:</strong> a small program that uses the lot</li>
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
                  you're stuck, re-read the relevant section. The answer is usually in
                  the examples.</li>
                <li><strong>Try the playground:</strong> The <Link to="/playground">Python
                  playground</Link> is a great place to experiment with an idea before
                  bringing it into a puzzle.</li>
                <li><strong>Don't rush:</strong> Taking five minutes to understand a concept
                  properly is faster than spending an hour stuck because you skipped it.</li>
              </ul>
              <p className="seo-p">
                The puzzles on CodeIt have no time limit and no penalty for wrong answers. Try
                as many times as needed. The goal is understanding, not speed.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Python Games vs. Drag-and-Drop Coding</h2>
              <p className="seo-p">
                Many children's coding platforms use drag-and-drop blocks (like Scratch) as a
                starting point. These are great for introducing logic, but they have a ceiling , 
                block-based coding doesn't translate to real programming languages, and kids
                eventually need to make the jump to text-based code.
              </p>
              <p className="seo-p">
                CodeIt uses real Python from Lesson 1. Kids type actual code, read error messages,
                and learn to debug. The same skills professional developers use. The puzzles make
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
              Start with Lesson 1 to unlock Puzzle 1. or jump straight to the games
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
              <Link to="/guide/first-browser-game" className="seo-related__link">Guide: Build a browser game</Link>
              <Link to="/guide/best-coding-platforms-for-kids" className="seo-related__link">Guide: Coding platforms compared</Link>
              <Link to="/blog" className="seo-related__link">All Blog Posts</Link>
            </div>
          </nav>

        </div>
      </div>
    </>
  );
}
