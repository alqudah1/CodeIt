import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PythonEditor from '../pythoneditor/PythonEditor';
import Header from '../Header/Header';
import ProgressBar from '../ProgressBar/progressBar';
import './PythonLesson.css';
import {
  trackStaticLessonCompletion,
  showXPNotification,
  initializeTimeTracker,
  autoTrackDailyLogin
} from '../../utils/progressTracker';
import { useProgress } from '../../context/ProgressContext';
import { AuthContext } from '../../context/AuthContext';

const Lesson2Interactive = () => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const { user } = useContext(AuthContext) || {};
  const firstName = (user?.name || 'Coder').split(' ')[0];

  const [lessonOutput, setLessonOutput] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const confettiCanvasRef = useRef(null);

  // Visual Variable Boxes
  const [boxes, setBoxes] = useState([
    { id: 'box1', name: 'name', value: null, color: '#ff6b9d' },
    { id: 'box2', name: 'age', value: null, color: '#4cc9f0' },
    { id: 'box3', name: 'favorite', value: null, color: '#ffd93d' }
  ]);
  const [availableValues] = useState([
    { id: 'v1', text: `"${firstName}"`, type: 'string' },
    { id: 'v2', text: '10', type: 'number' },
    { id: 'v3', text: '"pizza"', type: 'string' },
    { id: 'v4', text: '25', type: 'number' },
    { id: 'v5', text: '"coding"', type: 'string' }
  ]);

  // Character Creator
  const [character, setCharacter] = useState({
    hero_name: '',
    age: '',
    superpower: ''
  });
  const [characterOutput, setCharacterOutput] = useState('');

  // Variable Matching Game
  const [matchingPairs] = useState([
    { code: 'x = 5', output: '5' },
    { code: 'name = "Sam"', output: 'Sam' },
    { code: 'score = 100', output: '100' }
  ]);
  const [shuffledOutputs] = useState(() => {
    const outputs = matchingPairs.map(p => ({ ...p }));
    for (let i = outputs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [outputs[i], outputs[j]] = [outputs[j], outputs[i]];
    }
    return outputs;
  });
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);

  // Robot Memory Bank
  const [robotMemory, setRobotMemory] = useState([]);
  const [robotInput, setRobotInput] = useState({ name: '', value: '' });

  // Variable Swap Puzzle
  const [swapBoxes, setSwapBoxes] = useState([
    { id: 'a', name: 'a', value: '5', targetValue: '10' },
    { id: 'b', name: 'b', value: '10', targetValue: '5' }
  ]);
  const [swapSolved, setSwapSolved] = useState(false);

  const [lessonProgress, setLessonProgress] = useState({
    stepsCompleted: 0,
    totalSteps: 5,
    achievements: [],
    hasRunCode: false,
    hasModifiedCode: false,
    hasSeenOutput: false,
    hasCompletedChallenge: false
  });

  const [showAchievement, setShowAchievement] = useState(null);
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    autoTrackDailyLogin();
    loadProgress();
  }, []);

  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const loadProgress = () => {
    const savedProgress = localStorage.getItem('lesson2_interactive_progress');
    if (savedProgress) {
      setLessonProgress(JSON.parse(savedProgress));
    }
    const savedXP = localStorage.getItem('total_xp');
    if (savedXP) {
      setCurrentXP(parseInt(savedXP));
    }
    const savedStreak = localStorage.getItem('learning_streak');
    if (savedStreak) {
      setStreak(parseInt(savedStreak));
    }
  };

  const saveProgress = (newProgress) => {
    setLessonProgress(newProgress);
    localStorage.setItem('lesson2_interactive_progress', JSON.stringify(newProgress));
  };

  const mergeBadges = (progress, newBadges) => {
    if (!newBadges.length) return progress;
    const byId = new Map();
    [...(progress.achievements || []), ...newBadges].forEach(b => byId.set(b.id, b));
    return { ...progress, achievements: Array.from(byId.values()) };
  };

  const triggerConfetti = (durationMs = 1500) => {
    if (calmMode) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e'];
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      r: 3 + Math.random() * 4,
      c: colors[Math.floor(Math.random() * colors.length)],
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 3,
      g: 0.05 + Math.random() * 0.05,
      a: 1
    }));
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.a -= 0.004;
        ctx.globalAlpha = Math.max(p.a, 0);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (elapsed < durationMs) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    requestAnimationFrame(step);
  };

  const playTone = (frequency, durationSec) => {
    if (calmMode) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.value = 0.04;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, durationSec * 1000);
    } catch (e) { /* ignore */ }
  };

  const showAchievementNotification = (achievement) => {
    setShowAchievement(achievement);
    setCurrentXP(prev => prev + achievement.xp);
    localStorage.setItem('total_xp', (currentXP + achievement.xp).toString());
    if (!calmMode) {
      triggerConfetti(800);
      playTone(880, 0.12);
    }
    setTimeout(() => {
      setShowAchievement(null);
    }, 3000);
  };

  const ui = {
    card: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      border: '2px solid #e9ecef',
      borderRadius: 16,
      padding: 18,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      transition: 'transform 150ms, box-shadow 150ms',
      marginBottom: 20
    },
    headerTag: {
      display: 'inline-block',
      padding: '4px 12px',
      background: 'linear-gradient(135deg, #ff6b9d 0%, #ff4d6d 100%)',
      color: '#fff',
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 12,
      boxShadow: '0 4px 10px rgba(255, 107, 157, 0.3)',
      marginRight: 8
    },
    chip: {
      padding: '10px 14px',
      border: '2px solid #ff6b9d',
      borderRadius: 999,
      background: 'linear-gradient(135deg, #fff 0%, #fff0f5 100%)',
      boxShadow: '0 4px 10px rgba(255, 107, 157, 0.15)',
      cursor: 'grab',
      transition: 'transform 100ms',
      fontWeight: 600
    },
    slot: {
      minWidth: 72,
      minHeight: 48,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px dashed #ffc1d9',
      borderRadius: 12,
      background: 'rgba(255, 107, 157, 0.05)',
      transition: 'border-color 150ms, background 150ms'
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #ff6b9d 0%, #ff4d6d 100%)',
      color: '#fff',
      border: 'none',
      padding: '12px 20px',
      borderRadius: 12,
      cursor: 'pointer',
      boxShadow: '0 6px 16px rgba(255, 107, 157, 0.4)',
      fontWeight: 700,
      fontSize: 15,
      transition: 'transform 100ms, box-shadow 100ms'
    },
    btnSecondary: {
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      color: '#495057',
      border: '2px solid #e9ecef',
      padding: '10px 18px',
      borderRadius: 12,
      cursor: 'pointer',
      fontWeight: 600,
      transition: 'transform 100ms'
    }
  };

  const VariableBox = ({ box }) => (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        const val = e.dataTransfer.getData('text/plain');
        const newBoxes = boxes.map(b =>
          b.id === box.id ? { ...b, value: val } : b
        );
        setBoxes(newBoxes);
        if (!calmMode) { playTone(660, 0.08); triggerConfetti(600); }
      }}
      style={{
        width: 140,
        height: 140,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${box.color}20 0%, ${box.color}40 100%)`,
        border: `3px solid ${box.color}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: `0 6px 18px ${box.color}40`,
        transition: 'transform 200ms'
      }}
    >
      <div style={{ fontWeight: 700, color: box.color, fontSize: 16 }}>{box.name}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#495057' }}>
        {box.value || '[ ]'}
      </div>
    </div>
  );

  const RobotMemorySlot = ({ item }) => (
    <div style={{
      padding: '12px 14px',
      borderRadius: 12,
      background: 'linear-gradient(135deg, #e6e9ff 0%, #f0f4ff 100%)',
      border: '2px solid #667eea',
      marginBottom: 8,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ fontWeight: 700, color: '#667eea' }}>{item.name}</span>
      <span style={{ fontWeight: 600 }}>=</span>
      <span style={{ background: '#fff', padding: '4px 8px', borderRadius: 8, fontFamily: 'monospace' }}>{item.value}</span>
    </div>
  );

  const handleCodeOutput = (output) => {
    setLessonOutput(output);
    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
      stepsCompleted: Math.max(lessonProgress.stepsCompleted, 2)
    };
    const isModified = output !== 'Alex\n10' && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
      newProgress.stepsCompleted = Math.max(lessonProgress.stepsCompleted, 3);
    }
    if (output.length > 0 && output !== 'Alex\n10') {
      newProgress.hasCompletedChallenge = true;
      newProgress.stepsCompleted = Math.max(lessonProgress.stepsCompleted, 4);
    }

    const earned = [];
    if (output.toLowerCase().includes(firstName.toLowerCase())) {
      earned.push({ id: 'personalized_vars', title: '📛 Personal Touch', description: 'Used your name in a variable!', xp: 10 });
    }

    let merged = mergeBadges(newProgress, earned);
    saveProgress(merged);
    earned.forEach(achievement => {
      showAchievementNotification(achievement);
    });

    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      markLessonComplete(2);
      setHasMarkedComplete(true);
    }
  };

  const isLessonEligibleForCompletion = () => {
    return (
      lessonProgress.stepsCompleted >= 1 ||
      lessonProgress.hasRunCode ||
      lessonProgress.hasModifiedCode ||
      lessonProgress.hasSeenOutput ||
      lessonProgress.hasCompletedChallenge
    );
  };

  const goToDashboard = () => navigate('/MainPage');

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) {
      alert('🎯 Almost there! Complete any one activity to unlock the quiz!');
      return;
    }
    if (!isCompleted) {
      try {
        const timeSpent = timeTracker.getTimeSpent();
        const result = await trackStaticLessonCompletion(2, timeSpent);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(2);
        setIsCompleted(true);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
      }
    }
    navigate('/quiz/2');
  };

  return (
    <div className="python-lesson" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(255, 245, 165, 0.95) 0%, rgba(255, 214, 165, 0.95) 30%, rgba(255, 171, 171, 0.95) 60%, rgba(155, 246, 255, 0.95) 100%)' }}>
      <canvas ref={confettiCanvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />
      
      {/* Fixed Header with Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <Header />
        <ProgressBar currentStep="lesson" />
      </div>

      {showAchievement && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <h3>{showAchievement.title}</h3>
            <p>{showAchievement.description}</p>
            <span className="achievement-xp">+{showAchievement.xp} XP</span>
          </div>
        </div>
      )}

      {/* Scrollable Content */}
      <div style={{ 
        marginTop: '170px', 
        overflowY: 'auto', 
        flex: 1, 
        padding: '2rem 1.5rem 5rem',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }} className="hide-scrollbar">
        <div className="lesson-wrapper" style={{ margin: '0 auto' }}>

        <div className="progress-header" style={{ marginTop: '20px' }}>
          <div className="xp-display">
            <span className="xp-icon">⭐</span>
            <span className="xp-text">{currentXP} XP</span>
          </div>
          <div className="streak-display">
            <span className="streak-icon">🔥</span>
            <span className="streak-text">{streak} day streak</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={calmMode} onChange={e => setCalmMode(e.target.checked)} /> Calm mode
            </label>
          </div>
        </div>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 2 • Interactive</span>
            <h1>Hey {firstName}! Storing Information with Variables</h1>
            <p className="lesson-subtitle">
              Discover magical Python boxes that remember names, numbers, and secrets!
            </p>
          </header>

          <div className="lesson-content">
            {/* Step 1: Introduction */}
            <div className="lesson-step">
              <div className="step-header">
                <span className="step-number">1</span>
                <h2>What is a Variable?</h2>
              </div>
              <p>
                A <strong>variable</strong> is like a labeled box that stores information. You can use it to remember names, numbers, or messages!
              </p>
              <div className="code-example">
                <pre>{`name = "Alex"`}</pre>
                <pre>{`age = 10`}</pre>
                <pre>{`print(name)  # Shows: Alex`}</pre>
                <pre>{`print(age)   # Shows: 10`}</pre>
              </div>
            </div>

            {/* Visual Variable Boxes */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">2</span>
                <h2><span style={ui.headerTag}>Boxes</span> Visual Variable Storage</h2>
              </div>
              <p style={{ marginBottom: 14 }}>Drag values into the boxes to store them! Each box is a variable.</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {availableValues.map(v => (
                  <div key={v.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain', v.text)} style={{ ...ui.chip, background: '#fff' }}>{v.text}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                {boxes.map(box => <VariableBox key={box.id} box={box} />)}
              </div>
              {boxes.every(b => b.value) && (
                <div style={{ marginTop: 14, padding: '12px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 12, color: '#1e6f3e', textAlign: 'center' }}>
                  ✅ Great! All boxes filled. In Python: <code>name = {boxes[0].value}</code>, <code>age = {boxes[1].value}</code>, <code>favorite = {boxes[2].value}</code>
                </div>
              )}
            </div>

            {/* Character Creator */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">3</span>
                <h2><span style={ui.headerTag}>Creator</span> Build Your Hero</h2>
              </div>
              <p style={{ marginBottom: 12 }}>Create a superhero by filling in variables!</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Form Section */}
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>hero_name:</label>
                    <input type="text" value={character.hero_name} onChange={e => setCharacter({ ...character, hero_name: e.target.value })} placeholder="e.g. Thunder Kid" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px solid #e9ecef' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>age:</label>
                    <input type="number" value={character.age} onChange={e => setCharacter({ ...character, age: e.target.value })} placeholder="e.g. 12" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px solid #e9ecef' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>superpower:</label>
                    <input type="text" value={character.superpower} onChange={e => setCharacter({ ...character, superpower: e.target.value })} placeholder="e.g. Flying" style={{ width: '100%', padding: '10px', borderRadius: 10, border: '2px solid #e9ecef' }} />
                  </div>
                  <button type="button" style={ui.btnPrimary} onClick={() => {
                    if (character.hero_name && character.age && character.superpower) {
                      setCharacterOutput(`Hero: ${character.hero_name}, Age: ${character.age}, Power: ${character.superpower}`);
                      if (!calmMode) { triggerConfetti(900); playTone(880, 0.1); }
                    }
                  }}>🦸 Create Hero</button>
                </div>
                {/* Visual Hero Display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', borderRadius: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: 280 }}>
                  {/* Hero Avatar */}
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ transition: 'transform 300ms', transform: characterOutput ? 'scale(1.1)' : 'scale(1)' }}>
                    {/* Cape */}
                    <path d="M 35 45 Q 20 60 25 85 L 35 70 Z" fill={characterOutput ? '#ff6b9d' : '#999'} opacity="0.8" />
                    <path d="M 85 45 Q 100 60 95 85 L 85 70 Z" fill={characterOutput ? '#ff6b9d' : '#999'} opacity="0.8" />
                    {/* Body */}
                    <ellipse cx="60" cy="70" rx="25" ry="35" fill={characterOutput ? '#ffd93d' : '#ccc'} />
                    {/* Head */}
                    <circle cx="60" cy="40" r="20" fill={characterOutput ? '#ffb86c' : '#ddd'} />
                    {/* Mask */}
                    <ellipse cx="50" cy="38" rx="8" ry="6" fill={characterOutput ? '#667eea' : '#aaa'} />
                    <ellipse cx="70" cy="38" rx="8" ry="6" fill={characterOutput ? '#667eea' : '#aaa'} />
                    <rect x="45" y="35" width="30" height="6" fill={characterOutput ? '#667eea' : '#aaa'} />
                    {/* Eyes */}
                    <circle cx="50" cy="38" r="3" fill="#fff" />
                    <circle cx="70" cy="38" r="3" fill="#fff" />
                    {/* Arms */}
                    <rect x="30" y="60" width="10" height="25" rx="5" fill={characterOutput ? '#ffb86c' : '#ddd'} style={{ transform: characterOutput ? 'rotate(-20deg)' : 'rotate(0deg)', transformOrigin: '35px 60px', transition: 'transform 300ms' }} />
                    <rect x="80" y="60" width="10" height="25" rx="5" fill={characterOutput ? '#ffb86c' : '#ddd'} style={{ transform: characterOutput ? 'rotate(20deg)' : 'rotate(0deg)', transformOrigin: '85px 60px', transition: 'transform 300ms' }} />
                    {/* Power Symbol */}
                    {characterOutput && (
                      <g>
                        <circle cx="60" cy="70" r="8" fill="#fff" opacity="0.3" />
                        <text x="60" y="75" fontSize="12" textAnchor="middle" fill="#fff">⚡</text>
                      </g>
                    )}
                  </svg>
                  {/* Hero Info Display */}
                  <div style={{ marginTop: 16, textAlign: 'center', color: '#fff' }}>
                    {character.hero_name && (
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                        {character.hero_name}
                      </div>
                    )}
                    {character.age && (
                      <div style={{ fontSize: 14, opacity: 0.9 }}>
                        Age: {character.age}
                      </div>
                    )}
                    {character.superpower && (
                      <div style={{ fontSize: 14, marginTop: 4, padding: '4px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'inline-block' }}>
                        ⚡ {character.superpower}
                      </div>
                    )}
                    {!character.hero_name && !character.age && !character.superpower && (
                      <div style={{ fontSize: 14, opacity: 0.7 }}>
                        Fill in the form to create your hero!
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {characterOutput && (
                <div style={{ marginTop: 12, padding: '12px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 12, color: '#1e6f3e' }}>
                  <strong>Python Code:</strong>
                  <pre style={{ margin: '6px 0 0 0', fontFamily: 'monospace', fontSize: 13 }}>
{`hero_name = "${character.hero_name}"
age = ${character.age}
superpower = "${character.superpower}"`}
                  </pre>
                </div>
              )}
            </div>

            {/* Variable Matching Game */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">4</span>
                <h2><span style={ui.headerTag}>Match</span> Variable Matching Game</h2>
              </div>
              <p style={{ marginBottom: 12 }}>Click a code snippet, then click the matching output!</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: 8 }}>Code:</strong>
                  {matchingPairs.map((pair, i) => (
                    <div key={i} onClick={() => setSelectedCode(pair.code)} style={{ padding: '10px', marginBottom: 8, borderRadius: 10, border: selectedCode === pair.code ? '3px solid #ff6b9d' : '2px solid #e9ecef', background: '#fff', cursor: 'pointer' }}>
                      <code>{pair.code}</code>
                    </div>
                  ))}
                </div>
                <div>
                  <strong style={{ display: 'block', marginBottom: 8 }}>Output:</strong>
                  {shuffledOutputs.map((pair, i) => (
                    <div key={i} onClick={() => {
                      if (selectedCode) {
                        const selected = matchingPairs.find(p => p.code === selectedCode);
                        if (selected && selected.output === pair.output) {
                          setMatchedPairs([...matchedPairs, pair.code]);
                          setSelectedCode(null);
                          if (!calmMode) { triggerConfetti(700); playTone(880, 0.08); }
                        }
                      }
                    }} style={{ padding: '10px', marginBottom: 8, borderRadius: 10, border: matchedPairs.includes(pair.code) ? '3px solid #6bcf7f' : '2px solid #e9ecef', background: matchedPairs.includes(pair.code) ? '#d4fc79' : '#fff', cursor: 'pointer' }}>
                      {pair.output}
                    </div>
                  ))}
                </div>
              </div>
              {matchedPairs.length === matchingPairs.length && (
                <div style={{ marginTop: 12, padding: '12px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 12, color: '#1e6f3e', textAlign: 'center' }}>
                  🎉 All matched! You're a variable master!
                </div>
              )}
            </div>

            {/* Robot Memory Bank */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">5</span>
                <h2><span style={ui.headerTag}>Robot</span> Memory Bank</h2>
              </div>
              <p style={{ marginBottom: 12 }}>Store data in the robot's memory! Each entry is a variable.</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input type="text" value={robotInput.name} onChange={e => setRobotInput({ ...robotInput, name: e.target.value })} placeholder="Variable name" style={{ flex: 1, padding: '10px', borderRadius: 10, border: '2px solid #e9ecef' }} />
                <input type="text" value={robotInput.value} onChange={e => setRobotInput({ ...robotInput, value: e.target.value })} placeholder="Value" style={{ flex: 1, padding: '10px', borderRadius: 10, border: '2px solid #e9ecef' }} />
                <button type="button" style={ui.btnPrimary} onClick={() => {
                  if (robotInput.name && robotInput.value) {
                    setRobotMemory([...robotMemory, { ...robotInput, id: Date.now() }]);
                    setRobotInput({ name: '', value: '' });
                    if (!calmMode) playTone(660, 0.08);
                  }
                }}>+ Store</button>
              </div>
              <div>
                {robotMemory.map(item => <RobotMemorySlot key={item.id} item={item} />)}
              </div>
              {robotMemory.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px', background: '#e6e9ff', borderRadius: 10, color: '#495057' }}>
                  <strong>In Python:</strong>
                  <pre style={{ margin: '8px 0 0 0', fontFamily: 'monospace', fontSize: 13 }}>
                    {robotMemory.map(m => `${m.name} = ${m.value}`).join('\n')}
                  </pre>
                </div>
              )}
            </div>

            {/* Variable Swap Puzzle */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">6</span>
                <h2><span style={ui.headerTag}>Swap</span> Variable Swap Challenge</h2>
              </div>
              <p style={{ marginBottom: 12 }}>Swap the values to match the target! In Python, you'd use a temp variable.</p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 12 }}>
                {swapBoxes.map(box => (
                  <div key={box.id} style={{
                    width: 120,
                    padding: '14px',
                    borderRadius: 12,
                    border: box.value === box.targetValue ? '3px solid #6bcf7f' : '2px solid #e9ecef',
                    background: box.value === box.targetValue ? '#d4fc79' : '#fff',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{box.name}</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{box.value}</div>
                    <div style={{ fontSize: 12, color: '#6c757d', marginTop: 4 }}>Target: {box.targetValue}</div>
                  </div>
                ))}
              </div>
              <button type="button" style={ui.btnPrimary} onClick={() => {
                const newBoxes = swapBoxes.map(box => ({
                  ...box,
                  value: box.id === 'a' ? swapBoxes.find(b => b.id === 'b').value : swapBoxes.find(b => b.id === 'a').value
                }));
                setSwapBoxes(newBoxes);
                if (newBoxes.every(b => b.value === b.targetValue)) {
                  setSwapSolved(true);
                  if (!calmMode) { triggerConfetti(1000); playTone(990, 0.12); }
                }
              }}>🔄 Swap Values</button>
              {swapSolved && (
                <div style={{ marginTop: 12, padding: '12px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 12, color: '#1e6f3e' }}>
                  ✅ Solved! In Python: <code>temp = a; a = b; b = temp</code>
                </div>
              )}
            </div>

            {/* Interactive Challenge */}
            <div className="lesson-step">
              <div className="step-header">
                <span className="step-number">7</span>
                <h2>Your Challenge</h2>
              </div>
              <div className="try-it">
                <h3>🎯 Challenge Time!</h3>
                <p>Change "Alex" to your own name and run the code!</p>
              </div>
              <PythonEditor initialCode={`name = "Alex"\nage = 10\nprint(name)\nprint(age)`} onOutput={handleCodeOutput} />
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="progress-indicator" style={{
            background: '#f8f9fa',
            border: '2px solid #e9ecef',
            borderRadius: '10px',
            padding: '20px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📊 Your Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{
                padding: '8px 12px',
                borderRadius: '20px',
                backgroundColor: lessonProgress.hasRunCode ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasRunCode ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.hasRunCode ? '✅' : '⭕'} Run Code
              </div>
              <div style={{
                padding: '8px 12px',
                borderRadius: '20px',
                backgroundColor: lessonProgress.hasModifiedCode ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasModifiedCode ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.hasModifiedCode ? '✅' : '⭕'} Modify Code
              </div>
            </div>
            {lessonProgress.achievements && lessonProgress.achievements.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <h4 style={{ margin: '0 0 8px 0' }}>🏅 Badges</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {lessonProgress.achievements.map(b => (
                    <div key={b.id} style={{ padding: '8px 10px', borderRadius: 12, background: '#fff', border: '1px solid #e9ecef', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>{b.title}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {isLessonEligibleForCompletion() && !isCompleted && (
            <div className="completion-status" style={{
              background: 'linear-gradient(135deg, #4ecca3, #2e9c81)',
              color: 'white',
              padding: '15px',
              borderRadius: '10px',
              margin: '20px 0',
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(78, 204, 163, 0.3)'
            }}>
              <h3>🎉 Great Progress!</h3>
              <p>You've completed enough activities to proceed to the quiz!</p>
            </div>
          )}

          <footer className="lesson-footer">
            <button
              type="button"
              className="quiz-button"
              onClick={goToQuiz}
              style={{
                backgroundColor: isCompleted ? '#2e9c81' :
                               isLessonEligibleForCompletion() ? '#4ecca3' : '#cccccc',
                opacity: isCompleted ? 0.8 : 1,
                cursor: isLessonEligibleForCompletion() ? 'pointer' : 'not-allowed'
              }}
            >
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 2 🍓' :
               isLessonEligibleForCompletion() ? 'Ready for Quiz 2 🍓' :
               'Complete at least one activity to unlock quiz'}
            </button>
          </footer>
        </section>
        </div>
      </div>
    </div>
  );
};

export default Lesson2Interactive;

