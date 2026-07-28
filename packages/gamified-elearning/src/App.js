import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Register from './pages/Auth/Register';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';
import { CharacterProvider } from './context/CharacterContext';
import RequireAdmin from './pages/Admin/RequireAdmin';
import AcquisitionTracker from './components/AcquisitionTracker/AcquisitionTracker';

// ── Lazy-loaded routes ────────────────────────────────────────────
const MainPage       = lazy(() => import('./pages/MainPage/MainPage'));
const LessonMap      = lazy(() => import('./pages/Lessons/LessonMap'));

const Lesson1Interactive  = lazy(() => import('./pages/Lessons/Lesson1Interactive'));
const Lesson2Interactive  = lazy(() => import('./pages/Lessons/Lesson2Interactive'));
const Lesson3Interactive  = lazy(() => import('./pages/Lessons/Lesson3Interactive'));
const Lesson4Interactive  = lazy(() => import('./pages/Lessons/Lesson4Interactive'));
const Lesson5Interactive  = lazy(() => import('./pages/Lessons/Lesson5Interactive'));
const Lesson6Interactive  = lazy(() => import('./pages/Lessons/Lesson6Interactive'));
const Lesson7Interactive  = lazy(() => import('./pages/Lessons/Lesson7Interactive'));
const Lesson8Interactive  = lazy(() => import('./pages/Lessons/Lesson8Interactive'));
const Lesson9Interactive  = lazy(() => import('./pages/Lessons/Lesson9Interactive'));
const Lesson10Interactive = lazy(() => import('./pages/Lessons/Lesson10Interactive'));
const Lesson11Interactive = lazy(() => import('./pages/Lessons/Lesson11Interactive'));
const Lesson12Interactive = lazy(() => import('./pages/Lessons/Lesson12Interactive'));
const Lesson13Interactive = lazy(() => import('./pages/Lessons/Lesson13Interactive'));
const Lesson14Interactive = lazy(() => import('./pages/Lessons/Lesson14Interactive'));
const Lesson15Interactive = lazy(() => import('./pages/Lessons/Lesson15Interactive'));
const Lesson16Interactive = lazy(() => import('./pages/Lessons/Lesson16Interactive'));

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

const JourneyMap    = lazy(() => import('./pages/Journey/JourneyMap'));
const JourneyPuzzle = lazy(() => import('./pages/Journey/JourneyPuzzle'));

const CharacterLab  = lazy(() => import('./pages/CharacterLab/CharacterLab'));
const Leaderboard   = lazy(() => import('./pages/Leaderboard'));
const Playground    = lazy(() => import('./pages/Playground/Playground'));
const Builder       = lazy(() => import('./pages/Builder/Builder'));
const PublicProject = lazy(() => import('./pages/Builder/PublicProject'));
const Explore       = lazy(() => import('./pages/Builder/Explore'));
const Profile       = lazy(() => import('./pages/Profile/Profile'));
const Pricing       = lazy(() => import('./pages/Pricing/Pricing'));
const Privacy       = lazy(() => import('./pages/Legal/Privacy'));
const Terms         = lazy(() => import('./pages/Legal/Terms'));
const CreatorBrief  = lazy(() => import('./pages/CreatorBrief/CreatorBrief'));
const InvestorBrief = lazy(() => import('./pages/InvestorBrief/InvestorBrief'));

const BlogIndex         = lazy(() => import('./pages/Blog/BlogIndex'));
const BlogPost          = lazy(() => import('./pages/Blog/BlogPost'));
const LearnPythonForKids = lazy(() => import('./pages/SEO/LearnPythonForKids'));
const CodingForKids     = lazy(() => import('./pages/SEO/CodingForKids'));
const PythonGamesForKids = lazy(() => import('./pages/SEO/PythonGamesForKids'));

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
      border: '4px solid rgba(86,54,211,0.15)',
      borderTopColor: '#5636d3',
      animation: 'page-spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes page-spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── Quiz validation wrapper ───────────────────────────────────────
