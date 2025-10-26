// Utility to navigate to puzzle games with authentication
export const navigateToPuzzle = (puzzleName) => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!user || !token) {
    console.error('User not authenticated. Cannot navigate to puzzle.');
    return;
  }
  
  // Also store in sessionStorage for cross-port access
  sessionStorage.setItem('user', user);
  sessionStorage.setItem('token', token);
  
  // Map puzzle names to routes
  const puzzleRoutes = {
    'talking-robot': '/puzzle',
    'robot': '/puzzle',
    'apple-game': '/apple-game',
    'apple': '/apple-game',
    'math-game': '/math-game',
    'math': '/math-game',
    'condition-game': '/condition-game',
    'condition': '/condition-game',
    'loop-game': '/loop-game',
    'loop': '/loop-game'
  };
  
  const route = puzzleRoutes[puzzleName.toLowerCase()] || '/puzzle';
  
  // Navigate to puzzle app (assuming it runs on port 3001)
  const puzzleAppUrl = `http://localhost:3001${route}`;
  
  // Pass auth data via URL params as backup
  const encodedUser = encodeURIComponent(user);
  const urlWithAuth = `${puzzleAppUrl}?token=${token}&user=${encodedUser}`;
  
  // Open puzzle in the same window
  window.location.href = urlWithAuth;
};

// Alternative: Open puzzle in new tab
export const openPuzzleInNewTab = (puzzleName) => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!user || !token) {
    console.error('User not authenticated. Cannot open puzzle.');
    return;
  }
  
  const puzzleRoutes = {
    'talking-robot': '/puzzle',
    'robot': '/puzzle',
    'apple-game': '/apple-game',
    'apple': '/apple-game',
    'math-game': '/math-game',
    'math': '/math-game',
    'condition-game': '/condition-game',
    'condition': '/condition-game',
    'loop-game': '/loop-game',
    'loop': '/loop-game'
  };
  
  const route = puzzleRoutes[puzzleName.toLowerCase()] || '/puzzle';
  const puzzleAppUrl = `http://localhost:3001${route}`;
  const encodedUser = encodeURIComponent(user);
  const urlWithAuth = `${puzzleAppUrl}?token=${token}&user=${encodedUser}`;
  
  window.open(urlWithAuth, '_blank');
};

export default { navigateToPuzzle, openPuzzleInNewTab };

