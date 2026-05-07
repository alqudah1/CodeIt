import { Link } from 'react-router-dom';
import Header from '../Header/Header';
import { useSEO } from '../../hooks/useSEO';
import { useFAQSchema } from '../../hooks/useFAQSchema';
import './SEOPage.css';

const FAQS = [
  {
    q: 'What is the best way for a kid to start learning coding?',
    a: 'The best starting point is a beginner-friendly language with simple syntax — Python is the top recommendation for kids and first-time coders. From there, following a structured path (like CodeIt\'s 10-lesson journey) works far better than watching random tutorials, because each lesson builds directly on the last. Consistent short sessions of 20–30 minutes beat occasional long ones.',
  },
  {
    q: 'How do I know if my child is ready to start coding?',
    a: 'If a child can read simple instructions and type basic text, they are ready to start coding. CodeIt is designed for ages 8 and up, but many younger children can follow along with a parent\'s help. There is no maths requirement beyond basic arithmetic, and no prior technology experience is needed — Lesson 1 starts from the very beginning.',
  },
  {
    q: 'Can kids learn coding on their own without a parent\'s help?',
    a: 'Yes. CodeIt is designed for independent learning — lessons are self-paced, instructions are written in simple language, and the in-browser code editor gives instant feedback without needing a teacher. Parents don\'t need to know anything about coding to support their child on CodeIt. Simply creating a free account and opening Lesson 1 is all it takes to get started.',
  },
  {
    q: 'What do kids actually build when they learn Python on CodeIt?',
    a: 'Kids start with simple print statements in Lesson 1 and progressively learn variables, strings, if statements, loops, lists, and functions. By Lesson 10, they are combining all of these concepts in one programme. Along the way, they solve real coding puzzles — like using variables to track scores in a game, or using loops to control a character\'s movements. It feels more like an adventure than a course.',
  },
  {
    q: 'How long does it take a kid to complete the beginner Python journey?',
    a: 'With two or three lessons per week, most kids complete CodeIt\'s 10-lesson beginner Python journey in four to six weeks. Each lesson takes around 20 to 30 minutes. Progress is saved automatically, so kids can return at any time and continue exactly where they left off. There is no deadline or pressure to move faster than feels comfortable.',
  },
];

