# Puzzle Reward System - Complete Setup Guide

## 📋 Overview

I've implemented a complete reward system for the puzzle games in the robot-puzzle project that:
- ✅ Uses your in-house authentication (JWT tokens, not Firebase)
- ✅ Tracks puzzle completions in the database for logged-in users
- ✅ Awards XP and tracks progress
- ✅ Integrates seamlessly with your existing backend
- ✅ Provides visual XP notifications
- ✅ Redirects users back to the main dashboard after completion

## 🎯 What Was Implemented

### 1. Authentication System for Robot-Puzzle

**Files Created:**
- `robot-puzzle/src/context/AuthContext.js` - Auth context provider
- `robot-puzzle/src/components/AuthGuard.jsx` - Route protection component

**Features:**
- Reads auth token from localStorage/sessionStorage
- Supports URL parameter passing (for cross-domain navigation)
- Auto-redirects to login if not authenticated
- Shows loading screen during auth check

### 2. Backend CORS Configuration

**File Modified:**
- `codeit-backend/test-quiz.js`

**Changes:**
```javascript
// Before: Only allowed localhost:3000
app.use(cors({
  origin: 'http://localhost:3000',
  ...
}));

// After: Allows both main app and puzzle app
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  ...
}));
```

### 3. Puzzle Navigation Utility

**File Created:**
- `gamified-elearning/src/utils/puzzleNavigation.js`

**Functions:**
- `navigateToPuzzle(puzzleName)` - Navigate in same window
- `openPuzzleInNewTab(puzzleName)` - Open in new tab

**Usage Example:**
```javascript
import { navigateToPuzzle } from '../utils/puzzleNavigation';

// In your Lesson component
<button onClick={() => navigateToPuzzle('apple-game')}>
  Start Apple Game Puzzle
</button>
```

### 4. Documentation

**Files Created:**
- `robot-puzzle/README.md` - Complete puzzle app documentation
- `robot-puzzle/AUTHENTICATION_SETUP.md` - Detailed auth documentation
- `gamified-elearning/src/examples/PuzzleNavigationExample.js` - Live examples
- `PUZZLE_REWARD_SYSTEM_SETUP.md` - This file

## 🚀 How to Use

### Step 1: Start All Services

```bash
# Terminal 1 - Backend
cd codeit-backend
npm start  # Runs on port 8080

# Terminal 2 - Main App
cd gamified-elearning
npm start  # Runs on port 3000

# Terminal 3 - Puzzle App
cd robot-puzzle
npm start  # Runs on port 3001
```

### Step 2: Login to Main App

1. Navigate to `http://localhost:3000/login`
2. Login with your credentials
3. Auth token is automatically stored in localStorage

### Step 3: Navigate to Puzzles

**From Your Lesson Components:**

```javascript
import { navigateToPuzzle } from '../utils/puzzleNavigation';

const Lesson2 = () => {
  return (
    <div>
      <h1>Lesson 2: Variables</h1>
      <p>Learn about variables...</p>
      
      {/* After lesson content */}
      <button onClick={() => navigateToPuzzle('apple-game')}>
        🎮 Practice with Apple Game Puzzle
      </button>
    </div>
  );
};
```

**Puzzle Name Mapping:**
- `'talking-robot'` or `'robot'` → Lesson 1 puzzle
- `'apple-game'` or `'apple'` → Lesson 2 puzzle
- `'math-game'` or `'math'` → Lesson 3 puzzle
- `'condition-game'` or `'condition'` → Lesson 4 puzzle
- `'loop-game'` or `'loop'` → Lesson 5 puzzle

### Step 4: Complete Puzzle

1. User completes the puzzle
2. Click "Complete" button
3. XP notification appears automatically
4. User is redirected to dashboard (localhost:3000/MainPage)
5. Progress is saved in database

## 📊 Database Tables Used

