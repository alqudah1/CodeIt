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

const Lesson1Interactive = () => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const { user } = useContext(AuthContext) || {};
  const firstName = (user?.name || 'Coder').split(' ')[0];

  const [lessonOutput, setLessonOutput] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [theme, setTheme] = useState('default'); // default | cats | rockets | emojis
  const [runAttempts, setRunAttempts] = useState(0);
  const [hintMessage, setHintMessage] = useState('');
  const [showXPGlow, setShowXPGlow] = useState(false);
  const [sidekickMood, setSidekickMood] = useState('idle'); // idle | happy | think | celebrate
  const confettiCanvasRef = useRef(null);
  // DnD Builder
  const [dndLevel, setDndLevel] = useState(1);
  const [dndSlots, setDndSlots] = useState([null, null, null, null]);
  const [dndTiles, setDndTiles] = useState([]);
  const [dndSolvedNoHints, setDndSolvedNoHints] = useState(0);
  const [dndHint, setDndHint] = useState('');
  // Sandbox Board
  const [sandboxTiles] = useState([
    { id: 't1', text: 'Hello' },
    { id: 't2', text: firstName },
    { id: 't3', text: '😀' },
    { id: 't4', text: 'Python' },
  ]);
  const [sandboxLines, setSandboxLines] = useState([[], []]);
  const [sandboxOutput, setSandboxOutput] = useState([]);
  // Sequence / Missing Piece
  const [seqLines, setSeqLines] = useState([
    'print("I love coding!")',
    `print("Hello, ${firstName}!")`,
    'print("Python is fun!")'
  ].sort(() => Math.random() - 0.5));
  const seqTarget = [
    `print("Hello, ${firstName}!")`,
    'print("Python is fun!")',
    'print("I love coding!")'
  ];
  const [missingSlot, setMissingSlot] = useState(null);
  const missingOptions = ['print', 'say', 'echo'];
  // Spot the Bug
  const [bugFixed, setBugFixed] = useState(false);
  // Visual Block
  const [blockInput, setBlockInput] = useState('Hello!');
  const [blockBubble, setBlockBubble] = useState('');
  // Stories & Factory
  const [storyIdx, setStoryIdx] = useState(0);
  const storyPanels = [
    'A robot wants to say hello... but how?',
    'We teach it a magic word: print!',
    'Type print("Hello") and boom — a speech bubble appears!',
    `Try with your name: print("Hello, ${firstName}!")`
  ];
  const [factoryRunning, setFactoryRunning] = useState(false);
  const [factoryItems, setFactoryItems] = useState([]);
  // Story code input
  const [storyCode, setStoryCode] = useState('');
  const [storyOutput, setStoryOutput] = useState('');
  const [storyHint, setStoryHint] = useState('');
  const [robotMood, setRobotMood] = useState('idle'); // idle | listening | happy | confused
  // Explainer CTA → Prefill editor
  const [editorSeed, setEditorSeed] = useState('');
  const [editorKey, setEditorKey] = useState(0);

  // Enhanced progress tracking states (separate localStorage key to avoid clashing with Lesson1)
  const [lessonProgress, setLessonProgress] = useState({
    stepsCompleted: 0,
    totalSteps: 5,
    achievements: [],
    currentStep: 0,
    hasRunCode: false,
    hasModifiedCode: false,
    hasSeenOutput: false,
    hasCompletedChallenge: false
  });

  const [showAchievement, setShowAchievement] = useState(null);
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mysteryReward, setMysteryReward] = useState('');

  // Auto-track daily login and initialize time tracking
  useEffect(() => {
    autoTrackDailyLogin();
    loadProgress();
  }, []);

  // Initialize DnD tiles per level
  useEffect(() => {
    if (dndLevel === 1) {
      setDndTiles([
        { id: 'p', text: 'print' },
        { id: 'lp', text: '(' },
        { id: 'str', text: `"Hello"` },
        { id: 'rp', text: ')' },
        { id: 'wrong1', text: 'say' }
      ]);
      setDndSlots([null, null, null, null]);
    } else if (dndLevel === 2) {
      setDndTiles([
        { id: 'p', text: 'print' },
        { id: 'lp', text: '(' },
        { id: 'str', text: `"Hello, ${firstName}! 😀"` },
        { id: 'rp', text: ')' },
        { id: 'wrong2', text: 'echo' }
      ]);
      setDndSlots([null, null, null, null]);
    } else {
      // Level 3: two prints in order
      setDndTiles([
        { id: 'p1', text: 'print' }, { id: 'lp1', text: '(' }, { id: 's1', text: `"First"` }, { id: 'rp1', text: ')' },
        { id: 'p2', text: 'print' }, { id: 'lp2', text: '(' }, { id: 's2', text: `"Second"` }, { id: 'rp2', text: ')' },
        { id: 'wrong3', text: 'say' }
      ]);
      setDndSlots([null, null, null, null, null, null, null, null]);
    }
    setDndHint('');
  }, [dndLevel, firstName]);

  // Resize confetti canvas to viewport
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

  // Load saved progress from localStorage
  const loadProgress = () => {
    const savedProgress = localStorage.getItem('lesson1_interactive_progress');
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

  // Save progress to localStorage
  const saveProgress = (newProgress) => {
    setLessonProgress(newProgress);
    localStorage.setItem('lesson1_interactive_progress', JSON.stringify(newProgress));
  };

  // Check for achievements
  const checkAchievements = (newProgress) => {
    const achievements = [];

    if (newProgress.hasRunCode && !lessonProgress.hasRunCode) {
      achievements.push({
        id: 'first_code_run',
        title: '🚀 First Code Run!',
        description: `You ran your first Python code, ${firstName}!`,
        xp: 10
      });
    }

    if (newProgress.hasModifiedCode && !lessonProgress.hasModifiedCode) {
      achievements.push({
        id: 'code_explorer',
        title: '🔍 Code Explorer',
        description: 'You modified the code and experimented!',
        xp: 15
      });
    }

    if (newProgress.hasSeenOutput && !lessonProgress.hasSeenOutput) {
      achievements.push({
        id: 'output_master',
        title: '📺 Output Master',
        description: 'You saw your code output!',
        xp: 10
      });
    }

    if (newProgress.stepsCompleted >= 3 && lessonProgress.stepsCompleted < 3) {
      achievements.push({
        id: 'halfway_hero',
        title: '⭐ Halfway Hero',
        description: 'You completed half the lesson!',
        xp: 20
      });
    }

    if (newProgress.stepsCompleted === newProgress.totalSteps && lessonProgress.stepsCompleted < newProgress.totalSteps) {
      achievements.push({
        id: 'lesson_champion',
        title: '🏆 Lesson Champion',
        description: 'You completed the entire lesson!',
        xp: 50
      });
    }

    return achievements;
  };

  // Show achievement notification
  const showAchievementNotification = (achievement) => {
    setShowAchievement(achievement);
    setCurrentXP(prev => prev + achievement.xp);
    localStorage.setItem('total_xp', (currentXP + achievement.xp).toString());
    if (!calmMode) {
      triggerConfetti(800);
      playTone(880, 0.12);
      setShowXPGlow(true);
      setTimeout(() => setShowXPGlow(false), 800);
    }

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowAchievement(null);
    }, 3000);
  };

  // Helper: merge new badges into progress
  const mergeBadges = (progress, newBadges) => {
    if (!newBadges.length) return progress;
    const byId = new Map();
    [...(progress.achievements || []), ...newBadges].forEach(b => byId.set(b.id, b));
    return { ...progress, achievements: Array.from(byId.values()) };
  };

  // Confetti animation (lightweight, no deps)
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

  // Simple tones via Web Audio API
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

  // Read aloud helper
  const speak = (text) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = calmMode ? 0.95 : 1.05;
      utter.pitch = 1.1;
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    } catch (e) { /* ignore */ }
  };

  // Theme-aware starter code
  const getInitialCode = () => {
    const base = `Hello, ${firstName}!`;
    if (theme === 'cats') return `print("${base} 🐱")`;
    if (theme === 'rockets') return `print("${base} 🚀")`;
    if (theme === 'emojis') return `print("${base} 😀✨")`;
    return `print("${base}")`;
  };

  // UI style helpers
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
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      borderRadius: 999,
      fontWeight: 700,
      fontSize: 12,
      boxShadow: '0 4px 10px rgba(102, 126, 234, 0.3)',
      marginRight: 8
    },
    chip: {
      padding: '10px 14px',
      border: '2px solid #667eea',
      borderRadius: 999,
      background: 'linear-gradient(135deg, #fff 0%, #f0f4ff 100%)',
      boxShadow: '0 4px 10px rgba(102, 126, 234, 0.15)',
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
      border: '3px dashed #b8c1ec',
      borderRadius: 12,
      background: 'rgba(102, 126, 234, 0.05)',
      transition: 'border-color 150ms, background 150ms'
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      border: 'none',
      padding: '12px 20px',
      borderRadius: 12,
      cursor: 'pointer',
      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
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

  // Animated Robot SVG
  const RobotCharacter = ({ mood }) => {
    const colors = {
      idle: '#667eea',
      listening: '#ffd93d',
      happy: '#6bcf7f',
      confused: '#ff6b9d'
    };
    const bodyColor = colors[mood] || colors.idle;
    return (
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transition: 'all 300ms' }}>
        {/* Antenna */}
        <line x1="60" y1="15" x2="60" y2="30" stroke={bodyColor} strokeWidth="3" />
        <circle cx="60" cy="12" r="5" fill={bodyColor} />
        {/* Head */}
        <rect x="35" y="30" width="50" height="40" rx="8" fill={bodyColor} />
        {/* Eyes */}
        <circle cx="48" cy="45" r={mood === 'listening' ? 5 : 4} fill="#fff" />
        <circle cx="72" cy="45" r={mood === 'listening' ? 5 : 4} fill="#fff" />
        {/* Mouth */}
        {mood === 'happy' && <path d="M 45 58 Q 60 65 75 58" stroke="#fff" strokeWidth="3" fill="none" />}
        {mood === 'confused' && <path d="M 45 60 Q 55 58 65 60 Q 70 58 75 60" stroke="#fff" strokeWidth="2" fill="none" />}
        {(mood === 'idle' || mood === 'listening') && <line x1="45" y1="58" x2="75" y2="58" stroke="#fff" strokeWidth="3" />}
        {/* Body */}
        <rect x="40" y="75" width="40" height="30" rx="5" fill={bodyColor} opacity="0.8" />
        {/* Arms */}
        <rect x="20" y="80" width="15" height="8" rx="4" fill={bodyColor} style={{ transform: mood === 'happy' ? 'rotate(-20deg)' : 'rotate(0deg)', transformOrigin: '35px 84px', transition: 'transform 300ms' }} />
        <rect x="85" y="80" width="15" height="8" rx="4" fill={bodyColor} style={{ transform: mood === 'happy' ? 'rotate(20deg)' : 'rotate(0deg)', transformOrigin: '85px 84px', transition: 'transform 300ms' }} />
        {/* Speech bubble */}
        {mood === 'happy' && (
          <g>
            <rect x="90" y="25" width="28" height="18" rx="4" fill="#fff" stroke={bodyColor} strokeWidth="2" />
            <text x="104" y="38" fontSize="16" textAnchor="middle">✨</text>
          </g>
        )}
      </svg>
    );
  };

  // Update progress when code is run
  const handleCodeOutput = (output) => {
    setLessonOutput(output);
    setRunAttempts(prev => prev + 1);

    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasSeenOutput: output.length > 0,
      stepsCompleted: Math.max(lessonProgress.stepsCompleted, 2)
    };

    // Check if code was modified (not just the default)
    const defaultOutput = getInitialCode().replace('print("', '').replace('")', '');
    const isModified = output !== defaultOutput && output.length > 0;
    if (isModified) {
      newProgress.hasModifiedCode = true;
      newProgress.stepsCompleted = Math.max(lessonProgress.stepsCompleted, 3);
    }

    // Check if challenge is completed
    if (output.length > 0 && output !== defaultOutput) {
      newProgress.hasCompletedChallenge = true;
      newProgress.stepsCompleted = Math.max(lessonProgress.stepsCompleted, 4);
    }

    // Adaptive hints
    if (!isModified && (runAttempts + 1) >= 2) {
      setHintMessage('Hint: Try changing the message inside the quotes, like "Hello, world!" → "Hello, ' + firstName + '! I love cats!"');
      setSidekickMood('think');
    } else if (isModified) {
      setHintMessage('');
      setSidekickMood('happy');
    }

    // Micro-interactions
    if (!calmMode) {
      playTone(isModified ? 880 : 660, 0.12);
      triggerConfetti(isModified ? 1200 : 600);
    }

    // Merge new achievements into saved progress
    let merged = { ...newProgress };

    // Custom achievements: Name Tag, Emoji Wizard
    const earned = [];
    if (output.toLowerCase().includes(firstName.toLowerCase())) {
      earned.push({ id: 'name_tag', title: '📛 Name Tag', description: 'You printed your name!', xp: 10 });
    }
    const emojiMatches = output.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
    if (emojiMatches && emojiMatches.length >= 2) {
      earned.push({ id: 'emoji_wizard', title: '🪄 Emoji Wizard', description: 'Printed with emojis!', xp: 10 });
    }

    // Check if lesson is now eligible for completion
    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      console.log('Lesson 1 (Interactive) is now eligible for completion!');
      // Mark lesson as complete in the progress context (still lesson 1 for testing)
      markLessonComplete(1);
      setHasMarkedComplete(true);
    }

    // Check for new achievements
    const achievements = [...checkAchievements(newProgress), ...earned];
    merged = mergeBadges(merged, achievements);
    saveProgress(merged);
    achievements.forEach(achievement => {
      showAchievementNotification(achievement);
    });
  };

  // Mark step as completed
  const completeStep = (stepNumber) => {
    const newProgress = {
      ...lessonProgress,
      stepsCompleted: Math.max(lessonProgress.stepsCompleted, stepNumber),
      currentStep: Math.max(lessonProgress.currentStep, stepNumber)
    };

    // Merge potential new badges if crossing thresholds
    const achievements = checkAchievements(newProgress);
    const merged = mergeBadges(newProgress, achievements);
    saveProgress(merged);

    // Check if lesson is now eligible for completion
    if (isLessonEligibleForCompletion() && !isCompleted && !hasMarkedComplete) {
      console.log('Lesson 1 (Interactive) is now eligible for completion!');
      // Mark lesson as complete in the progress context
      markLessonComplete(1);
      setHasMarkedComplete(true);
    }

    // Check for achievements
    achievements.forEach(achievement => {
      showAchievementNotification(achievement);
    });
  };

  // Check if lesson can be considered complete (any one criteria is enough)
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
    // Check if lesson is eligible for completion (any one criteria is enough)
    if (!isLessonEligibleForCompletion()) {
      alert('🎯 Almost there! Complete any one of these activities to unlock the quiz:\n\n• Click on any step to mark it complete\n• Run some code in the editor\n• Modify the code and see the output\n• Complete the challenge\n\nYou only need to do ONE of these to proceed!');
      return;
    }

    if (!isCompleted) {
      try {
        const timeSpent = timeTracker.getTimeSpent();
        const result = await trackStaticLessonCompletion(1, timeSpent);

        // Show XP notification
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);

        // Update ProgressContext to mark lesson as complete
        markLessonComplete(1);

        setIsCompleted(true);
        console.log('Lesson 1 (Interactive) completed:', result);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
        // Continue to quiz even if tracking fails
      }
    }
    navigate('/quiz/1');
  };

  return (
    <div className="python-lesson" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(255, 245, 165, 0.95) 0%, rgba(255, 214, 165, 0.95) 30%, rgba(255, 171, 171, 0.95) 60%, rgba(155, 246, 255, 0.95) 100%)' }}>
      <canvas ref={confettiCanvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }} />
      
      {/* Fixed Header with Progress Bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <Header />
        <ProgressBar currentStep="lesson" />
      </div>

      {/* Achievement Notification */}
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

        {/* Personalized Hero Header */}
        <div className="progress-header" style={{ marginTop: '20px' }}>
          <div className="xp-display">
            <span className="xp-icon">⭐</span>
            <span className="xp-text" style={{ transition: 'text-shadow 300ms, transform 300ms', textShadow: showXPGlow ? '0 0 12px #ffd166' : 'none', transform: showXPGlow ? 'scale(1.08)' : 'scale(1)' }}>{currentXP} XP</span>
          </div>
          <div className="streak-display">
            <span className="streak-icon">🔥</span>
            <span className="streak-text">{streak} day streak</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={calmMode} onChange={e => setCalmMode(e.target.checked)} /> Calm mode
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Theme:
              <select value={theme} onChange={e => setTheme(e.target.value)}>
                <option value="default">Classic</option>
                <option value="cats">Cats 😺</option>
                <option value="rockets">Rockets 🚀</option>
                <option value="emojis">Emojis 😀</option>
              </select>
            </label>
          </div>
        </div>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 1 • Interactive</span>
            <h1>Hey {firstName}! What is Python? (Printing & Basics)</h1>
            <p className="lesson-subtitle">
              Your mission: make the computer talk! Let's start with friendly messages.
            </p>
          </header>

          {/* Animated Sidekick */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#4ecca3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 6px 18px rgba(78,204,163,0.35)', transform: sidekickMood === 'celebrate' ? 'rotate(-6deg)' : sidekickMood === 'happy' ? 'scale(1.05)' : 'scale(1)', transition: 'transform 300ms' }}>
              <span>{sidekickMood === 'think' ? '🤔' : sidekickMood === 'happy' ? '😄' : sidekickMood === 'celebrate' ? '🎉' : '🤖'}</span>
            </div>
            <div style={{ color: '#495057' }}>
              <div style={{ fontWeight: 700 }}>Coach Bot</div>
              <div style={{ fontSize: 14 }}>{sidekickMood === 'think' ? 'Try changing the message inside the quotes!' : sidekickMood === 'happy' ? 'Nice tweak! That\'s how coders explore.' : 'Tap a step or run your code to begin!'}</div>
            </div>
          </div>

          {/* Lesson Progress Bar */}
          <div className="lesson-progress-container">
            <div className="progress-label">
              <span>Lesson Progress</span>
              <span>{lessonProgress.stepsCompleted}/{lessonProgress.totalSteps}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(lessonProgress.stepsCompleted / lessonProgress.totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Progress Map */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 18px 0' }}>
            {Array.from({ length: lessonProgress.totalSteps }).map((_, i) => {
              const idx = i + 1;
              const done = lessonProgress.stepsCompleted >= idx;
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: done ? '#4ecca3' : '#e9ecef', boxShadow: done && !calmMode ? '0 0 12px rgba(78,204,163,0.6)' : 'none', transition: 'all 300ms' }}></div>
                  {idx < lessonProgress.totalSteps && <div style={{ width: 40, height: 4, borderRadius: 2, background: done ? '#4ecca3' : '#e9ecef' }} />}
                </div>
              );
            })}
          </div>

          <div className="lesson-content">
            {/* Step 1: Introduction */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 1 ? 'completed' : ''}`}>
              <div className="step-header" onClick={() => completeStep(1)}>
                <span className="step-number">1</span>
                <h2>What is Python?</h2>
                {lessonProgress.stepsCompleted >= 1 && <span className="step-check">✅</span>}
              </div>
              <p>
                Python is a computer language that helps us talk to computers. It is easy to learn and is used
                for making games, websites, and apps! Today, you'll be the computer whisperer, {firstName}.
              </p>
              <button type="button" onClick={() => speak('Python helps us talk to computers. Today you will be the computer whisperer, ' + firstName + '.')} style={{ fontSize: 12 }}>🔊 Read aloud</button>
            </div>

            {/* Step 2: Commands */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 2 ? 'completed' : ''}`}>
              <div className="step-header" onClick={() => completeStep(2)}>
                <span className="step-number">2</span>
                <h2>How Do We Talk to a Computer?</h2>
                {lessonProgress.stepsCompleted >= 2 && <span className="step-check">✅</span>}
              </div>
              <p>
                We use commands to give instructions. One important command is <code>print()</code>, which tells
                Python to show something on the screen.
              </p>
              <button type="button" onClick={() => speak('We use commands like print to tell the computer to show something.')} style={{ fontSize: 12 }}>🔊 Read aloud</button>
            </div>

            {/* Step 3: Code Examples */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 3 ? 'completed' : ''}`}>
              <div className="step-header" onClick={() => completeStep(3)}>
                <span className="step-number">3</span>
                <h2>Let's See Some Examples</h2>
                {lessonProgress.stepsCompleted >= 3 && <span className="step-check">✅</span>}
              </div>
              <div className="code-example">
                <pre>{getInitialCode()}</pre>
                <pre>{theme === 'cats' ? 'print("I love cats! 🐾")' : theme === 'rockets' ? 'print("To the stars! 🚀")' : theme === 'emojis' ? 'print("Coding is fun! 😄✨")' : 'print("I love coding!")'}</pre>
              </div>
            </div>

            {/* Step 4: Interactive Challenge */}
            <div className={`lesson-step ${lessonProgress.stepsCompleted >= 4 ? 'completed' : ''}`}>
              <div className="step-header">
                <span className="step-number">4</span>
                <h2>Your Sunny Challenge</h2>
                {lessonProgress.stepsCompleted >= 4 && <span className="step-check">✅</span>}
              </div>
              <div className="try-it">
                <h3>🎯 Challenge Time!</h3>
                <p>Change the message to anything fun (or add emojis) and see what happens!</p>
                {lessonProgress.hasRunCode && (
                  <div className="challenge-feedback">
                    <p>Awesome job, {firstName}! You made the computer speak! 🎉</p>
                  </div>
                )}
              </div>

              <PythonEditor
                key={editorKey}
                initialCode={editorSeed || getInitialCode()}
                onOutput={handleCodeOutput}
              />
              {hintMessage && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#fff3bf', border: '1px solid #ffe066', borderRadius: 8, color: '#79520a' }}>{hintMessage}</div>
              )}
              <div style={{ marginTop: 8 }}>
                <button type="button" style={ui.btnPrimary} onClick={() => { const c = `print("Hello, ${firstName}! 😀")`; setEditorSeed(c); setEditorKey(prev => prev + 1); if (!calmMode) triggerConfetti(600); }}>✨ Prefill with my name</button>
              </div>
            </div>

            {/* Drag-and-Drop Print Builder */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">6</span>
                <h2><span style={ui.headerTag}>Builder</span> Drag‑and‑Drop Print (Level {dndLevel})</h2>
              </div>
              <p>Drag the tiles into the slots to make a correct print statement.</p>
              {dndHint && <div style={{ padding: '8px 10px', background: '#fff3bf', border: '1px solid #ffe066', borderRadius: 8, color: '#79520a', marginBottom: 10 }}>{dndHint}</div>}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                {dndTiles.map(t => (
                  <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify(t))} style={{ ...ui.chip, background: '#fff' }}>{t.text}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {dndSlots.map((s, idx) => (
                  <div key={idx} onDragOver={e => e.preventDefault()} onDrop={e => {
                    try {
                      const t = JSON.parse(e.dataTransfer.getData('text/plain'));
                      const newSlots = [...dndSlots];
                      newSlots[idx] = t.text;
                      setDndSlots(newSlots);
                      if ((dndLevel === 1 || dndLevel === 2) && newSlots.every(x => x !== null)) {
                        const correct = dndLevel === 1 ? ['print','(','"Hello"',')'] : ['print','(','"Hello, '+firstName+'! 😀"',')'];
                        if (JSON.stringify(newSlots) === JSON.stringify(correct)) {
                          if (!calmMode) { triggerConfetti(800); playTone(880, 0.1); }
                          setSidekickMood('happy');
                          setDndSolvedNoHints(v => v + (dndHint ? 0 : 1));
                          setDndHint('Nice! Try the next level.');
                          setTimeout(() => setDndLevel(l => Math.min(3, l + 1)), 600);
                          // Award if solved three without hints
                          if (dndSolvedNoHints + 1 >= 3) {
                            const badge = { id: 'puzzle_pro', title: '🧩 Puzzle Pro', description: 'Solved 3 puzzles without hints!', xp: 20 };
                            const merged = mergeBadges(lessonProgress, [badge]);
                            saveProgress(merged);
                            showAchievementNotification(badge);
                          }
                        } else {
                          setDndHint('Almost! Hint: The first tile should be print.');
                          setSidekickMood('think');
                          if (!calmMode) playTone(260, 0.08);
                        }
                      }
                      if (dndLevel === 3) {
                        const filled = newSlots.filter(x => x !== null).length;
                        if (filled === 8) {
                          const correct3 = ['print','(','"First"',')','print','(','"Second"',')'];
                          if (JSON.stringify(newSlots) === JSON.stringify(correct3)) {
                            if (!calmMode) { triggerConfetti(900); playTone(990, 0.1); }
                            setSidekickMood('celebrate');
                            setDndHint('Level 3 cleared!');
                          } else {
                            setDndHint('Order matters! "First" should come before "Second".');
                            if (!calmMode) playTone(260, 0.08);
                          }
                        }
                      }
                    } catch {}
                  }} style={{ ...ui.slot, fontSize: 14 }}>{s || 'Drop here'}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                <button type="button" style={ui.btnSecondary} onClick={() => setDndHint('Try starting with print, then (, then the message, then ).')}>💡 Need a hint</button>
                <button type="button" style={ui.btnPrimary} onClick={() => { setDndSlots(dndSlots.map(() => null)); setDndHint(''); }}>↺ Reset</button>
              </div>
            </div>

            {/* Sandbox Board */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">7</span>
                <h2><span style={ui.headerTag}>Sandbox</span> Free‑Form Board</h2>
              </div>
              <p>Drag words to each line, then Run Board to print them!</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                {sandboxTiles.map(t => (
                  <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData('text/plain', t.text)} style={{ ...ui.chip, background: '#fff' }}>{t.text}</div>
                ))}
              </div>
              <div>
                {sandboxLines.map((line, idx) => (
                  <div key={idx} onDragOver={e => e.preventDefault()} onDrop={e => { const txt = e.dataTransfer.getData('text/plain'); const copy = sandboxLines.map(l => [...l]); copy[idx].push(txt); setSandboxLines(copy); }} style={{ ...ui.slot, width: '100%', justifyContent: 'flex-start', padding: 10, marginBottom: 8, minHeight: 56 }}>
                    {line.length === 0 ? <span style={{ color: '#adb5bd' }}>Drop words here</span> : line.join(' ')}
                  </div>
                ))}
                <button type="button" style={{ ...ui.btnPrimary, marginTop: 8 }} onClick={() => {
                  const out = sandboxLines.map(l => l.join(' '));
                  setSandboxOutput(out);
                  if (out.join(' ').includes(firstName)) {
                    const badge = { id: 'name_tag', title: '📛 Name Tag', description: 'You printed your name!', xp: 10 };
                    const merged = mergeBadges(lessonProgress, [badge]);
                    saveProgress(merged);
                    showAchievementNotification(badge);
                  }
                  if (!calmMode) triggerConfetti(700);
                }}>▶ Run Board</button>
                {sandboxOutput.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <strong style={{ display: 'block', marginBottom: 6 }}>Output:</strong>
                    <pre style={{ background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 10, padding: 12, color: '#1e6f3e' }}>{sandboxOutput.map((o, i) => `print("${o}") → ${o}`).join('\n')}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Sequence and Missing Piece Puzzles */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">8</span>
                <h2><span style={ui.headerTag}>Puzzles</span> Order & Fill the Gap</h2>
              </div>
              <p style={{ marginBottom: 10 }}>Reorder the lines to match the target output order.</p>
              <div>
                {seqLines.map((line, i) => (
                  <div key={i} draggable onDragStart={e => e.dataTransfer.setData('text/plain', String(i))} onDragOver={e => e.preventDefault()} onDrop={e => { const from = parseInt(e.dataTransfer.getData('text/plain')); const arr = [...seqLines]; const [m] = arr.splice(from,1); arr.splice(i,0,m); setSeqLines(arr); }} style={{ padding: 12, marginBottom: 10, border: '2px solid #e9ecef', borderRadius: 12, background: '#fff', cursor: 'move' }}>{line}</div>
                ))}
                <button type="button" style={ui.btnPrimary} onClick={() => {
                  if (JSON.stringify(seqLines) === JSON.stringify(seqTarget)) {
                    if (!calmMode) { triggerConfetti(800); playTone(880, 0.1); }
                    const badge = { id: 'puzzle_pro', title: '🧩 Puzzle Pro', description: 'Solved puzzles!', xp: 10 };
                    const merged = mergeBadges(lessonProgress, [badge]);
                    saveProgress(merged);
                    showAchievementNotification(badge);
                  }
                }}>✅ Check Order</button>
              </div>
              <p style={{ marginTop: 16, marginBottom: 10 }}>Fill the missing piece to complete the statement:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ padding: '10px 12px', border: '2px solid #e9ecef', borderRadius: 12, background: '#fff' }}>____("Hello")</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {missingOptions.map(opt => (
                    <div key={opt} draggable onDragStart={e => e.dataTransfer.setData('text/plain', opt)} style={{ ...ui.chip, background: '#fff' }}>{opt}</div>
                  ))}
                </div>
              </div>
              <div onDragOver={e => e.preventDefault()} onDrop={e => { const opt = e.dataTransfer.getData('text/plain'); setMissingSlot(opt); if (opt === 'print') { if (!calmMode) triggerConfetti(700); showAchievementNotification({ id: 'puzzle_piece', title: '🧩 Fixed It!', description: 'You filled the missing piece!', xp: 5 }); } else { if (!calmMode) playTone(260, 0.08); setSidekickMood('think'); } }} style={{ ...ui.slot, marginTop: 10, minWidth: 180 }}>{missingSlot ? `You chose: ${missingSlot}` : 'Drop correct word here'}</div>
            </div>

            {/* Spot the Bug */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">9</span>
                <h2><span style={ui.headerTag}>Debug</span> Spot the Bug</h2>
              </div>
              <p style={{ marginBottom: 10 }}>Drag the bug onto the wrong word to fix the code.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ padding: '10px 12px', border: '2px solid #e9ecef', borderRadius: 12, background: '#fff' }}>say("Hello")</div>
                <div draggable onDragStart={e => e.dataTransfer.setData('text/plain', 'bug')} style={{ padding: '10px 12px', border: '2px dashed #e03131', borderRadius: 12, background: '#fff5f5', color: '#e03131', cursor: 'grab' }}>🐞 Bug</div>
                <div onDragOver={e => e.preventDefault()} onDrop={e => { const tag = e.dataTransfer.getData('text/plain'); if (tag === 'bug') { setBugFixed(true); if (!calmMode) triggerConfetti(600); } }} style={{ ...ui.slot }}>Drop on wrong word</div>
              </div>
              {bugFixed && <div style={{ marginTop: 10, padding: '10px 12px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 10, color: '#1e6f3e' }}>✅ Fixed! It should be print("Hello").</div>}
            </div>

            {/* Visual Print Block */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">10</span>
                <h2><span style={ui.headerTag}>Blocks</span> Print Block</h2>
              </div>
              <p style={{ marginBottom: 10 }}>Drag text into the block and click it to speak!</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Hello','World','😀',firstName,'Python'].map(t => (
                  <div key={t} draggable onDragStart={e => e.dataTransfer.setData('text/plain', t)} style={{ ...ui.chip, background: '#fff' }}>{t}</div>
                ))}
              </div>
              <div onDragOver={e => e.preventDefault()} onDrop={e => { const t = e.dataTransfer.getData('text/plain'); setBlockInput(prev => (prev ? prev + ' ' + t : t)); }} onClick={() => { setBlockBubble(blockInput); if (!calmMode) playTone(780, 0.08); }} style={{ marginTop: 12, padding: '12px 14px', border: '3px solid #667eea', borderRadius: 12, background: 'linear-gradient(135deg, #e6e9ff 0%, #f0f4ff 100%)', cursor: 'pointer', fontFamily: 'monospace', fontSize: 15 }}>print( "{blockInput}" )</div>
              {blockBubble && <div style={{ marginTop: 10, padding: '10px 12px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 10, color: '#1e6f3e' }}><strong>Output:</strong> {blockBubble}</div>}
            </div>

            {/* Micro‑story panels */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">11</span>
                <h2><span style={ui.headerTag}>Story</span> Teach the Robot</h2>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 14 }}>
                <div><RobotCharacter mood={robotMood} /></div>
                <div style={{ flex: 1, padding: '14px 16px', border: '2px solid #e9ecef', borderRadius: 12, background: '#fff', fontSize: 16 }}>{storyPanels[storyIdx]}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <button type="button" style={ui.btnSecondary} onClick={() => setStoryIdx(i => Math.max(0, i - 1))} disabled={storyIdx === 0}>◀ Prev</button>
                <button type="button" style={ui.btnSecondary} onClick={() => setStoryIdx(i => Math.min(storyPanels.length - 1, i + 1))} disabled={storyIdx === storyPanels.length - 1}>Next ▶</button>
              </div>
              <div>
                <div style={{ marginBottom: 8, color: '#495057', fontWeight: 600 }}>
                  {(() => {
                    const targets = ['Hello', 'Hello', 'Hello', `Hello, ${firstName}!`];
                    const target = targets[storyIdx];
                    return <span>🎯 Type code to print: <code style={{ background: '#f0f4ff', padding: '3px 8px', borderRadius: 6 }}>"{target}"</code></span>;
                  })()}
                </div>
                <textarea value={storyCode} onChange={e => { setStoryCode(e.target.value); setRobotMood('listening'); }} placeholder='Type code like: print("Hello")' style={{ width: '100%', minHeight: 80, fontFamily: 'monospace', borderRadius: 12, border: '2px solid #e9ecef', padding: 12, fontSize: 14 }} />
                <div style={{ marginTop: 10 }}>
                  <button type="button" style={ui.btnPrimary} onClick={() => {
                    const targets = ['Hello', 'Hello', 'Hello', `Hello, ${firstName}!`];
                    const target = targets[storyIdx];
                    const trimmed = storyCode.trim();
                    const expected = `print("${target}")`;
                    if (trimmed === expected) {
                      setStoryOutput(target);
                      setStoryHint('');
                      setRobotMood('happy');
                      if (!calmMode) { triggerConfetti(800); playTone(880, 0.1); }
                    } else {
                      setStoryOutput('');
                      setStoryHint(`Hint: Use print("...") and make sure it exactly matches: print("${target}")`);
                      setRobotMood('confused');
                      if (!calmMode) playTone(260, 0.08);
                    }
                  }}>▶ Run</button>
                </div>
                {storyHint && <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff3bf', border: '2px solid #ffe066', borderRadius: 10, color: '#79520a' }}>{storyHint}</div>}
                {storyOutput && <div style={{ marginTop: 10, padding: '10px 12px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 10, color: '#1e6f3e' }}><strong>Output:</strong> {storyOutput} ✅</div>}
              </div>
            </div>

            {/* Input/Output Factory */}
            <div className="lesson-step" style={ui.card}>
              <div className="step-header">
                <span className="step-number">12</span>
                <h2><span style={ui.headerTag}>Factory</span> How print() Works</h2>
              </div>
              <p style={{ marginBottom: 14 }}>See the journey: you give Python a message → it processes → and shows it on screen!</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 12 }}>
                {['Hello','Coding','Rockets 🚀',firstName].map(t => (
                  <button key={t} type="button" style={{ ...ui.btnSecondary, fontSize: 14, padding: '10px' }} onClick={() => {
                    setFactoryItems(items => [...items, { id: Date.now()+Math.random(), text: t, x: 0 }]);
                    if (!calmMode) playTone(520, 0.05);
                  }}>{t}</button>
                ))}
              </div>
              <button type="button" style={{ ...ui.btnPrimary, marginBottom: 14 }} onClick={() => {
                  setFactoryRunning(true);
                  const start = performance.now();
                  const run = (ts) => {
                    const dt = ts - start;
                    setFactoryItems(items => items.map(it => ({ ...it, x: Math.min(100, it.x + 2) })));
                    if (dt < 2000) requestAnimationFrame(run); else setFactoryRunning(false);
                  };
                  requestAnimationFrame(run);
                }} disabled={factoryRunning}>▶ Run Factory</button>
              {/* Pipeline visualization */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #fff 0%, #f0f4ff 100%)', border: '2px solid #667eea', borderRadius: 12, textAlign: 'center', fontWeight: 700, color: '#667eea' }}>
                  1. Input
                  <div style={{ fontSize: 12, color: '#495057', fontWeight: 400 }}>Your message</div>
                </div>
                <div style={{ fontSize: 28 }}>→</div>
                <div style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #fff 0%, #fff3bf 100%)', border: '2px solid #ffd93d', borderRadius: 12, textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>
                  2. Python
                  <div style={{ fontSize: 12, color: '#495057', fontWeight: 400 }}>Processing...</div>
                </div>
                <div style={{ fontSize: 28 }}>→</div>
                <div style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 12, textAlign: 'center', fontWeight: 700, color: '#1e6f3e' }}>
                  3. Output
                  <div style={{ fontSize: 12, color: '#495057', fontWeight: 400 }}>Shown on screen</div>
                </div>
              </div>
              {/* Animated conveyor */}
              <div style={{ position: 'relative', height: 90, border: '3px dashed #b8c1ec', borderRadius: 12, overflow: 'hidden', background: 'rgba(102, 126, 234, 0.03)' }}>
                {factoryItems.map(it => (
                  <div key={it.id} style={{ position: 'absolute', left: `${it.x}%`, top: 28, transition: 'left 200ms', padding: '10px 14px', background: 'linear-gradient(135deg, #fff 0%, #f0f4ff 100%)', border: '2px solid #667eea', borderRadius: 12, boxShadow: '0 4px 10px rgba(102, 126, 234, 0.2)', fontWeight: 600 }}>{it.text}</div>
                ))}
              </div>
              {factoryItems.length > 0 && factoryItems.every(it => it.x >= 100) && (
                <div style={{ marginTop: 12, padding: '12px 14px', background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', border: '2px solid #6bcf7f', borderRadius: 12, color: '#1e6f3e' }}>
                  <strong>Output on Screen:</strong> {factoryItems.map(it => it.text).join(', ')}
                </div>
              )}
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
                backgroundColor: lessonProgress.stepsCompleted >= 1 ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.stepsCompleted >= 1 ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.stepsCompleted >= 1 ? '✅' : '⭕'} Steps
              </div>
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
              <div style={{
                padding: '8px 12px',
                borderRadius: '20px',
                backgroundColor: lessonProgress.hasSeenOutput ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasSeenOutput ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.hasSeenOutput ? '✅' : '⭕'} See Output
              </div>
              <div style={{
                padding: '8px 12px',
                borderRadius: '20px',
                backgroundColor: lessonProgress.hasCompletedChallenge ? '#4ecca3' : '#e9ecef',
                color: lessonProgress.hasCompletedChallenge ? 'white' : '#6c757d',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {lessonProgress.hasCompletedChallenge ? '✅' : '⭕'} Challenge
              </div>
            </div>
            <p style={{ margin: '15px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
              Complete any one activity above to unlock the quiz!
            </p>

            {/* Achievements Badges Grid */}
            {lessonProgress.achievements && lessonProgress.achievements.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <h4 style={{ margin: '0 0 8px 0' }}>🏅 Badges</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {lessonProgress.achievements.map(b => (
                    <div key={b.id} style={{ padding: '8px 10px', borderRadius: 12, background: '#fff', border: '1px solid #e9ecef', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', transform: !calmMode ? 'translateY(0)' : 'none' }}>{b.title}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lesson Completion Status */}
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
              {isCompleted ? '✅ Lesson Completed - Go to Quiz 1 🍉' :
               isLessonEligibleForCompletion() ? 'Ready for Quiz 1 🍉' :
               'Complete at least one activity to unlock quiz'}
            </button>

          </footer>
        </section>
        </div>
      </div>
    </div>
  );
};

export default Lesson1Interactive;
