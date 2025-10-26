# Robot Puzzle Games - E-Learning Platform

Interactive puzzle games for learning Python programming concepts through hands-on coding challenges.

## 🎮 Puzzle Games

### 1. Talking Robot (Lesson 1: Print Statements)
- **Route**: `/puzzle`
- **Concept**: Learn the `print()` function
- **Challenge**: Write code to make the robot say "Hello! My name is Robo."
- **XP Reward**: 50 base XP + 25 bonus XP

### 2. Apple Game (Lesson 2: Variables)
- **Route**: `/apple-game`
- **Concept**: Learn about variables and coordinates
- **Challenge**: Position apples on a canvas using variable assignments
- **XP Reward**: 50 base XP + 25 bonus XP

### 3. Math Game (Lesson 3: Arithmetic Operators)
- **Route**: `/math-game`
- **Concept**: Master arithmetic operations (+, -, *, /)
- **Challenge**: Solve math expressions to collect gems
- **XP Reward**: 50 base XP + 25 bonus XP

### 4. Condition Game (Lesson 4: If Statements)
- **Route**: `/condition-game`
- **Concept**: Learn conditional logic with if statements
- **Challenge**: Write an if statement with print to open a door
- **XP Reward**: 50 base XP + 25 bonus XP

### 5. Loop Game (Lesson 5: Loops)
- **Route**: `/loop-game`
- **Concept**: Master for and while loops
- **Challenge**: Complete 4 loop challenges (collect stars, count steps, reach treasure, countdown)
- **XP Reward**: 25 XP per challenge (100 total)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Running backend server (codeit-backend on port 8080)
- User authentication from main app (gamified-elearning)

### Installation
```bash
cd robot-puzzle
npm install
```

### Running the App
```bash
npm start
```
The app will start on `http://localhost:3001`

## 🔐 Authentication

### How It Works
1. Users authenticate via the main app (gamified-elearning)
2. Auth token is stored in localStorage
3. When navigating to puzzle games, the token is automatically passed
4. All routes are protected with AuthGuard component
5. Unauthenticated users are redirected to the login page

### Auth Flow
```
Main App Login → Token Stored → Navigate to Puzzle → Auth Verified → Game Loads
```

### Manual Testing
If testing without the main app:
1. Login to main app (localhost:3000)
2. Open browser DevTools > Application > LocalStorage
3. Copy the `token` and `user` values
4. Paste them into robot-puzzle's LocalStorage
5. Refresh the page

## 📊 Progress Tracking

### XP Rewards System
- **Base XP**: 50 per puzzle completion
- **Bonus XP**: 25 for high scores/perfect completion
- **Total Possible**: 375 XP from all puzzles

### Tracked Metrics
- Lesson ID (1-5)
- Game type (puzzle name)
- Score (0-100)
- Completion time (seconds)
- Number of attempts
- Best score achieved

### Backend Integration
All puzzle completions are tracked via:
```
POST http://localhost:8080/api/rewards/game-complete
```

See `AUTHENTICATION_SETUP.md` for detailed backend documentation.

## 🎨 UI/UX Features

### Modern Design
- Colorful gradient backgrounds
- Split-screen layouts (code editor + game preview)
- Responsive design for all screen sizes
- Smooth animations and transitions

### Kid-Friendly Features
- Step-by-step instructions for each challenge
- Visual expected output examples
- "Code Starter" button for templates
- "Show Solution" button when stuck
- Real-time code validation with helpful error messages
- Progress tracking with visual indicators

### Accessibility
- Clear, large fonts
- High contrast colors
- Intuitive button designs
- Loading states
- Error messages in plain language

## 🛠️ Development

### Project Structure
```
robot-puzzle/
├── src/
│   ├── components/
│   │   ├── TalkingRobot.jsx          # Lesson 1 puzzle
│   │   ├── AppleGame.jsx             # Lesson 2 puzzle
│   │   ├── MathGame.jsx              # Lesson 3 puzzle
│   │   ├── ConditionGame.jsx         # Lesson 4 puzzle
│   │   ├── LoopGame.jsx              # Lesson 5 puzzle
│   │   ├── ProgressBar.jsx           # Lesson/Quiz/Puzzle progress
│   │   ├── AuthGuard.jsx             # Route protection
│   │   └── *.css                     # Component styles
│   ├── context/
│   │   └── AuthContext.js            # Authentication context
│   ├── utils/
│   │   └── progressTracker.js        # Backend API calls
│   ├── App.js                        # Main app component
│   └── index.js                      # App entry point
├── public/
├── package.json
└── README.md
```