const VALID_QUIZ_IDS = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16'];
const QuizWrapper = () => {
  const { quizId } = useParams();
  if (!VALID_QUIZ_IDS.includes(quizId)) return <div>Invalid Quiz ID</div>;
  return <Quiz quizId={quizId} />;
};

const App = () => (
  <AuthProvider>
    <ProgressProvider>
      <CharacterProvider>
        <Router>
          <AcquisitionTracker />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public / always-eager ── */}
              <Route path="/"         element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* ── Dashboard ── */}
              <Route path="/MainPage" element={<MainPage />} />

              {/* ── Lessons ── */}
              <Route path="/lessons"    element={<LessonMap />} />
              <Route path="/lesson/1"  element={<Lesson1Interactive />} />
              <Route path="/lesson/2"  element={<Lesson2Interactive />} />
              <Route path="/lesson/3"  element={<Lesson3Interactive />} />
              <Route path="/lesson/4"  element={<Lesson4Interactive />} />
              <Route path="/lesson/5"  element={<Lesson5Interactive />} />
              <Route path="/lesson/6"  element={<Lesson6Interactive />} />
              <Route path="/lesson/7"  element={<Lesson7Interactive />} />
              <Route path="/lesson/8"  element={<Lesson8Interactive />} />
              <Route path="/lesson/9"  element={<Lesson9Interactive />} />
              <Route path="/lesson/10" element={<Lesson10Interactive />} />
              <Route path="/lesson/11" element={<Lesson11Interactive />} />
              <Route path="/lesson/12" element={<Lesson12Interactive />} />
              <Route path="/lesson/13" element={<Lesson13Interactive />} />
              <Route path="/lesson/14" element={<Lesson14Interactive />} />
              <Route path="/lesson/15" element={<Lesson15Interactive />} />
              <Route path="/lesson/16" element={<Lesson16Interactive />} />

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
              <Route path="/journey"                          element={<JourneyMap />} />
              <Route path="/journey/puzzle/:lessonId/:slot"  element={<JourneyPuzzle />} />

              {/* ── Character & Social ── */}
              <Route path="/character"   element={<CharacterLab />} />
              <Route path="/leaderboard" element={<Leaderboard />} />

              {/* ── Playground ── */}
              <Route path="/playground" element={<Playground />} />

              {/* ── AI Builder ── */}
              <Route path="/builder"           element={<Builder />} />
              <Route path="/project/:publicId" element={<PublicProject />} />
              <Route path="/explore"           element={<Explore />} />

              {/* ── Pricing ── */}
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/creator-brief" element={<CreatorBrief />} />
              <Route path="/investor-brief" element={<InvestorBrief />} />

              {/* ── Trust & legal ── */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms"   element={<Terms />} />

              {/* ── Profile ── */}
              <Route path="/profile" element={<Profile />} />

              {/* ── Blog ── */}
              <Route path="/blog"       element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* ── SEO landing pages ── */}
              <Route path="/learn-python-for-kids"  element={<LearnPythonForKids />} />
              <Route path="/coding-for-kids"        element={<CodingForKids />} />
              <Route path="/python-games-for-kids"  element={<PythonGamesForKids />} />

              {/* ── Admin ── */}
              <Route path="/admin"           element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
              <Route path="/admin/users"     element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
              <Route path="/admin/users/:id" element={<RequireAdmin><AdminUserDetail /></RequireAdmin>} />
              <Route path="/admin/stats"     element={<RequireAdmin><AdminStats /></RequireAdmin>} />
              <Route path="/admin/avatars"   element={<RequireAdmin><AdminAvatars /></RequireAdmin>} />
              <Route path="/admin/funnel"    element={<RequireAdmin><AdminFunnel /></RequireAdmin>} />
              <Route path="/admin/evidence"  element={<RequireAdmin><AdminEvidence /></RequireAdmin>} />

              {/* ── 404 ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </CharacterProvider>
    </ProgressProvider>
  </AuthProvider>
);

export default App;
