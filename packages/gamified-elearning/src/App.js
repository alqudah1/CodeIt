import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Home from './pages/Home/Home';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ParentReview from './pages/Auth/ParentReview';
import { TOTAL_LESSONS } from './pages/Lessons/lessonRegistry';
import DeadEnd from './components/DeadEnd/DeadEnd';
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { CharacterProvider } from './context/CharacterContext';
import RequireAdmin from './pages/Admin/RequireAdmin';
import AcquisitionTracker from './components/AcquisitionTracker/AcquisitionTracker';
import ActivityTracker from './components/ActivityTracker/ActivityTracker';

// ── Lazy-loaded routes ────────────────────────────────────────────
const MainPage       = lazy(() => import('./pages/MainPage/MainPage'));
const LessonMap      = lazy(() => import('./pages/Lessons/LessonMap'));

const LessonRoute    = lazy(() => import('./pages/Lessons/LessonRoute'));

const Quiz         = lazy(() => import('./pages/Quizzes/Quiz'));

const GameHub      = lazy(() => import('./pages/Games/GameHub'));
const Game1        = lazy(() => import('./pages/Games/Game1'));
const Game2        = lazy(() => import('./pages/Games/Game2'));
const Game3        = lazy(() => import('./pages/Games/Game3'));
const Game4        = lazy(() => import('./pages/Games/Game4'));
const Game5        = lazy(() => import('./pages/Games/Game5'));
const Game6        = lazy(() => import('./pages/Games/Game6'));
const Game7        = lazy(() => import('./pages/Games/Game7'));
const Game8        = lazy(() => import('./pages/Games/Game8'));
const Game9        = lazy(() => import('./pages/Games/Game9'));
const Game10       = lazy(() => import('./pages/Games/Game10'));

const JourneyPath   = lazy(() => import('./pages/Journey/JourneyPath'));
const JourneyPuzzle = lazy(() => import('./pages/Journey/JourneyPuzzle'));

const CharacterLab  = lazy(() => import('./pages/CharacterLab/CharacterLab'));
const Leaderboard   = lazy(() => import('./pages/Leaderboard'));
const Playground    = lazy(() => import('./pages/Playground/Playground'));
const Builder       = lazy(() => import('./pages/Builder/Builder'));
const PublicProject = lazy(() => import('./pages/Builder/PublicProject'));
const EvidenceShare = lazy(() => import('./pages/Profile/EvidenceShare'));
const Explore       = lazy(() => import('./pages/Builder/Explore'));
const Profile       = lazy(() => import('./pages/Profile/Profile'));
const Pricing       = lazy(() => import('./pages/Pricing/Pricing'));
const Privacy       = lazy(() => import('./pages/Legal/Privacy'));
const Terms         = lazy(() => import('./pages/Legal/Terms'));
const CreatorBrief  = lazy(() => import('./pages/CreatorBrief/CreatorBrief'));
const InvestorBrief = lazy(() => import('./pages/InvestorBrief/InvestorBrief'));
const FirstGameChallenge = lazy(() => import('./pages/Challenge/FirstGameChallenge'));

const BlogIndex         = lazy(() => import('./pages/Blog/BlogIndex'));
const BlogPost          = lazy(() => import('./pages/Blog/BlogPost'));
const GuideIndex        = lazy(() => import('./pages/Guide/GuideIndex'));
const GuidePage         = lazy(() => import('./pages/Guide/GuidePage'));
const About             = lazy(() => import('./pages/About/About'));
const Faq               = lazy(() => import('./pages/About/Faq'));
const Press             = lazy(() => import('./pages/Press/Press'));
const LearnPythonForKids = lazy(() => import('./pages/SEO/LearnPythonForKids'));
const CodingForKids     = lazy(() => import('./pages/SEO/CodingForKids'));
const PythonGamesForKids = lazy(() => import('./pages/SEO/PythonGamesForKids'));
const AIWebsiteBuilderForKids = lazy(() => import('./pages/SEO/AIWebsiteBuilderForKids'));

const AdminDashboard  = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminUsers      = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/Admin/AdminUserDetail'));
const AdminStats      = lazy(() => import('./pages/Admin/AdminStats'));
const AdminAvatars    = lazy(() => import('./pages/Admin/AdminAvatars'));
const AdminFunnel     = lazy(() => import('./pages/Admin/AdminFunnel'));
const AdminEvidence   = lazy(() => import('./pages/Admin/AdminEvidence'));

// ── Page loading fallback ─────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#fdf8f3',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '4px solid rgba(255,122,77,0.18)',
      borderTopColor: '#e8692d',
      animation: 'page-spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes page-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Quiz validation wrapper ───────────────────────────────────────
//
// This list used to be typed out as '1' through '16'. The curriculum grew to
// 31 lessons and the list did not, so every lesson from 17 onward sent a child
// who had just finished it to the bare string "Invalid Quiz ID" — half the
// course, ending in what looks like a crash.
//
// It is derived from the lesson registry now, so the two cannot drift apart
// again. A quiz with no questions in the database is a different case and Quiz
// itself already says so in plain words.
const QuizWrapper = () => {
  const { quizId } = useParams();
  const id = Number(quizId);
  if (!Number.isInteger(id) || id < 1 || id > TOTAL_LESSONS) {
    return (
      <DeadEnd
        title="That quiz doesn't exist"
        line={`There are ${TOTAL_LESSONS} lessons, and each one has its own quiz.`}
        doors={[
          { label: 'See all the lessons', to: '/lessons', primary: true },
          { label: 'Make something', to: '/builder' },
        ]}
      />
    );
  }
  return <Quiz quizId={quizId} />;
};

