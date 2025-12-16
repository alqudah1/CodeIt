import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; 
import './Auth.css';

export default function Register() {
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
      const response = await axios.post('http://localhost:8080/api/signup', data, {
        headers: { 'Content-Type': 'application/json' },
      });
      login({ user: response.data.user, token: response.data.token }); 
      setSuccess(response.data.message || 'Registration successful!');
      setError(null);
      navigate('/login'); 
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
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
      <button
          type="button"
          className="auth-back"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
        <header className="auth-header">
          <span className="auth-pill">Join the fun</span>
          <h1>Create your CodeIt adventure</h1>
          <p>Start your coding journey and unlock exciting challenges!</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="auth-field">
            <label htmlFor="name" className="auth-label">Name</label>
            <input
              id="name"
              type="text"
              {...register('name', { required: 'Name is required' })}
              className="auth-input"
              placeholder="Enter your name"
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>
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
          <div className="auth-field">
            <label htmlFor="role" className="auth-label">Role</label>
            <select
              id="role"
              {...register('role', { required: 'Role is required' })}
              className="auth-input"
            >
              <option value="">Select role</option>
              <option value="Student">Student</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && <span className="error">{errors.role.message}</span>}
          </div>
          <div className="auth-field">
            <label htmlFor="dob" className="auth-label">Date of Birth</label>
            <input
              id="dob"
              type="date"
              {...register('dob', { required: 'Date of Birth is required' })}
              className="auth-input"
            />
            {errors.dob && <span className="error">{errors.dob.message}</span>}
          </div>
          <div className="auth-field">
            <label htmlFor="parent_email" className="auth-label">Parent Email (optional for Student)</label>
            <input
              id="parent_email"
              type="email"
              {...register('parent_email')}
              className="auth-input"
              placeholder="Enter parent email"
            />
          </div>
          <button type="submit" className="auth-button">Sign Up &amp; play 🌟</button>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
}