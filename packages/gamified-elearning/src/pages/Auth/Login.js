import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; 
import './Auth.css';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      setSparkles((prev) => [...prev.slice(-8), { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 }]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('http://localhost:8080/api/login', data, {
        headers: { 'Content-Type': 'application/json' },
      });
      login({ user: response.data.user, token: response.data.token }); 
      setSuccess(response.data.message || 'Login successful!');
      setError(null);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed');
      setSuccess(null);
    }
  };

  return (
    <div className="auth-page">
      {sparkles.map((s) => (
        <div key={s.id} className="sparkle" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
          ✨
        </div>
      ))}
      <div className="auth-card">
        <header className="auth-header">
          <span className="auth-pill">Welcome back</span>
          <h1>Login to your CodeIt adventure</h1>
          <p>Pick up where you left off and keep your coding streak shining bright.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">Email</label>
            <input
              id="email"
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="auth-input"
              placeholder="Enter your email"
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>
          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Password</label>
            <input
              id="password"
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="auth-input"
              placeholder="Enter your password"
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>
          <button type="submit" className="auth-button">Login &amp; play 🌈</button>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>
        <div className="auth-footer">
          New to CodeIt? <Link to="/register">Get started here</Link>
        </div>
      </div>
    </div>
  );
}