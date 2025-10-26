# Authentication Setup for Robot Puzzle Games

## Overview
The robot-puzzle project now uses the same authentication system as the main gamified-elearning application. This allows puzzle game completions to be tracked and XP/rewards to be awarded to logged-in users.

## How It Works

### 1. Authentication Flow
- Users log in via the main app (gamified-elearning on `localhost:3000`)
- When navigating to a puzzle game, the auth token is passed to the robot-puzzle app (`localhost:3001`)
- The robot-puzzle app validates the token and loads the user session
- All puzzle completions are tracked in the backend database with the authenticated user's ID

### 2. Navigation from Main App to Puzzle Games

Use the utility function in `gamified-elearning/src/utils/puzzleNavigation.js`:

```javascript
import { navigateToPuzzle } from '../utils/puzzleNavigation';

// Navigate to a specific puzzle game
navigateToPuzzle('talking-robot');  // or 'apple', 'math', 'condition', 'loop'
```

### 3. Puzzle Game Routes
- Talking Robot: `/puzzle`
- Apple Game: `/apple-game`
- Math Game: `/math-game`
- Condition Game: `/condition-game`
- Loop Game: `/loop-game`

### 4. Auth Token Storage
The authentication token is stored in multiple places for reliability:
- `localStorage` - persistent storage
- `sessionStorage` - cross-port access
- URL parameters - fallback method

### 5. Protected Routes
All puzzle game routes are protected with `AuthGuard` component:
- If user is not authenticated, they are redirected to the main app login page
- Shows loading screen while checking authentication status

## Backend Integration

### XP & Rewards System
The `progressTracker.js` utility handles all backend communication:

```javascript
import { 
  trackPuzzleGameCompletion, 
  showXPNotification 
} from '../utils/progressTracker';

// Track puzzle completion
const result = await trackPuzzleGameCompletion(
  lessonNumber,    // e.g., 1, 2, 3, 4, 5
  gameType,        // e.g., 'talking-robot', 'apple-game', etc.
  score,           // 0-100
  timeSpent        // in seconds
);

// Show XP notification to user
showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
```

### Backend Endpoint
- **Endpoint**: `POST http://localhost:8080/api/rewards/game-complete`
- **Authentication**: Requires JWT token in `Authorization: Bearer <token>` header
- **Request Body**:
  ```json
  {
    "lessonId": 1,
    "gameType": "talking-robot",
    "score": 100,
    "isHighScore": true,
    "attempts": 1,
    "completionTime": 120
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "xpEarned": 75,
    "baseXP": 50,
    "bonusXP": 25,
    "message": "Game completed successfully"
  }
  ```

## Database Tables

### Game_Progress
Tracks puzzle game completions:
- `student_id` - User ID (from JWT token)
- `lesson_id` - Lesson number (1-5)
- `game_type` - Type of puzzle game
- `score` - Score achieved
- `completion_time` - Time taken (seconds)
- `attempts` - Number of attempts
- `completed` - Boolean flag
- `best_score` - Highest score achieved
- `xp_earned` - Total XP earned
- `played_at` - Timestamp

### Students
Updated when XP is earned:
- `total_xp` - Lifetime XP
- `weekly_xp` - Current week XP
- `monthly_xp` - Current month XP
- `last_activity` - Last activity timestamp

### XP_Transactions
Logs all XP gains:
- `student_id` - User ID
- `activity_type` - 'game'
- `xp_earned` - Amount of XP
- `earned_at` - Timestamp

## Development Setup

### 1. Start Backend Server
```bash
cd codeit-backend
npm start  # Runs on port 8080
```

### 2. Start Main App
```bash
cd gamified-elearning
npm start  # Runs on port 3000
```

### 3. Start Puzzle App
```bash
cd robot-puzzle
npm start  # Runs on port 3001
```

## Testing Authentication

1. Log in to the main app at `http://localhost:3000/login`
2. Navigate to a lesson page
3. Click on the puzzle game link (should use `navigateToPuzzle()` utility)
4. Verify you're authenticated in the puzzle app (no redirect to login)
5. Complete a puzzle game
6. Check browser console for XP notification logs
7. Verify XP is updated in the database

## Troubleshooting

### "No authenticated user found" Error
- Check if localStorage has `user` and `token` items
- Verify the token hasn't expired (1 hour expiry)
- Try logging in again

### "Access denied. No token provided" Error
- Token is not being sent in the Authorization header
- Check `progressTracker.js` axios interceptor
- Verify token exists in localStorage

### CORS Errors
- Ensure backend has CORS enabled for both ports 3000 and 3001
- Check `codeit-backend` CORS configuration

### Database Connection Errors
- Verify database credentials in `codeit-backend/db.js`
- Check if RDS instance is accessible
- Verify user has necessary permissions on database tables

## Security Notes
- JWT tokens expire after 1 hour
- Tokens are stored in localStorage (vulnerable to XSS)
- In production, consider using HTTP-only cookies
- Always use HTTPS in production
- Never commit JWT_SECRET to version control

