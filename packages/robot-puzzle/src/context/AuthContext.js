import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // IMPORTANT: Check URL params FIRST (highest priority - most recent auth)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const userParam = urlParams.get('user');
    
    if (tokenParam && userParam) {
      // Fresh auth from main app - ALWAYS use this (overwrites any cached auth)
      console.log('🔄 Fresh auth from URL params - updating user');
      const userData = JSON.parse(decodeURIComponent(userParam));
      
      // Update ALL storage locations with new auth
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', tokenParam);
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', tokenParam);
      
      setUser(userData);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setLoading(false);
      return;
    }
    
    // No URL params, check sessionStorage (cross-port backup)
    const sessionUser = sessionStorage.getItem('user');
    const sessionToken = sessionStorage.getItem('token');
    
    if (sessionUser && sessionToken) {
      console.log('✓ Auth from sessionStorage');
      // Update localStorage from sessionStorage
      localStorage.setItem('user', sessionUser);
      localStorage.setItem('token', sessionToken);
      setUser(JSON.parse(sessionUser));
      setLoading(false);
      return;
    }
    
    // Finally, check localStorage (fallback)
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    console.log('AuthContext - checking cached auth');
    console.log('  Stored user:', storedUser ? 'exists' : 'none');
    console.log('  Stored token:', storedToken ? 'exists' : 'none');
    
    if (storedUser && storedToken) {
      console.log('✓ Auth from localStorage (cached)');
      setUser(JSON.parse(storedUser));
    } else {
      console.log('❌ No auth found');
    }
    
    setLoading(false);
  }, []);

  const login = (userData) => {
    console.log('AuthContext login - userData:', userData);
    const { user, token } = userData;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('token', token);
    setUser(user);
  };

  const logout = () => {
    console.log('AuthContext logout');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    setUser(null);
    
    // Redirect to main app login
    window.location.href = "http://localhost:3000/login";
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

