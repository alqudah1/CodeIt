// gamified-elearning/src/context/AuthContext.js
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
    setUser(user);
  };

  const logout = () => {
    console.log('AuthContext logout');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    // No navigation here - let the component handle it
  };

  console.log('AuthContext render - user:', user, 'loading:', loading);
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Add useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};