import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import TalkingRobot from './components/TalkingRobot';
import AppleGame from './components/AppleGame';
import MathGame from './components/MathGame';
import ConditionGame from './components/ConditionGame';
import LoopGame from './components/LoopGame';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/puzzle" />} />
            <Route path="/puzzle" element={<AuthGuard><TalkingRobot /></AuthGuard>} />
            <Route path="/apple-game" element={<AuthGuard><AppleGame /></AuthGuard>} />
            <Route path="/math-game" element={<AuthGuard><MathGame /></AuthGuard>} />
            <Route path="/condition-game" element={<AuthGuard><ConditionGame /></AuthGuard>} />
            <Route path="/loop-game" element={<AuthGuard><LoopGame /></AuthGuard>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;