import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import './Auth.css';

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  const { login } = useAuth();
  const navigate = useNavigate();

  // ✨ Sparkle animation
  useEffect(() => {
    const id = setInterval(() => {
      setSparkles((prev) => [
        ...prev.slice(-8),
        { id: Date.now(), x: Math.random() * 100 },
      ]);
    }, 3000);

    return () => clearInterval(id);
  }, []);

  const onSubmit = async (data) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/signup`,
        data,
        { headers: { 'Content-Type': 'application/json' } }
      );

      login({
        user: response.data.user,
        token: response.data.token,
      });

      setSuccess(response.data.message || 'Registration successful!');
      setTimeout(() => navigate('/'), 800);
    } catch (err) {
      console.error('Register error:', err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed'
      );
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create your account</h2>

        {/* Sparkles */}
        <div className="sparkles">
          {sparkles.map((s) => (
            <div key={s.id} className="sparkle" style={{ left: `${s.x}%` }}>
              ✨
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">

          {/* Name */}
          <div className="auth-field">
            <label className="auth-label">Name</label>
            <input
              className="auth-input"
              {...register('name', { required: 'Name is required' })}
              placeholder="Enter your name"
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              {...register('email', { required: 'Email is required' })}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>

          {/* Password */}
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
              placeholder="Enter password"
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>

          {/* DOB */}
          <div className="auth-field">
            <label className="auth-label">Date of Birth</label>
            <input
              type="date"
              className="auth-input"
              {...register('dob', { required: 'Date of Birth is required' })}
            />
            {errors.dob && <span className="error">{errors.dob.message}</span>}
          </div>

          {/* Parent Email */}
          <div className="auth-field">
            <label className="auth-label">Parent Email (optional)</label>
            <input
              type="email"
              className="auth-input"
              {...register('parent_email')}
              placeholder="Enter parent email"
            />
          </div>

          <button type="submit" className="auth-button">
            Sign Up &amp; Play 🚀
          </button>

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
