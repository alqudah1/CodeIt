import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      console.warn('No authenticated user found. Redirecting to main app login...');
      // Redirect to main app login page
      window.location.href = "http://localhost:3000/login";
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #fff5a5 0%, #ffd6a5 30%, #ffabab 60%, #9bf6ff 100%)',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid #667eea',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontSize: '18px', color: '#2d3748', fontWeight: '600' }}>
            Loading puzzle game...
          </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
};

export default AuthGuard;

