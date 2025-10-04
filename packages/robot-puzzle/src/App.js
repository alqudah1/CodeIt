import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TalkingRobot from './components/TalkingRobot';
import AppleGame from './components/AppleGame';
import MathGame from './components/MathGame';
import ConditionGame from './components/ConditionGame';
import LoopGame from './components/LoopGame';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/puzzle" />} />
          <Route path="/puzzle" element={<TalkingRobot />} />
          <Route path="/apple-game" element={<AppleGame />} />
          <Route path="/math-game" element={<MathGame />} />
          <Route path="/condition-game" element={<ConditionGame />} />
          <Route path="/loop-game" element={<LoopGame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;