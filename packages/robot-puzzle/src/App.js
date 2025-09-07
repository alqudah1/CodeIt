import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TalkingRobot from './components/TalkingRobot';
import AppleGame from './components/AppleGame';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/puzzle" />} />
          <Route path="/puzzle" element={<TalkingRobot />} />
          <Route path="/apple-game" element={<AppleGame />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