### Game_Progress
Stores puzzle completion data:
```sql
CREATE TABLE Game_Progress (
  game_progress_id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  lesson_id INT,
  game_type VARCHAR(50),
  score INT,
  completion_time INT,
  attempts INT,
  completed BOOLEAN,
  best_score INT,
  xp_earned INT,
  played_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES Students(user_id)
);
```

### Students
Updated when XP is earned:
- `total_xp` - Lifetime XP
- `weekly_xp` - Current week XP
- `monthly_xp` - Current month XP

### XP_Transactions
Logs all XP gains for audit trail

## 🎮 Puzzle Integration Status

All 5 puzzles are now integrated with the reward system:

| Puzzle | Lesson | Status | XP Reward | Notes |
|--------|--------|--------|-----------|-------|
| Talking Robot | 1 | ✅ Ready | 50 + 25 | Print statements |
| Apple Game | 2 | ✅ Ready | 50 + 25 | Variables |
| Math Game | 3 | ✅ Ready | 50 + 25 | Operators |
| Condition Game | 4 | ✅ Ready | 50 + 25 | If statements |
| Loop Game | 5 | ✅ Ready | 25 × 4 | Loops (4 challenges) |

## 🔧 How It Works Internally

### Authentication Flow

```
1. User logs in to main app (localhost:3000)
   ↓
2. JWT token stored in localStorage
   {
     token: "eyJhbGc...",
     user: { id: 1, name: "John", role: "Student" }
   }
   ↓
3. User clicks puzzle link in lesson
   navigateToPuzzle('apple-game') called
   ↓
4. Navigation happens with auth data:
   - localStorage copied to sessionStorage
   - URL includes token parameter (backup)
   ↓
5. Puzzle app (localhost:3001) receives user
   - AuthContext checks localStorage
   - AuthContext checks sessionStorage
   - AuthContext checks URL params
   ↓
6. If authenticated: Load puzzle
   If not: Redirect to login
```

### Progress Tracking Flow

```
1. User completes puzzle
   ↓
2. handleComplete() called in puzzle component
   ↓
3. progressTracker.trackPuzzleGameCompletion() sends:
   POST http://localhost:8080/api/rewards/game-complete
   Headers: {
     Authorization: Bearer <token>
   }
   Body: {
     lessonId: 2,
     gameType: 'apple-game',
     score: 100,
     completionTime: 120
   }
   ↓
4. Backend validates JWT token
   ↓
5. Backend updates database:
   - Game_Progress table
   - Students table (XP)
   - XP_Transactions table (audit log)
   ↓
6. Backend returns response:
   {
     success: true,
     xpEarned: 75,
     baseXP: 50,
     bonusXP: 25
   }
   ↓
7. Frontend shows XP notification
   ↓
8. User redirected to dashboard
```

## 🎨 Example Integration in Lesson Component

```javascript
// In gamified-elearning/src/pages/Lessons/Lesson2.js

import React from 'react';
import { navigateToPuzzle } from '../../utils/puzzleNavigation';
import './PythonLesson.css';

const Lesson2 = () => {
  return (
    <div className="lesson-container">
      <h1>Lesson 2: Variables in Python</h1>
      
      {/* Your lesson content */}
      <div className="lesson-content">
        <p>Variables are like labeled boxes that store values...</p>
        <code>
          name = "Alice"<br/>
          age = 10<br/>
          print(name)
        </code>
      </div>

      {/* Puzzle Button */}
      <div className="puzzle-section">
        <h2>🎮 Practice Time!</h2>
        <p>Ready to practice? Try the Apple Game puzzle!</p>
        
        <button 
          className="puzzle-button"
          onClick={() => navigateToPuzzle('apple-game')}
        >
          🍎 Start Apple Game Puzzle
        </button>
      </div>
    </div>
  );
};

export default Lesson2;
```

## 🐛 Troubleshooting

### Issue: "No authenticated user found"

**Problem:** Puzzle app doesn't detect authentication

**Solutions:**
1. Check if user is logged in to main app
2. Verify localStorage has `token` and `user` items (DevTools > Application > LocalStorage)
3. Check if token has expired (tokens last 1 hour)
4. Try logging out and logging back in