### Adding a New Puzzle

1. **Create Component**:
```jsx
import React, { useState } from 'react';
import ProgressBar from './ProgressBar';
import { trackPuzzleGameCompletion, showXPNotification, initializeTimeTracker } from '../utils/progressTracker';

const MyNewPuzzle = () => {
  const [timeTracker] = useState(() => initializeTimeTracker());
  const [isCompleted, setIsCompleted] = useState(false);
  
  const handleComplete = async () => {
    const timeSpent = timeTracker.getTimeSpent();
    const result = await trackPuzzleGameCompletion(
      6,              // New lesson number
      'my-new-puzzle', // Unique game type
      100,            // Score
      timeSpent
    );
    showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
    setIsCompleted(true);
  };
  
  return (
    <div className="my-puzzle-page">
      <ProgressBar currentStep="puzzle" />
      {/* Your puzzle UI */}
    </div>
  );
};

export default MyNewPuzzle;
```

2. **Add Route** in `App.js`:
```jsx
<Route path="/my-new-puzzle" element={<AuthGuard><MyNewPuzzle /></AuthGuard>} />
```

3. **Add Navigation** in main app (gamified-elearning):
```jsx
import { navigateToPuzzle } from '../utils/puzzleNavigation';

<button onClick={() => navigateToPuzzle('my-new-puzzle')}>
  Start My New Puzzle
</button>
```

### Styling Guidelines
- Use CSS modules or component-scoped CSS files
- Follow existing naming conventions (`.puzzle-name-page`, `.puzzle-name-main-container`, etc.)
- Use CSS variables for consistent theming
- Ensure mobile responsiveness with media queries
- Test on multiple screen sizes

## 🐛 Debugging

### Common Issues

**Puzzle not loading:**
- Check if backend is running (port 8080)
- Verify auth token exists in localStorage
- Check browser console for errors

**XP not being tracked:**
- Ensure user is authenticated
- Check network tab for API calls
- Verify backend database connection
- Look for errors in backend logs

**CORS errors:**
- Verify backend allows origin `http://localhost:3001`
- Check CORS configuration in `codeit-backend/test-quiz.js`

### Debug Mode
Enable console logging:
```javascript
localStorage.setItem('debug', 'true');
```

## 📝 Testing

### Manual Testing Checklist
- [ ] User can load puzzle page
- [ ] Authentication is verified
- [ ] Code editor accepts input
- [ ] Code validation works correctly
- [ ] Error messages are clear
- [ ] Success state is displayed
- [ ] Complete button appears when appropriate
- [ ] XP notification is shown
- [ ] Progress is saved to database
- [ ] User is redirected to dashboard

### API Testing
Use the test files in codeit-backend:
```bash
cd codeit-backend
node test-progress.js
```

## 🚢 Deployment

### Environment Variables
Create `.env` file:
```
REACT_APP_API_URL=https://your-backend-api.com/api
REACT_APP_MAIN_APP_URL=https://your-main-app.com
```

### Production Build
```bash
npm run build
```

### Deployment Considerations
- Serve on same domain as main app (use subdomain or path)
- Use HTTPS
- Configure CORS for production URLs
- Set up proper JWT token expiration
- Consider using HTTP-only cookies instead of localStorage
- Implement rate limiting on backend APIs

## 📚 Additional Documentation
- See `AUTHENTICATION_SETUP.md` for detailed auth documentation
- Check `gamified-elearning/src/examples/PuzzleNavigationExample.js` for integration examples
- Review backend API documentation in `codeit-backend` folder

## 🤝 Contributing
When adding new puzzles or features:
1. Follow existing code structure
2. Maintain kid-friendly UX patterns
3. Include step-by-step instructions
4. Provide code starters and solutions
5. Test thoroughly with actual kids if possible
6. Document your changes

## 📄 License
Part of the CodeIt E-Learning Platform

## 🎯 Future Improvements
- [ ] Add more puzzle variations
- [ ] Implement puzzle difficulty levels
- [ ] Add multiplayer/collaborative puzzles
- [ ] Include visual programming blocks
- [ ] Add voice instructions for younger kids
- [ ] Implement puzzle creation tool for teachers
- [ ] Add achievement badges for puzzle mastery
- [ ] Create puzzle leaderboards