const App = () => (
  <AuthProvider>
    <ProgressProvider>
      <CharacterProvider>
        <Router>
          <AcquisitionTracker />
          <ActivityTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public / always-eager ── */}
              <Route path="/"         element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/parent-review" element={<ParentReview />} />

              {/* ── Dashboard ── */}
              <Route path="/MainPage" element={<MainPage />} />

              {/* ── Lessons ── */}
              <Route path="/lessons"    element={<LessonMap />} />
              <Route path="/lesson/:lessonId" element={<LessonRoute />} />

              {/* ── Quiz ── */}
              <Route path="/quiz/:quizId" element={<QuizWrapper />} />

              {/* ── Games ── */}
              <Route path="/games"   element={<GameHub />} />
              <Route path="/game/1"  element={<Game1  />} />
              <Route path="/game/2"  element={<Game2  />} />
              <Route path="/game/3"  element={<Game3  />} />
              <Route path="/game/4"  element={<Game4  />} />
              <Route path="/game/5"  element={<Game5  />} />
              <Route path="/game/6"  element={<Game6  />} />
              <Route path="/game/7"  element={<Game7  />} />
              <Route path="/game/8"  element={<Game8  />} />
              <Route path="/game/9"  element={<Game9  />} />
              <Route path="/game/10" element={<Game10 />} />

              {/* ── Journey ── */}
              {/* One path, not two — but /journey is not free to redirect.
                  It is one of the 74 URLs in the sitemap, with its own
                  generated static HTML and schema, and the lesson pages link
                  to it. A redirect behind a canonical sitemap entry is the
                  soft-404 pattern that already cost this domain once (/press).
                  So the duplicate COURSE is gone — the lesson map absorbed its
                  one good idea, your avatar standing on the step you are up to
                  — and this route keeps a real page that says what the static
                  HTML already promises, with one door to the single path. */}
              <Route path="/journey" element={<JourneyPath />} />
              <Route path="/journey/puzzle/:lessonId/:slot"  element={<JourneyPuzzle />} />

              {/* ── Character & Social ── */}
              <Route path="/character"   element={<CharacterLab />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              {/* ── Playground ── */}
              <Route path="/playground" element={<Playground />} />

              {/* ── AI Builder ── */}
              <Route path="/builder"           element={<Builder />} />
              <Route path="/project/:publicId" element={<PublicProject />} />
              <Route path="/understood/:token" element={<EvidenceShare />} />
              <Route path="/explore"           element={<Explore />} />

              {/* ── Pricing ── */}
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/creator-brief" element={<CreatorBrief />} />
              <Route path="/investor-brief" element={<InvestorBrief />} />
              <Route path="/first-game-challenge" element={<FirstGameChallenge />} />

              {/* ── Trust & legal ── */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms"   element={<Terms />} />

              {/* ── Profile ── */}
              <Route path="/profile" element={<Profile />} />

              {/* ── Blog ── */}
              <Route path="/blog"       element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* ── Guides ── */}
              <Route path="/guide"       element={<GuideIndex />} />
              <Route path="/guide/:slug" element={<GuidePage />} />

              {/* ── Who we are ── */}
              <Route path="/about" element={<About />} />
              <Route path="/press" element={<Press />} />
              <Route path="/faq"   element={<Faq />} />

              {/* ── SEO landing pages ── */}
              <Route path="/learn-python-for-kids"  element={<LearnPythonForKids />} />
              <Route path="/coding-for-kids"        element={<CodingForKids />} />
              <Route path="/python-games-for-kids"  element={<PythonGamesForKids />} />
              <Route path="/ai-website-builder-for-kids" element={<AIWebsiteBuilderForKids />} />

              {/* ── Admin ── */}
              <Route path="/admin"           element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/users"     element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
              <Route path="/admin/users/:id" element={<RequireAdmin><AdminUserDetail /></RequireAdmin>} />
              <Route path="/admin/stats"     element={<RequireAdmin><AdminStats /></RequireAdmin>} />
              <Route path="/admin/avatars"   element={<RequireAdmin><AdminAvatars /></RequireAdmin>} />
              <Route path="/admin/funnel"    element={<RequireAdmin><AdminFunnel /></RequireAdmin>} />
              <Route path="/admin/evidence"  element={<RequireAdmin><AdminEvidence /></RequireAdmin>} />

              {/* ── 404 ──
                  Used to silently redirect home, which confuses a kid on a
                  mistyped link ("where did my page go?") and reads to search
                  engines as a soft duplicate of the homepage. An honest room
                  with doors, instead. */}
              <Route
                path="*"
                element={(
                  <DeadEnd
                    title="This page wandered off"
                    line="The link you followed doesn't go anywhere — maybe it was typed a little wrong."
                    doors={[
                      { label: 'Go home', to: '/', primary: true },
                      { label: 'Make something', to: '/builder' },
                    ]}
                  />
                )}
              />
            </Routes>
          </Suspense>
        </Router>
      </CharacterProvider>
    </ProgressProvider>
  </AuthProvider>
);

export default App;
