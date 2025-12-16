import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import TalkingRobot from './components/TalkingRobot';
import AppleGame from './components/AppleGame';
import MathGame from './components/MathGame';
import ConditionGame from './components/ConditionGame';


function App() {
  // Empty onUnlock function (not needed but prevents warnings)
  const handleUnlock = () => {
    console.log('Game unlocked');
  };

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/puzzle" />} />
            <Route path="/puzzle" element={<AuthGuard><TalkingRobot onUnlock={handleUnlock} /></AuthGuard>} />
            <Route path="/apple-game" element={<AuthGuard><AppleGame /></AuthGuard>} />
            <Route path="/math-game" element={<AuthGuard><MathGame /></AuthGuard>} />
            <Route path="/condition-game" element={<AuthGuard><ConditionGame /></AuthGuard>} />
            
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;