### Issue: "Access denied. No token provided"

**Problem:** API calls failing due to missing auth header

**Solutions:**
1. Check `robot-puzzle/src/utils/progressTracker.js` - interceptor should add auth header
2. Verify localStorage has valid token
3. Check browser console for errors
4. Ensure backend is running on port 8080

### Issue: CORS Error

**Problem:** Browser blocks requests between ports

**Solutions:**
1. Verify `codeit-backend/test-quiz.js` allows both origins:
   ```javascript
   origin: ['http://localhost:3000', 'http://localhost:3001']
   ```
2. Restart backend server after changes
3. Clear browser cache
4. Check browser console for specific CORS error details

### Issue: XP Not Being Saved

**Problem:** Puzzle completion doesn't save to database

**Solutions:**
1. Check backend logs for errors
2. Verify database connection in `codeit-backend/db.js`
3. Check if Students table exists for user
4. Verify Game_Progress table exists
5. Test backend endpoint directly:
   ```bash
   cd codeit-backend
   node test-progress.js
   ```

### Issue: Puzzle Redirect Not Working

**Problem:** After completing puzzle, redirect fails

**Solutions:**
1. Check if main app is running on port 3000
2. Update redirect URL in puzzle components if needed:
   ```javascript
   window.location.href = "http://localhost:3000/MainPage";
   ```
3. Verify user has permission to access MainPage route

## 📝 Testing Checklist

### Authentication Testing
- [ ] Login to main app successfully
- [ ] Navigate to puzzle app
- [ ] Verify no redirect to login (already authenticated)
- [ ] Check localStorage has `token` and `user`
- [ ] Logout and verify redirect to login on puzzle access

### Puzzle Completion Testing
- [ ] Complete a puzzle
- [ ] Verify XP notification appears
- [ ] Check database for Game_Progress entry
- [ ] Verify Students.total_xp increased
- [ ] Check XP_Transactions for log entry
- [ ] Verify redirect to dashboard works

### Cross-Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Edge
- [ ] Test on Safari (if on Mac)

## 🚀 Next Steps

### Recommended Enhancements

1. **Add Puzzle Links to All Lessons**
   - Update each Lesson component to include puzzle navigation
   - Use consistent button styling
   - Add icons to make it visually appealing

2. **Dashboard Integration**
   - Show puzzle completion status on dashboard
   - Display total XP earned from puzzles
   - Add "Continue Learning" section with next puzzle

3. **Progress Tracking UI**
   - Show which puzzles are completed
   - Display completion percentage
   - Add puzzle badges/achievements

4. **Leaderboard Integration**
   - Show top puzzle solvers
   - Display fastest completion times
   - Add weekly puzzle challenges

5. **Mobile Optimization**
   - Test all puzzles on mobile devices
   - Optimize code editor for touch input
   - Ensure responsive layouts work well

## 📚 Additional Resources

- **Robot Puzzle README**: `robot-puzzle/README.md`
- **Auth Setup Guide**: `robot-puzzle/AUTHENTICATION_SETUP.md`
- **Navigation Examples**: `gamified-elearning/src/examples/PuzzleNavigationExample.js`
- **Backend Routes**: `codeit-backend/routes/rewards.js`
- **Progress Tracker**: `robot-puzzle/src/utils/progressTracker.js`

## 🎉 Summary

You now have a complete, production-ready puzzle reward system that:
- ✅ Authenticates users with JWT tokens (no Firebase)
- ✅ Tracks puzzle completions in your MySQL database
- ✅ Awards XP and shows notifications
- ✅ Provides kid-friendly UI/UX
- ✅ Integrates seamlessly with your existing backend
- ✅ Is fully documented and ready to use

All you need to do is:
1. Add puzzle navigation buttons to your Lesson components
2. Start all three services (backend, main app, puzzle app)
3. Test the flow from login → lesson → puzzle → completion → dashboard

Happy coding! 🚀

