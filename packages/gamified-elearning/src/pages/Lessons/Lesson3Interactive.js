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

const Lesson3Interactive = () => {
  const navigate = useNavigate();
  const { markLessonComplete } = useProgress();
  const { user } = useContext(AuthContext) || {};
  const firstName = (user?.name || 'Coder').split(' ')[0];

  const [lessonOutput, setLessonOutput] = useState('');
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(false);
  const [calmMode, setCalmMode] = useState(false);
  const [theme, setTheme] = useState('default'); // default | space | pirates | animals
  const confettiCanvasRef = useRef(null);

  // Progress tracking
  const [lessonProgress, setLessonProgress] = useState({
    stepsCompleted: 0,
    totalSteps: 10,
    achievements: [],
    hasRunCode: false,
    hasModifiedCode: false,
    hasCompletedChallenge: false,
    gamesCompleted: []
  });

  const [showAchievement, setShowAchievement] = useState(null);
  const [currentXP, setCurrentXP] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showXPGlow, setShowXPGlow] = useState(false);
  const [sidekickMood, setSidekickMood] = useState('idle');

  // 1. Math Playground
  const [playgroundNums, setPlaygroundNums] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const [playgroundOps, setPlaygroundOps] = useState(['+', '-', '*', '/', '//', '**', '%']);
  const [playgroundSlots, setPlaygroundSlots] = useState([null, null, null]); // [num1, op, num2]
  const [playgroundResult, setPlaygroundResult] = useState(null);
  const [playgroundVisual, setPlaygroundVisual] = useState([]);

  // 2. Operation Matching Game
  const [matchingCards, setMatchingCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [matchingScore, setMatchingScore] = useState(0);
  const [matchingTime, setMatchingTime] = useState(0);
  const [matchingActive, setMatchingActive] = useState(false);

  // 3. Code-a-Calculator
  const [calcBlocks, setCalcBlocks] = useState([]);
  const [calcResult, setCalcResult] = useState('');
  const [calcChallenges, setCalcChallenges] = useState([
    { question: 'Calculate 15 + 7', answer: 22 },
    { question: 'What is 8 * 6?', answer: 48 },
    { question: 'Divide 100 by 5', answer: 20 }
  ]);
  const [currentCalcChallenge, setCurrentCalcChallenge] = useState(0);

  // 4. Math Story Problems
  const [storyTheme, setStoryTheme] = useState('default');
  const [storyCode, setStoryCode] = useState('');
  const [storyResult, setStoryResult] = useState('');
  const [currentStory, setCurrentStory] = useState(0);

  // 5. Mystery Box
  const [mysteryNum1, setMysteryNum1] = useState('');
  const [mysteryNum2, setMysteryNum2] = useState('');
  const [mysteryOp, setMysteryOp] = useState('+');
  const [mysteryTarget] = useState(10);
  const [mysterySolved, setMysterySolved] = useState(false);

  // 6. Math Race Track
  const [racePosition, setRacePosition] = useState(0);
  const [botPosition, setBotPosition] = useState(0);
  const [raceActive, setRaceActive] = useState(false);
  const [raceQuestion, setRaceQuestion] = useState(null);
  const [raceAnswer, setRaceAnswer] = useState('');
  const [raceWon, setRaceWon] = useState(false);

  // 7. Real-World Scenarios
  const [realWorldScenario, setRealWorldScenario] = useState('shopping');
  const [realWorldCode, setRealWorldCode] = useState('');
  const [realWorldResult, setRealWorldResult] = useState('');

  // Story problems data
  const storyProblems = {
    default: [
      { 
        story: `${firstName} has 5 cookies 🍪, and a friend gives ${firstName} 3 more. How many cookies in total?`,
        code: 'print(5 + 3)',
        answer: 8,
        emoji: '🍪'
      },
      {
        story: `There are 12 apples 🍎, and ${firstName} eats 4. How many apples are left?`,
        code: 'print(12 - 4)',
        answer: 8,
        emoji: '🍎'
      },
      {
        story: `${firstName} has 3 bags with 4 candies 🍬 each. How many candies total?`,
        code: 'print(3 * 4)',
        answer: 12,
        emoji: '🍬'
      }
    ],
    space: [
      {
        story: `Commander ${firstName} has 8 rockets 🚀, and Mission Control sends 5 more. How many rockets?`,
        code: 'print(8 + 5)',
        answer: 13,
        emoji: '🚀'
      },
      {
        story: `${firstName} explores 15 planets 🪐, but 6 are uninhabitable. How many good planets?`,
        code: 'print(15 - 6)',
        answer: 9,
        emoji: '🪐'
      },
      {
        story: `Each space station has 7 aliens 👽. With 3 stations, how many aliens total?`,
        code: 'print(7 * 3)',
        answer: 21,
        emoji: '👽'
      }
    ],
    pirates: [
      {
        story: `Captain ${firstName} finds 10 gold coins 🪙, then discovers 7 more. Total treasure?`,
        code: 'print(10 + 7)',
        answer: 17,
        emoji: '🪙'
      },
      {
        story: `The crew has 20 maps 🗺️, but 8 are damaged. How many good maps?`,
        code: 'print(20 - 8)',
        answer: 12,
        emoji: '🗺️'
      },
      {
        story: `Each treasure chest has 6 gems 💎. With 4 chests, how many gems?`,
        code: 'print(6 * 4)',
        answer: 24,
        emoji: '💎'
      }
    ],
    animals: [
      {
        story: `${firstName} sees 6 puppies 🐶, then 4 more arrive at the park. How many puppies?`,
        code: 'print(6 + 4)',
        answer: 10,
        emoji: '🐶'
      },
      {
        story: `There are 14 birds 🐦 in a tree, and 5 fly away. How many birds remain?`,
        code: 'print(14 - 5)',
        answer: 9,
        emoji: '🐦'
      },
      {
        story: `Each nest has 3 eggs 🥚. With 5 nests, how many eggs total?`,
        code: 'print(3 * 5)',
        answer: 15,
        emoji: '🥚'
      }
    ]
  };

  // Real-world scenarios
  const realWorldScenarios = {
    shopping: {
      title: '🛒 Shopping Math',
      problem: `You want to buy 3 toys that cost $8 each. How much money do you need?`,
      hint: 'Use multiplication: 3 * 8',
      code: 'print(3 * 8)',
      answer: 24
    },
    game: {
      title: '🎮 Game Points',
      problem: `Your high score is 95 points. You just earned 37 more points. What's your new total?`,
      hint: 'Use addition: 95 + 37',
      code: 'print(95 + 37)',
      answer: 132
    },
    recipe: {
      title: '🍰 Recipe Doubling',
      problem: `A recipe needs 2 eggs for 4 pancakes. You want 8 pancakes. How many eggs?`,
      hint: 'Double the recipe: 2 * 2',
      code: 'print(2 * 2)',
      answer: 4
    },
    time: {
      title: '📅 Time Calculation',
      problem: `Summer vacation is in 42 days. That's how many weeks?`,
      hint: 'Divide by 7: 42 / 7',
      code: 'print(42 / 7)',
      answer: 6
    },
    money: {
      title: '💰 Allowance Math',
      problem: `You get $5 allowance per week. How much in 8 weeks?`,
      hint: 'Multiply: 5 * 8',
      code: 'print(5 * 8)',
      answer: 40
    }
  };

  // Initialize
  useEffect(() => {
    autoTrackDailyLogin();
    loadProgress();
    initializeMatchingGame();
  }, []);

  // Resize confetti canvas
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

  // Matching game timer
  useEffect(() => {
    let interval;
    if (matchingActive) {
      interval = setInterval(() => {
        setMatchingTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [matchingActive]);

  const loadProgress = () => {
    const saved = localStorage.getItem('lesson3_interactive_progress');
    if (saved) {
      setLessonProgress(JSON.parse(saved));
    }
    const savedXP = localStorage.getItem('total_xp');
    if (savedXP) setCurrentXP(parseInt(savedXP));
    const savedStreak = localStorage.getItem('learning_streak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  };

  const saveProgress = (newProgress) => {
    setLessonProgress(newProgress);
    localStorage.setItem('lesson3_interactive_progress', JSON.stringify(newProgress));
  };

  // Confetti animation
  const triggerConfetti = (durationMs = 1500) => {
    if (calmMode) return;
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const colors = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b5179e'];
    const particles = Array.from({ length: 100 }, () => ({
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
      setShowXPGlow(true);
      setTimeout(() => setShowXPGlow(false), 800);
    }
    setTimeout(() => setShowAchievement(null), 3000);
  };

  const mergeBadges = (progress, newBadges) => {
    if (!newBadges.length) return progress;
    const byId = new Map();
    [...(progress.achievements || []), ...newBadges].forEach(b => byId.set(b.id, b));
    return { ...progress, achievements: Array.from(byId.values()) };
  };

  const completeGame = (gameName) => {
    if (lessonProgress.gamesCompleted.includes(gameName)) return;
    
    const newProgress = {
      ...lessonProgress,
      gamesCompleted: [...lessonProgress.gamesCompleted, gameName],
      stepsCompleted: lessonProgress.stepsCompleted + 1
    };
    
    const badge = {
      id: `game_${gameName}`,
      title: `🎮 ${gameName} Master`,
      description: `Completed the ${gameName} game!`,
      xp: 20
    };
    
    const merged = mergeBadges(newProgress, [badge]);
    saveProgress(merged);
    showAchievementNotification(badge);
    setSidekickMood('celebrate');
  };

  // 1. MATH PLAYGROUND
  const handlePlaygroundDrop = (index, value) => {
    const newSlots = [...playgroundSlots];
    newSlots[index] = value;
    setPlaygroundSlots(newSlots);

    if (newSlots.every(s => s !== null)) {
      calculatePlayground(newSlots);
    }
  };

  const calculatePlayground = (slots) => {
    const [num1, op, num2] = slots;
    let result;
    try {
      switch(op) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/': result = num1 / num2; break;
        case '//': result = Math.floor(num1 / num2); break;
        case '**': result = Math.pow(num1, num2); break;
        case '%': result = num1 % num2; break;
        default: result = 0;
      }
      setPlaygroundResult(result);
      
      // Create visual representation
      if (op === '+') {
        const visual = [...Array(num1)].map((_, i) => `🍎`).concat([...Array(num2)].map((_, i) => `🍎`));
        setPlaygroundVisual(visual);
      } else if (op === '-') {
        const visual = [...Array(result)].map((_, i) => `🍎`);
        setPlaygroundVisual(visual);
      } else if (op === '*') {
        const visual = [];
        for (let i = 0; i < num1; i++) {
          visual.push([...Array(num2)].map(() => '🍎'));
        }
        setPlaygroundVisual(visual);
      }
      
      if (!calmMode) {
        triggerConfetti(600);
        playTone(660, 0.1);
      }
      
      completeGame('Playground');
    } catch (e) {
      setPlaygroundResult('Error');
    }
  };

  // 2. OPERATION MATCHING GAME
  const initializeMatchingGame = () => {
    const pairs = [
      { id: 1, type: 'question', value: '5 + 3', pair: 2 },
      { id: 2, type: 'answer', value: '8', pair: 1 },
      { id: 3, type: 'question', value: '4 * 2', pair: 4 },
      { id: 4, type: 'answer', value: '8', pair: 3 },
      { id: 5, type: 'question', value: '10 - 3', pair: 6 },
      { id: 6, type: 'answer', value: '7', pair: 5 },
      { id: 7, type: 'question', value: '2 ** 3', pair: 8 },
      { id: 8, type: 'answer', value: '8', pair: 7 },
      { id: 9, type: 'question', value: '15 / 3', pair: 10 },
      { id: 10, type: 'answer', value: '5', pair: 9 },
      { id: 11, type: 'question', value: '17 // 5', pair: 12 },
      { id: 12, type: 'answer', value: '3', pair: 11 }
    ];
    setMatchingCards(pairs.sort(() => Math.random() - 0.5));
  };

  const handleCardFlip = (card) => {
    if (flippedCards.length === 2 || flippedCards.some(c => c.id === card.id) || matchedPairs.includes(card.id)) {
      return;
    }

    const newFlipped = [...flippedCards, card];
    setFlippedCards(newFlipped);

    if (!matchingActive) {
      setMatchingActive(true);
      setMatchingTime(0);
    }

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (first.pair === second.id) {
        // Match found!
        setMatchedPairs(prev => [...prev, first.id, second.id]);
        setMatchingScore(prev => prev + 10);
        if (!calmMode) {
          playTone(880, 0.1);
          triggerConfetti(400);
        }
        setTimeout(() => setFlippedCards([]), 300);
        
        if (matchedPairs.length + 2 === matchingCards.length) {
          completeGame('Matching');
          setMatchingActive(false);
        }
      } else {
        // No match
        if (!calmMode) playTone(260, 0.08);
        setTimeout(() => setFlippedCards([]), 800);
      }
    }
  };

  const resetMatchingGame = () => {
    initializeMatchingGame();
    setFlippedCards([]);
    setMatchedPairs([]);
    setMatchingScore(0);
    setMatchingTime(0);
    setMatchingActive(false);
  };

  // 3. CODE-A-CALCULATOR
  const addCalcBlock = (num) => {
    setCalcBlocks([...calcBlocks, { type: 'number', value: num }]);
  };

  const addCalcOp = (op) => {
    if (calcBlocks.length > 0) {
      setCalcBlocks([...calcBlocks, { type: 'operator', value: op }]);
    }
  };

  const calculateCalc = () => {
    if (calcBlocks.length < 3) return;
    
    try {
      const expr = calcBlocks.map(b => b.value).join(' ');
      const result = eval(expr.replace('//', 'Math.floor(') + (expr.includes('//') ? ')' : ''));
      setCalcResult(result);
      
      const challenge = calcChallenges[currentCalcChallenge];
      if (result === challenge.answer) {
        if (!calmMode) {
          triggerConfetti(800);
          playTone(880, 0.1);
        }
        showAchievementNotification({
          id: 'calc_challenge',
          title: '🧮 Calculator Pro',
          description: 'Solved calculator challenge!',
          xp: 15
        });
        
        if (currentCalcChallenge < calcChallenges.length - 1) {
          setTimeout(() => {
            setCurrentCalcChallenge(prev => prev + 1);
            setCalcBlocks([]);
            setCalcResult('');
          }, 2000);
        } else {
          completeGame('Calculator');
        }
      }
    } catch (e) {
      setCalcResult('Error');
    }
  };

  // 4. MATH STORY PROBLEMS
  const handleStorySubmit = () => {
    const current = storyProblems[storyTheme][currentStory];
    const trimmed = storyCode.trim();
    
    if (trimmed === current.code) {
      setStoryResult(`✅ Correct! The answer is ${current.answer} ${current.emoji}`);
      if (!calmMode) {
        triggerConfetti(800);
        playTone(880, 0.1);
      }
      
      if (currentStory < storyProblems[storyTheme].length - 1) {
        setTimeout(() => {
          setCurrentStory(prev => prev + 1);
          setStoryCode('');
          setStoryResult('');
        }, 2000);
      } else {
        completeGame('Story');
      }
    } else {
      setStoryResult(`❌ Try again! Hint: ${current.code}`);
      if (!calmMode) playTone(260, 0.08);
    }
  };

  // 5. MYSTERY BOX
  const checkMystery = () => {
    const num1 = parseInt(mysteryNum1);
    const num2 = parseInt(mysteryNum2);
    
    let result;
    switch(mysteryOp) {
      case '+': result = num1 + num2; break;
      case '-': result = num1 - num2; break;
      case '*': result = num1 * num2; break;
      case '/': result = num1 / num2; break;
      default: result = 0;
    }
    
    if (result === mysteryTarget) {
      setMysterySolved(true);
      if (!calmMode) {
        triggerConfetti(1000);
        playTone(990, 0.12);
      }
      completeGame('Mystery');
    } else {
      if (!calmMode) playTone(260, 0.08);
    }
  };

  // 6. MATH RACE TRACK
  const startRace = () => {
    setRaceActive(true);
    setRacePosition(0);
    setBotPosition(0);
    setRaceWon(false);
    generateRaceQuestion();
  };

  const generateRaceQuestion = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    let answer;
    switch(op) {
      case '+': answer = num1 + num2; break;
      case '-': answer = num1 - num2; break;
      case '*': answer = num1 * num2; break;
      default: answer = 0;
    }
    
    setRaceQuestion({ num1, op, num2, answer });
  };

  const handleRaceAnswer = () => {
    if (parseInt(raceAnswer) === raceQuestion.answer) {
      const newPos = racePosition + 20;
      setRacePosition(newPos);
      setRaceAnswer('');
      
      if (!calmMode) playTone(660, 0.08);
      
      if (newPos >= 100) {
        setRaceWon(true);
        setRaceActive(false);
        if (!calmMode) {
          triggerConfetti(1200);
          playTone(880, 0.15);
        }
        completeGame('Race');
      } else {
        generateRaceQuestion();
        // Bot moves slower
        setTimeout(() => {
          setBotPosition(prev => Math.min(prev + 15, 100));
        }, 1000);
      }
    } else {
      if (!calmMode) playTone(260, 0.08);
    }
  };

  // 7. REAL-WORLD SCENARIOS
  const handleRealWorldSubmit = () => {
    const scenario = realWorldScenarios[realWorldScenario];
    const trimmed = realWorldCode.trim();
    
    if (trimmed === scenario.code) {
      setRealWorldResult(`✅ Perfect! The answer is ${scenario.answer}!`);
      if (!calmMode) {
        triggerConfetti(800);
        playTone(880, 0.1);
      }
      
      showAchievementNotification({
        id: `real_world_${realWorldScenario}`,
        title: '🌍 Real World Master',
        description: `Solved ${scenario.title}!`,
        xp: 15
      });
    } else {
      setRealWorldResult(`❌ Try again! ${scenario.hint}`);
      if (!calmMode) playTone(260, 0.08);
    }
  };

  const handleCodeOutput = (output) => {
    setLessonOutput(output);
    const newProgress = {
      ...lessonProgress,
      hasRunCode: true,
      hasModifiedCode: output.length > 0,
      stepsCompleted: Math.max(lessonProgress.stepsCompleted, 1)
    };
    saveProgress(newProgress);
  };

  const isLessonEligibleForCompletion = () => {
    return lessonProgress.gamesCompleted.length >= 3 || lessonProgress.hasRunCode;
  };

  const goToDashboard = () => navigate('/MainPage');

  const goToQuiz = async () => {
    if (!isLessonEligibleForCompletion()) {
      alert('🎯 Complete at least 3 mini-games or run some code to unlock the quiz!');
      return;
    }

    if (!isCompleted) {
      try {
        const timeSpent = timeTracker.getTimeSpent();
        const result = await trackStaticLessonCompletion(3, timeSpent);
        showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
        markLessonComplete(3);
        setIsCompleted(true);
      } catch (error) {
        console.error('Error tracking lesson completion:', error);
      }
    }
    navigate('/quiz/3');
  };

  // UI Styles
  const ui = {
    card: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      border: '2px solid #e9ecef',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      marginBottom: 20
    },
    chip: {
      padding: '10px 14px',
      border: '2px solid #667eea',
      borderRadius: 999,
      background: '#fff',
      boxShadow: '0 4px 10px rgba(102, 126, 234, 0.15)',
      cursor: 'grab',
      fontWeight: 600,
      display: 'inline-block',
      margin: 4,
      userSelect: 'none'
    },
    slot: {
      minWidth: 80,
      minHeight: 60,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px dashed #b8c1ec',
      borderRadius: 12,
      background: 'rgba(102, 126, 234, 0.05)',
      margin: 4,
      fontSize: 20,
      fontWeight: 700
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
      fontSize: 15
    },
    btnSecondary: {
      background: '#f8f9fa',
      color: '#495057',
      border: '2px solid #e9ecef',
      padding: '10px 18px',
      borderRadius: 12,
      cursor: 'pointer',
      fontWeight: 600
    }
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

        {/* Header */}
        <div className="progress-header" style={{ marginTop: '20px' }}>
          <div className="xp-display">
            <span className="xp-icon">⭐</span>
            <span className="xp-text" style={{ textShadow: showXPGlow ? '0 0 12px #ffd166' : 'none' }}>{currentXP} XP</span>
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
              <select value={storyTheme} onChange={e => setStoryTheme(e.target.value)}>
                <option value="default">Classic 🍪</option>
                <option value="space">Space 🚀</option>
                <option value="pirates">Pirates 🏴‍☠️</option>
                <option value="animals">Animals 🐶</option>
              </select>
            </label>
          </div>
        </div>

        <section className="lesson-card">
          <header className="lesson-header">
            <span className="lesson-pill">Lesson 3 • Interactive</span>
            <h1>Hey {firstName}! Math Magic with Python 🧮✨</h1>
            <p className="lesson-subtitle">
              Turn Python into your super calculator and solve real-world problems!
            </p>
          </header>

          {/* Coach Bot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#4ecca3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 6px 18px rgba(78,204,163,0.35)' }}>
              <span>{sidekickMood === 'celebrate' ? '🎉' : '🤖'}</span>
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Math Coach</div>
              <div style={{ fontSize: 14 }}>Complete mini-games to become a Math Wizard!</div>
            </div>
          </div>

          {/* Progress */}
          <div className="lesson-progress-container">
            <div className="progress-label">
              <span>Games Completed</span>
              <span>{lessonProgress.gamesCompleted.length}/6</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(lessonProgress.gamesCompleted.length / 6) * 100}%` }}></div>
            </div>
          </div>

          <div className="lesson-content">
            {/* Operations Table */}
            <div style={ui.card}>
              <h2>🎯 Python Math Operations</h2>
              <div className="math-table">
                <table>
                  <thead>
                    <tr>
                      <th>Operation</th>
                      <th>Symbol</th>
                      <th>Example</th>
                      <th>Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Addition</td>
                      <td>+</td>
                      <td>5 + 3</td>
                      <td>8</td>
                    </tr>
                    <tr>
                      <td>Subtraction</td>
                      <td>-</td>
                      <td>10 - 2</td>
                      <td>8</td>
                    </tr>
                    <tr>
                      <td>Multiplication</td>
                      <td>*</td>
                      <td>4 * 2</td>
                      <td>8</td>
                    </tr>
                    <tr>
                      <td>Division</td>
                      <td>/</td>
                      <td>16 / 4</td>
                      <td>4.0</td>
                    </tr>
                    <tr>
                      <td>Integer Division</td>
                      <td>//</td>
                      <td>17 // 3</td>
                      <td>5</td>
                    </tr>
                    <tr>
                      <td>Exponent (Power)</td>
                      <td>**</td>
                      <td>2 ** 3</td>
                      <td>8</td>
                    </tr>
                    <tr>
                      <td>Modulus (Remainder)</td>
                      <td>%</td>
                      <td>10 % 3</td>
                      <td>1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 1. Math Playground */}
            <div style={ui.card}>
              <h2>🎨 Game 1: Math Playground</h2>
              <p>Drag numbers and operators to create equations and see them come alive!</p>
              
              <div style={{ marginBottom: 16 }}>
                <strong>Numbers:</strong>
                <div style={{ marginTop: 8 }}>
                  {playgroundNums.map(num => (
                    <div
                      key={num}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('text', JSON.stringify({ type: 'number', value: num }))}
                      style={ui.chip}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong>Operators:</strong>
                <div style={{ marginTop: 8 }}>
                  {playgroundOps.map(op => (
                    <div
                      key={op}
                      draggable
                      onDragStart={e => e.dataTransfer.setData('text', JSON.stringify({ type: 'operator', value: op }))}
                      style={{ ...ui.chip, borderColor: '#ff6b9d' }}
                    >
                      {op}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const data = JSON.parse(e.dataTransfer.getData('text'));
                    if (data.type === 'number') handlePlaygroundDrop(0, data.value);
                  }}
                  style={ui.slot}
                >
                  {playgroundSlots[0] ?? 'Drop number'}
                </div>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const data = JSON.parse(e.dataTransfer.getData('text'));
                    if (data.type === 'operator') handlePlaygroundDrop(1, data.value);
                  }}
                  style={ui.slot}
                >
                  {playgroundSlots[1] ?? 'Drop op'}
                </div>
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const data = JSON.parse(e.dataTransfer.getData('text'));
                    if (data.type === 'number') handlePlaygroundDrop(2, data.value);
                  }}
                  style={ui.slot}
                >
                  {playgroundSlots[2] ?? 'Drop number'}
                </div>
                <div style={{ fontSize: 30, margin: '0 10px' }}>=</div>
                <div style={{ ...ui.slot, background: playgroundResult !== null ? 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' : 'rgba(102, 126, 234, 0.05)', borderColor: playgroundResult !== null ? '#6bcf7f' : '#b8c1ec' }}>
                  {playgroundResult ?? '?'}
                </div>
              </div>

              {playgroundResult !== null && playgroundSlots[1] === '+' && (
                <div style={{ marginTop: 16, padding: 16, background: '#f0f4ff', borderRadius: 12 }}>
                  <strong>Visual: </strong>
                  {playgroundVisual.map((item, i) => <span key={i} style={{ fontSize: 24 }}>{item}</span>)}
                  <div style={{ marginTop: 8, color: '#495057' }}>
                    {playgroundSlots[0]} apples + {playgroundSlots[2]} apples = {playgroundResult} apples!
                  </div>
                </div>
              )}

              <button type="button" style={ui.btnSecondary} onClick={() => { setPlaygroundSlots([null, null, null]); setPlaygroundResult(null); setPlaygroundVisual([]); }}>
                ↺ Reset
              </button>
            </div>

            {/* 2. Operation Matching Game */}
            <div style={ui.card}>
              <h2>🃏 Game 2: Operation Matching</h2>
              <p>Match the operations with their answers! Time: {matchingTime}s | Score: {matchingScore}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12, marginTop: 16 }}>
                {matchingCards.map(card => {
                  const isFlipped = flippedCards.some(c => c.id === card.id) || matchedPairs.includes(card.id);
                  const isMatched = matchedPairs.includes(card.id);
                  
                  return (
                    <div
                      key={card.id}
                      onClick={() => handleCardFlip(card)}
                      style={{
                        height: 80,
                        background: isMatched ? 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' : isFlipped ? '#fff' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isMatched ? 'default' : 'pointer',
                        fontWeight: 700,
                        fontSize: 16,
                        color: isFlipped || isMatched ? '#000' : '#fff',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 300ms',
                        transform: isFlipped || isMatched ? 'rotateY(0)' : 'rotateY(180deg)'
                      }}
                    >
                      {isFlipped || isMatched ? card.value : '?'}
                    </div>
                  );
                })}
              </div>

              {matchedPairs.length === matchingCards.length && matchingCards.length > 0 && (
                <div style={{ marginTop: 16, padding: 16, background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', borderRadius: 12, textAlign: 'center' }}>
                  <h3>🎉 Perfect! You matched them all in {matchingTime} seconds!</h3>
                </div>
              )}

              <button type="button" style={{ ...ui.btnSecondary, marginTop: 12 }} onClick={resetMatchingGame}>
                🔄 New Game
              </button>
            </div>

            {/* 3. Code-a-Calculator */}
            <div style={ui.card}>
              <h2>🧮 Game 3: Build Your Calculator</h2>
              <p><strong>Challenge:</strong> {calcChallenges[currentCalcChallenge].question}</p>
              
              <div style={{ marginBottom: 16 }}>
                <strong>Numbers:</strong>
                <div style={{ marginTop: 8 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={() => addCalcBlock(num)} style={{ ...ui.chip, cursor: 'pointer', border: 'none' }}>
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <strong>Operators:</strong>
                <div style={{ marginTop: 8 }}>
                  {['+', '-', '*', '/'].map(op => (
                    <button key={op} onClick={() => addCalcOp(op)} style={{ ...ui.chip, cursor: 'pointer', border: 'none', borderColor: '#ff6b9d' }}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ minHeight: 60, padding: 16, background: '#f8f9fa', borderRadius: 12, marginBottom: 12, fontFamily: 'monospace', fontSize: 20 }}>
                {calcBlocks.length === 0 ? 'Build your expression...' : calcBlocks.map((b, i) => <span key={i}>{b.value} </span>)}
              </div>

              {calcResult && (
                <div style={{ padding: 16, background: calcResult === calcChallenges[currentCalcChallenge].answer ? 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' : '#fff3bf', borderRadius: 12, marginBottom: 12 }}>
                  Result: {calcResult} {calcResult === calcChallenges[currentCalcChallenge].answer ? '✅ Correct!' : ''}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" style={ui.btnPrimary} onClick={calculateCalc}>
                  = Calculate
                </button>
                <button type="button" style={ui.btnSecondary} onClick={() => { setCalcBlocks([]); setCalcResult(''); }}>
                  Clear
                </button>
              </div>
            </div>

            {/* 4. Math Story Problems */}
            <div style={ui.card}>
              <h2>📖 Game 4: Math Story Time</h2>
              <p style={{ fontSize: 16, lineHeight: 1.6, padding: '12px 16px', background: '#f0f4ff', borderRadius: 12 }}>
                {storyProblems[storyTheme][currentStory].story}
              </p>
              
              <textarea
                value={storyCode}
                onChange={e => setStoryCode(e.target.value)}
                placeholder='Type your Python code here... (e.g., print(5 + 3))'
                style={{ width: '100%', minHeight: 80, fontFamily: 'monospace', borderRadius: 12, border: '2px solid #e9ecef', padding: 12, fontSize: 14, marginTop: 12 }}
              />

              <button type="button" style={{ ...ui.btnPrimary, marginTop: 12 }} onClick={handleStorySubmit}>
                ▶ Run Code
              </button>

              {storyResult && (
                <div style={{ marginTop: 12, padding: 12, background: storyResult.includes('✅') ? 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' : '#fff3bf', borderRadius: 12 }}>
                  {storyResult}
                </div>
              )}

              <div style={{ marginTop: 12, fontSize: 14, color: '#6c757d' }}>
                Story {currentStory + 1} of {storyProblems[storyTheme].length}
              </div>
            </div>

            {/* 5. Mystery Box */}
            <div style={ui.card}>
              <h2>🎁 Game 5: Mystery Math Box</h2>
              <p>Fill in the missing numbers to make the equation equal {mysteryTarget}!</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20 }}>print(</span>
                <input
                  type="number"
                  value={mysteryNum1}
                  onChange={e => setMysteryNum1(e.target.value)}
                  placeholder="?"
                  style={{ width: 60, height: 50, fontSize: 20, textAlign: 'center', borderRadius: 8, border: '2px solid #667eea' }}
                />
                <select value={mysteryOp} onChange={e => setMysteryOp(e.target.value)} style={{ height: 50, fontSize: 20, borderRadius: 8, border: '2px solid #667eea' }}>
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="*">*</option>
                  <option value="/">/</option>
                </select>
                <input
                  type="number"
                  value={mysteryNum2}
                  onChange={e => setMysteryNum2(e.target.value)}
                  placeholder="?"
                  style={{ width: 60, height: 50, fontSize: 20, textAlign: 'center', borderRadius: 8, border: '2px solid #667eea' }}
                />
                <span style={{ fontSize: 20 }}>) = {mysteryTarget}</span>
              </div>

              <button type="button" style={{ ...ui.btnPrimary, marginTop: 16 }} onClick={checkMystery}>
                🔍 Check Answer
              </button>

              {mysterySolved && (
                <div style={{ marginTop: 16, padding: 16, background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)', borderRadius: 12, textAlign: 'center' }}>
                  <h3>🎉 Mystery Solved! {mysteryNum1} {mysteryOp} {mysteryNum2} = {mysteryTarget}</h3>
                  <p>You found the secret combination!</p>
                </div>
              )}

              <div style={{ marginTop: 12, fontSize: 14, color: '#6c757d' }}>
                💡 Tip: There are multiple correct answers!
              </div>
            </div>

            {/* 6. Math Race Track */}
            <div style={ui.card}>
              <h2>🏁 Game 6: Math Race Challenge</h2>
              <p>Solve math problems to race to the finish line!</p>

              {!raceActive && !raceWon && (
                <button type="button" style={ui.btnPrimary} onClick={startRace}>
                  🚀 Start Race
                </button>
              )}

              {raceActive && raceQuestion && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
                    {raceQuestion.num1} {raceQuestion.op} {raceQuestion.num2} = ?
                  </div>
                  
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
                    <input
                      type="number"
                      value={raceAnswer}
                      onChange={e => setRaceAnswer(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleRaceAnswer()}
                      placeholder="Your answer"
                      style={{ width: 120, height: 50, fontSize: 20, textAlign: 'center', borderRadius: 8, border: '2px solid #667eea' }}
                    />
                    <button type="button" style={ui.btnPrimary} onClick={handleRaceAnswer}>
                      Submit
                    </button>
                  </div>

                  {/* Race Track */}
                  <div style={{ position: 'relative', height: 150, background: 'linear-gradient(to bottom, #e3f2fd 0%, #90caf9 100%)', borderRadius: 12, overflow: 'hidden', marginTop: 16 }}>
                    {/* Finish Line */}
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 30, background: 'repeating-linear-gradient(45deg, #000, #000 10px, #fff 10px, #fff 20px)' }}></div>
                    
                    {/* Player */}
                    <div style={{ position: 'absolute', left: `${racePosition}%`, top: 30, transition: 'left 500ms', fontSize: 40 }}>
                      🏃‍♂️
                    </div>
                    
                    {/* Bot */}
                    <div style={{ position: 'absolute', left: `${botPosition}%`, top: 90, transition: 'left 500ms', fontSize: 40 }}>
                      🤖
                    </div>
                  </div>
                </div>
              )}

              {raceWon && (
                <div style={{ marginTop: 16, padding: 20, background: 'linear-gradient(135deg, #ffd166 0%, #ff9f1c 100%)', borderRadius: 12, textAlign: 'center' }}>
                  <h2>🏆 You Won the Race, {firstName}!</h2>
                  <p style={{ fontSize: 18 }}>You're a math champion! 🎉</p>
                </div>
              )}
            </div>

            {/* 7. Real-World Scenarios */}
            <div style={ui.card}>
              <h2>🌍 Real-World Math</h2>
              <p>Solve real problems that you might face every day!</p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {Object.keys(realWorldScenarios).map(key => (
                  <button
                    key={key}
                    onClick={() => { setRealWorldScenario(key); setRealWorldCode(''); setRealWorldResult(''); }}
                    style={{
                      ...ui.btnSecondary,
                      background: realWorldScenario === key ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
                      color: realWorldScenario === key ? '#fff' : '#495057'
                    }}
                  >
                    {realWorldScenarios[key].title}
                  </button>
                ))}
              </div>

              <div style={{ padding: 16, background: '#f0f4ff', borderRadius: 12, marginBottom: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8 }}>{realWorldScenarios[realWorldScenario].title}</strong>
                <p style={{ fontSize: 16, lineHeight: 1.6 }}>{realWorldScenarios[realWorldScenario].problem}</p>
              </div>

              <textarea
                value={realWorldCode}
                onChange={e => setRealWorldCode(e.target.value)}
                placeholder='Write Python code to solve this problem...'
                style={{ width: '100%', minHeight: 80, fontFamily: 'monospace', borderRadius: 12, border: '2px solid #e9ecef', padding: 12, fontSize: 14 }}
              />

              <button type="button" style={{ ...ui.btnPrimary, marginTop: 12 }} onClick={handleRealWorldSubmit}>
                ▶ Check Solution
              </button>

              {realWorldResult && (
                <div style={{ marginTop: 12, padding: 12, background: realWorldResult.includes('✅') ? 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' : '#fff3bf', borderRadius: 12 }}>
                  {realWorldResult}
                </div>
              )}
            </div>

            {/* Python Editor */}
            <div style={ui.card}>
              <h2>💻 Free Code Playground</h2>
              <p>Try any math operations you want!</p>
              <PythonEditor
                initialCode='print(5 + 3)\nprint(10 - 2)\nprint(4 * 2)\nprint(16 / 4)'
                onOutput={handleCodeOutput}
              />
            </div>
          </div>

          {/* Badges */}
          {lessonProgress.achievements && lessonProgress.achievements.length > 0 && (
            <div style={{ marginTop: 20, padding: 20, background: '#f8f9fa', borderRadius: 12 }}>
              <h3>🏅 Your Badges</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
                {lessonProgress.achievements.map(badge => (
                  <div key={badge.id} style={{ padding: '10px 14px', background: '#fff', border: '2px solid #667eea', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {badge.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          <footer className="lesson-footer">
            <button
              type="button"
              className="quiz-button"
              onClick={goToQuiz}
              style={{
                backgroundColor: isLessonEligibleForCompletion() ? '#4ecca3' : '#cccccc',
                cursor: isLessonEligibleForCompletion() ? 'pointer' : 'not-allowed'
              }}
            >
              {isLessonEligibleForCompletion() ? 'Ready for Quiz 3 🍍' : `Complete 3 games (${lessonProgress.gamesCompleted.length}/3)`}
            </button>
          </footer>
        </section>
        </div>
      </div>
    </div>
  );
};

export default Lesson3Interactive;

