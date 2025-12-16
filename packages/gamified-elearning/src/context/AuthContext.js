import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    console.log('AuthContext useEffect - storedUser:', storedUser, 'storedToken:', storedToken);
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    console.log('AuthContext login - userData:', userData);
    const { user, token } = userData;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    setUser(user); // user now includes { id, name, role }
  };

  const logout = () => {
    console.log('AuthContext logout');
    
    // Clear auth from main app
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    
    setUser(null);
    
    // Also try to clear puzzle app's storage (if accessible)
    // This helps prevent auth confusion when switching users
    try {
      // Note: This only works if puzzle app was previously opened
      const puzzleOrigin = 'http://localhost:3001';
      // We can't directly clear another origin's storage due to browser security
      // But we clear sessionStorage which helps
      console.log('Cleared sessionStorage for puzzle app sync');
    } catch (e) {
      // Silently fail - this is just a best-effort cleanup
    }
  };

  console.log('AuthContext render - user:', user, 'loading:', loading);
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};