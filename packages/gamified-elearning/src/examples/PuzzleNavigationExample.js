import React from 'react';
import { navigateToPuzzle, openPuzzleInNewTab } from '../utils/puzzleNavigation';

/**
 * Example component showing how to navigate to puzzle games from the main app
 * 
 * Use this pattern in your Lesson components to link to the corresponding puzzle games
 */
const PuzzleNavigationExample = () => {
  
  const handleNavigateToPuzzle = (puzzleName) => {
    // This will navigate to the puzzle in the same window
    navigateToPuzzle(puzzleName);
  };

  const handleOpenPuzzleNewTab = (puzzleName) => {
    // This will open the puzzle in a new tab
    openPuzzleInNewTab(puzzleName);
  };

  return (
    <div style={{ padding: '40px' }}>
      <h1>Puzzle Navigation Example</h1>
      <p>Click any button to navigate to the corresponding puzzle game</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
        
        {/* Lesson 1 - Talking Robot (Print Statement) */}
        <div style={{ 
          padding: '20px', 
          border: '2px solid #667eea', 
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
        }}>
          <h3>Lesson 1: Print Statement Puzzle</h3>
          <p>Practice using the print() function to make the robot talk!</p>
          <button 
            onClick={() => handleNavigateToPuzzle('talking-robot')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Start Puzzle (Same Window)
          </button>
          <button 
            onClick={() => handleOpenPuzzleNewTab('talking-robot')}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Start Puzzle (New Tab)
          </button>
        </div>

        {/* Lesson 2 - Apple Game (Variables) */}
        <div style={{ 
          padding: '20px', 
          border: '2px solid #4ecca3', 
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(78, 204, 163, 0.1) 0%, rgba(46, 156, 129, 0.1) 100%)'
        }}>
          <h3>Lesson 2: Variables Puzzle</h3>
          <p>Learn about variables by positioning apples on a canvas!</p>
          <button 
            onClick={() => handleNavigateToPuzzle('apple-game')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4ecca3 0%, #2e9c81 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Start Puzzle (Same Window)
          </button>
          <button 
            onClick={() => handleOpenPuzzleNewTab('apple-game')}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#4ecca3',
              border: '2px solid #4ecca3',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Start Puzzle (New Tab)
          </button>
        </div>

        {/* Lesson 3 - Math Game (Operators) */}
        <div style={{ 
          padding: '20px', 
          border: '2px solid #fbbf24', 
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)'
        }}>
          <h3>Lesson 3: Math Operators Puzzle</h3>
          <p>Practice arithmetic operations with an interactive math game!</p>
          <button 
            onClick={() => handleNavigateToPuzzle('math-game')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Start Puzzle (Same Window)
          </button>
          <button 
            onClick={() => handleOpenPuzzleNewTab('math-game')}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#fbbf24',
              border: '2px solid #fbbf24',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Start Puzzle (New Tab)
          </button>
        </div>

        {/* Lesson 4 - Condition Game (If Statements) */}
        <div style={{ 
          padding: '20px', 
          border: '2px solid #f472b6', 
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(244, 114, 182, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)'
        }}>
          <h3>Lesson 4: Conditional Logic Puzzle</h3>
          <p>Learn if statements by helping a robot open a door!</p>
          <button 
            onClick={() => handleNavigateToPuzzle('condition-game')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Start Puzzle (Same Window)
          </button>
          <button 
            onClick={() => handleOpenPuzzleNewTab('condition-game')}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#f472b6',
              border: '2px solid #f472b6',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Start Puzzle (New Tab)
          </button>
        </div>

        {/* Lesson 5 - Loop Game (Loops) */}
        <div style={{ 
          padding: '20px', 
          border: '2px solid #60a5fa', 
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
        }}>
          <h3>Lesson 5: Loops Puzzle</h3>
          <p>Master for and while loops through interactive challenges!</p>
          <button 
            onClick={() => handleNavigateToPuzzle('loop-game')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Start Puzzle (Same Window)
          </button>
          <button 
            onClick={() => handleOpenPuzzleNewTab('loop-game')}
            style={{
              padding: '12px 24px',
              background: 'white',
              color: '#60a5fa',
              border: '2px solid #60a5fa',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Start Puzzle (New Tab)
          </button>
        </div>
      </div>

      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#fff3cd', 
        border: '2px solid #ffc107',
        borderRadius: '8px'
      }}>
        <h4>📝 Integration Notes:</h4>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Import the navigation functions at the top of your component</li>
          <li>The puzzle app must be running on port 3001 for these links to work</li>
          <li>Authentication is automatically handled - the user's token is passed to the puzzle app</li>
          <li>Puzzle completions are tracked and XP is awarded automatically</li>
          <li>Users can return to the main app using the "Complete" button in each puzzle</li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        background: '#e3f2fd', 
        border: '2px solid #2196f3',
        borderRadius: '8px'
      }}>
        <h4>💻 Code Example:</h4>
        <pre style={{ 
          background: '#1e1e1e', 
          color: '#d4d4d4', 
          padding: '20px', 
          borderRadius: '8px',
          overflow: 'auto'
        }}>
{`import { navigateToPuzzle } from '../utils/puzzleNavigation';

const MyLessonComponent = () => {
  return (
    <button onClick={() => navigateToPuzzle('apple-game')}>
      Start Apple Game Puzzle
    </button>
  );
};`}
        </pre>
      </div>
    </div>
  );
};

export default PuzzleNavigationExample;

