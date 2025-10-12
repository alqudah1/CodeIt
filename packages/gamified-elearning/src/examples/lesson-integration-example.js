// Example of how to integrate progress tracking into your static lesson pages
// This shows how to add tracking to your existing lesson pages

import { 
  trackStaticLessonCompletion, 
  trackPuzzleGameCompletion, 
  showXPNotification, 
  initializeTimeTracker,
  autoTrackDailyLogin 
} from '../utils/progressTracker';

// Example for Lesson 1 page
export class Lesson1Tracker {
  constructor() {
    this.timeTracker = initializeTimeTracker();
    this.lessonNumber = 1;
    this.init();
  }

  init() {
    // Auto-track daily login when page loads
    autoTrackDailyLogin();
    
    // Track when user starts the lesson
    this.trackLessonStart();
    
    // Set up completion tracking
    this.setupCompletionTracking();
  }

  trackLessonStart() {
    // You can add any start tracking logic here
    console.log('Lesson 1 started');
  }

  setupCompletionTracking() {
    // Add a completion button or detect when lesson is finished
    // This could be triggered by:
    // 1. User clicking a "Complete Lesson" button
    // 2. Reaching the end of the lesson content
    // 3. Spending a certain amount of time on the page
    
    // Example: Add a completion button
    this.addCompletionButton();
    
    // Example: Auto-complete after 5 minutes
    setTimeout(() => {
      this.autoCompleteLesson();
    }, 300000); // 5 minutes
  }

  addCompletionButton() {
    const button = document.createElement('button');
    button.textContent = 'Complete Lesson';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4ecca3;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1000;
    `;
    
    button.addEventListener('click', () => {
      this.completeLesson();
    });
    
    document.body.appendChild(button);
  }

  async completeLesson() {
    try {
      const timeSpent = this.timeTracker.getTimeSpent();
      
      const result = await trackStaticLessonCompletion(this.lessonNumber, timeSpent);
      
      // Show XP notification
      showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
      
      // Show completion message
      this.showCompletionMessage(result);
      
    } catch (error) {
      console.error('Error completing lesson:', error);
      alert('Error tracking lesson completion. Please try again.');
    }
  }

  autoCompleteLesson() {
    // Auto-complete if user has been on page for 5 minutes
    if (this.timeTracker.isActive) {
      this.completeLesson();
    }
  }

  showCompletionMessage(result) {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      text-align: center;
      z-index: 10000;
      max-width: 400px;
    `;
    
    message.innerHTML = `
      <h2 style="color: #4ecca3; margin-bottom: 15px;">Lesson Completed! 🎉</h2>
      <p style="font-size: 18px; margin-bottom: 10px;">You earned <strong>${result.xpEarned} XP</strong>!</p>
      ${result.bonusXP > 0 ? `<p style="color: #2e9c81;">+${result.bonusXP} bonus XP for perfect completion!</p>` : ''}
      <button onclick="this.parentElement.remove(); window.location.href='/quiz/1'" 
              style="background: #4ecca3; color: white; border: none; padding: 10px 20px; border-radius: 6px; margin-top: 15px; cursor: pointer;">
        Take Quiz
      </button>
    `;
    
    document.body.appendChild(message);
  }
}

// Example for Game/Puzzle completion
export class PuzzleGameTracker {
  constructor(lessonNumber, gameType) {
    this.lessonNumber = lessonNumber;
    this.gameType = gameType;
    this.timeTracker = initializeTimeTracker();
  }

  async completeGame(score) {
    try {
      const timeSpent = this.timeTracker.getTimeSpent();
      
      const result = await trackPuzzleGameCompletion(
        this.lessonNumber, 
        this.gameType, 
        score, 
        timeSpent
      );
      
      // Show XP notification
      showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
      
      return result;
      
    } catch (error) {
      console.error('Error completing game:', error);
      throw error;
    }
  }
}

// Example usage in your lesson pages:

// For Lesson 1 page (add this to your lesson HTML/JS):
/*
<script type="module">
  import { Lesson1Tracker } from './examples/lesson-integration-example.js';
  
  // Initialize tracking when page loads
  const tracker = new Lesson1Tracker();
</script>
*/

// For puzzle games (add this to your game pages):
/*
<script type="module">
  import { PuzzleGameTracker } from './examples/lesson-integration-example.js';
  
  // Initialize tracking
  const gameTracker = new PuzzleGameTracker(1, 'robot-puzzle');
  
  // When game is completed with a score
  function onGameComplete(score) {
    gameTracker.completeGame(score)
      .then(result => {
        console.log('Game completed:', result);
        // Redirect to next page or show completion screen
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
</script>
*/

// Example for your vertical platformer game:
export class PlatformerTracker {
  constructor() {
    this.lessonNumber = null; // Will be set when player reaches a platform
    this.timeTracker = initializeTimeTracker();
  }

  onLevelReached(levelNumber) {
    this.lessonNumber = levelNumber;
    console.log(`Reached level ${levelNumber} - lesson ${levelNumber}`);
  }

  async completeLevel() {
    if (!this.lessonNumber) return;
    
    try {
      const timeSpent = this.timeTracker.getTimeSpent();
      
      const result = await trackStaticLessonCompletion(this.lessonNumber, timeSpent);
      
      // Show XP notification
      showXPNotification(result.xpEarned, result.baseXP, result.bonusXP);
      
      // Redirect to lesson page
      window.location.href = `/lesson/${this.lessonNumber}`;
      
    } catch (error) {
      console.error('Error completing level:', error);
    }
  }
}

// Add this to your vertical platformer game:
/*
// In your platformer game code, when player reaches a platform:
const platformerTracker = new PlatformerTracker();

// When player reaches a platform (in your collision detection):
if (player.reachedPlatform) {
  const levelNumber = platform.level; // Get level from platform
  platformerTracker.onLevelReached(levelNumber);
  
  // Show level completion UI
  showLevelCompletionUI(levelNumber);
}

function showLevelCompletionUI(levelNumber) {
  // Show UI with "Go to Lesson" button
  const ui = document.createElement('div');
  ui.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: white; padding: 20px; border-radius: 8px; text-align: center;">
      <h2>Level ${levelNumber} Reached!</h2>
      <p>Ready to learn?</p>
      <button onclick="platformerTracker.completeLevel()">Go to Lesson ${levelNumber}</button>
    </div>
  `;
  document.body.appendChild(ui);
}
*/

export default {
  Lesson1Tracker,
  PuzzleGameTracker,
  PlatformerTracker,
};

