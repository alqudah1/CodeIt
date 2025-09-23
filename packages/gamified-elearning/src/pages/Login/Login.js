import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { login, user } = useContext(AuthContext);
  const [sparkles, setSparkles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => {
      setSparkles((prev) => [
        ...prev.slice(-8),
        { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 },
      ]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // No useEffect for redirect here - stay on /login after logout

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data);
    try {
      const response = await axios.post('http://localhost:8080/api/login', data, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Response received:', response.data);
      login(response.data); // Updating the context
      setSuccess(response.data.message);
      setError(null);
      navigate("/"); // Navigate to home on success
    } catch (err) {
      console.error('Error during login:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.message);
      setSuccess(null);
    }
  };

  return (
    <div className="login-page">
      {/* Sparkles */}
      {sparkles.map((s) => (
        <div
          key={s.id}
          className="sparkle"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        >
          ✨
        </div>
      ))}

      {/* Header */}
      <header className="header">
        <div className="logo-area">
          <img src="/images/CodeItLogo.png" alt="Logo" className="logo-img" />
          <h1 className="logo-text">CodeIt</h1>
        </div>
        <nav className="nav-links">
          <a href="/" className="home">🏠 Home</a>
          <a href="/about" className="about">📖 About</a>
          <a href="/contact" className="contact">📞 Contact</a>
          <a href="/signup" className="register">📝 Register</a>
        </nav>
      </header>

      {/* Login Form Section */}
      <section className="form-section">
        <h2>Login to Your Account</h2>
        <p>Enter your details to continue your coding journey!</p>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              {...register('email', { required: true })}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error">Email is required</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              {...register('password', { required: true })}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error">Password is required</span>}
          </div>

          <button type="submit" className="submit-btn">Login 🚀</button>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>
        <p className="switch-link">
          Don't have an account? <a href="/signup">Sign Up</a>
        </p>
      </section>
    </div>
  );
};

export default Login;