export default function CodingForKids() {
  useSEO({
    title:       'Coding for Kids | Learn Python for Free — CodeIt',
    description: 'Free coding for kids — learn Python through interactive lessons, quizzes, and coding puzzles. Built for ages 8–14 with no experience needed.',
    canonical:   '/coding-for-kids',
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
            <span className="seo-eyebrow">Free Coding for Kids</span>
            <h1 className="seo-h1">
              Coding for Kids — Learn Python Step by Step
            </h1>
            <p className="seo-hero-desc">
              CodeIt is a free, gamified platform where kids learn real Python coding through
              interactive lessons, quizzes, and puzzles. No experience needed, nothing to install
              — just open a lesson and start coding.
            </p>
            <Link to="/journey" className="seo-cta-btn">
              Start Coding for Free &rarr;
            </Link>
          </header>

          {/* ── Answer Box ────────────────────────────────── */}
          <section className="seo-answer-box" aria-label="Quick answer">
            <span className="seo-answer-box__label">Quick Answer</span>
            <p className="seo-answer-box__answer">
              Coding for kids on CodeIt means learning real Python through a structured journey of
              10 free lessons, 10 quizzes, and 5+ coding puzzles — all running in the browser with
              nothing to install and no experience required.
            </p>
            <p className="seo-answer-box__detail">
              The platform is built around one core idea: kids learn best when they are actively
              writing code, not watching videos. Each lesson introduces one concept, the quiz
              checks understanding, and the puzzle applies the skill in a fun, story-based game.
              A child who completes the full journey can write functions, work with lists, and
              understand how real Python programs are structured — skills that transfer directly
              to school, university, and future careers in technology.
            </p>
          </section>

          {/* ── Body ──────────────────────────────────────── */}
          <div className="seo-body">

            <section className="seo-section">
              <h2 className="seo-h2">Why Learning to Code Changes Everything for Kids</h2>
              <p className="seo-p">
                Coding is one of the most valuable skills a child can develop. It trains logical
                thinking, problem-solving, and creativity — the same skills that help in maths,
                science, writing, and everyday decision-making.
              </p>
              <p className="seo-p">
                But beyond the practical benefits, coding is fun. When a kid writes a programme
                that does something real — moves a character, answers a question, solves a puzzle
                — there's a moment of genuine excitement. That feeling is what keeps them coming back.
              </p>
              <p className="seo-p">
                The earlier kids start, the more natural it becomes. Children who learn to code
                alongside reading and maths develop a fluency with technology that most adults
                never gain. It's not about making every child a software engineer — it's about
                giving them a tool that opens doors.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Why Python Is the Right Starting Point</h2>
              <p className="seo-p">
                There are dozens of programming languages, but Python is consistently the best
                choice for kids and first-time coders. Here's why:
              </p>
              <ul className="seo-list">
                <li><strong>Simple syntax:</strong> Python reads like English. There's no
                  unnecessary punctuation cluttering up the code.</li>
                <li><strong>Instant results:</strong> Kids can write one line and see something
                  happen immediately — no waiting, no compiling.</li>
                <li><strong>Real-world use:</strong> Python powers YouTube, Instagram, NASA
                  data tools, and most machine learning research. It's not a toy language.</li>
                <li><strong>Huge community:</strong> More tutorials, more help online, and more
                  resources for beginners than any other language.</li>
                <li><strong>It scales:</strong> A kid who starts with print("Hello") can eventually
                  build web apps, games, or data science projects — all in the same language.</li>
              </ul>
              <p className="seo-p">
                CodeIt is built entirely around Python, so every lesson, quiz, and coding puzzle
                reinforces the same language and builds on what came before. Kids can also
                experiment freely in the <Link to="/playground">Python playground</Link> — a
                browser-based editor with starter presets, available without an account.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">How CodeIt Makes Coding for Kids Fun</h2>
              <p className="seo-p">
                Most coding platforms for kids fall into one of two traps: they're either so
                simplified that they don't teach real skills, or they're so academic that kids
                lose interest after the first lesson. CodeIt is built to avoid both.
              </p>
              <p className="seo-p">
                The platform uses a gamified learning system:
              </p>
              <ul className="seo-list">
                <li><strong>XP and progression:</strong> Every completed lesson, quiz, and puzzle
                  earns experience points. Progress is visible and rewarding.</li>
                <li><strong>Journey Map:</strong> The learning path is a literal adventure map —
                  each node is a lesson, quiz, or puzzle to unlock.</li>
                <li><strong>Coding puzzles:</strong> Each lesson is followed by a story-driven
                  coding challenge that uses the new concept in a fun context.</li>
                <li><strong>Leaderboard:</strong> Friendly competition motivates consistent
                  practice and gives learners a visible goal to aim for.</li>
                <li><strong>Avatar Lab:</strong> Kids build and customise a personal coding
                  avatar that levels up as they learn.</li>
              </ul>
              <p className="seo-p">
                This combination keeps coding from feeling like homework. Kids come back because
                they want to beat the next puzzle, not because someone told them to.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">What You'll Find on CodeIt</h2>
              <p className="seo-p">
                CodeIt's beginner Python journey covers everything a new coder needs:
              </p>
              <ul className="seo-list">
                <li>10 interactive <Link to="/lessons">beginner Python lessons</Link> with in-browser
                  code editors</li>
                <li>10 quizzes that test understanding before moving to the next chapter</li>
                <li>5+ <Link to="/games">coding puzzles</Link> that apply each concept in a game
                  setting</li>
                <li>A full <Link to="/journey">journey map</Link> that tracks progress and unlocks
                  content step by step</li>
                <li>A <Link to="/playground">Python playground</Link> for free-form coding and
                  experimentation</li>
                <li>A leaderboard to compare progress with other learners</li>
                <li>A <Link to="/blog">learning blog</Link> with guides, tips, and Python
                  explanations</li>
              </ul>
              <p className="seo-p">
                Everything is free to use. Creating an account unlocks progress tracking, XP,
                leaderboard access, and the avatar customisation system.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">How Old Should Kids Be to Start Coding?</h2>
              <p className="seo-p">
                CodeIt is designed for kids aged 8–14. Most children can follow the lessons
                comfortably from around age 9 or 10, when reading comprehension and basic
                problem-solving are well established.
              </p>
              <p className="seo-p">
                Younger kids (6–8) may benefit from having a parent work through the first few
                lessons with them. The coding itself isn't difficult at that age — the challenge
                is understanding what the instructions are asking for. A short explanation from
                a parent is often all it takes.
              </p>
              <p className="seo-p">
                Older beginners — teens and adults — will find the lessons move at a comfortable
                pace. The beginner-friendly tone and step-by-step format work just as well for
                first-time coders of any age.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Tips for Parents: Supporting a Young Coder</h2>
              <p className="seo-p">
                You don't need to know anything about coding to support your child. A few things
                that make a real difference:
              </p>
              <ul className="seo-list">
                <li>Let them go at their own pace — rushing through lessons is worse than
                  taking extra time to understand each one</li>
                <li>Celebrate small wins — finishing a lesson, passing a quiz, and beating a
                  puzzle are all worth acknowledging</li>
                <li>Let them struggle a little — working through a problem independently builds
                  the problem-solving muscle that makes a good programmer</li>
                <li>Keep sessions short — 20–30 minutes of focused coding is more effective
                  than a 2-hour marathon</li>
              </ul>
              <p className="seo-p">
                Read our <Link to="/blog/coding-for-kids-beginner-guide">full beginner guide to
                coding for kids</Link> for more advice, or explore the{' '}
                <Link to="/blog">CodeIt blog</Link> for Python tips and learning strategies.
              </p>
            </section>

            <section className="seo-section">
              <h2 className="seo-h2">Coding Puzzles: Where the Fun Happens</h2>
              <p className="seo-p">
                The coding puzzles are where most kids say CodeIt really clicks. After learning
                a concept in a lesson, they get to use it to solve a real challenge — and the
                context makes all the difference.
              </p>
              <p className="seo-p">
                Check out our page on <Link to="/python-games-for-kids">Python games for kids</Link>
                {' '}to see what's in the puzzle collection and how each game ties to a specific
                Python skill.
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
            <h2>Free Coding for Kids — Start Today</h2>
            <p>
              No experience, no downloads, no cost. Create a free account and start
              Lesson 1 in under a minute — or try the{' '}
              <Link to="/playground" style={{ color: '#FF8A3D', fontWeight: 700 }}>Python playground</Link>
              {' '}first.
            </p>
            <Link to="/journey" className="seo-cta-btn">
              Begin the Coding Journey &rarr;
            </Link>
          </div>

          {/* ── Related links ─────────────────────────────── */}
          <nav className="seo-related" aria-label="Related pages">
            <p className="seo-related__title">Explore on CodeIt</p>
            <div className="seo-related__links">
              <Link to="/" className="seo-related__link">Home</Link>
              <Link to="/learn-python-for-kids" className="seo-related__link">Learn Python for Kids</Link>
              <Link to="/python-games-for-kids" className="seo-related__link">Python Games for Kids</Link>
              <Link to="/lessons" className="seo-related__link">Python Lessons</Link>
              <Link to="/playground" className="seo-related__link">Python Playground</Link>
              <Link to="/games" className="seo-related__link">Coding Puzzles</Link>
              <Link to="/blog/coding-for-kids-beginner-guide" className="seo-related__link">Blog: Coding for Kids Guide</Link>
              <Link to="/blog" className="seo-related__link">All Blog Posts</Link>
            </div>
          </nav>

        </div>
      </div>
    </>
  );
}
