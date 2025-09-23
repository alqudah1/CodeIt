// Updated Signup.js
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import './SignUp.css'; // Assuming a separate CSS file for Signup, similar to Home.css

const SignUp = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const id = setInterval(() => {
      setSparkles((prev) => [
        ...prev.slice(-8),
        { id: Date.now(), x: Math.random() * 100, y: Math.random() * 100 },
      ]);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const onSubmit = async (data) => {
    console.log('Form submitted with data:', data); // Debug log
    try {
      console.log('Sending request to /api/signup');
      const response = await axios.post('http://localhost:8080/api/signup', data, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Response received:', response.data);
      setSuccess(response.data.message);
      setError(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Error during signup:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.message);
      setSuccess(null);
    }
  };

  return (
    <div className="signup-page">
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
          <a href="/login" className="login">🔑 Login</a>
        </nav>
      </header>

      {/* Signup Form Section */}
      <section className="form-section">
        <h2>Create Your Account</h2>
        <p>Join us and start your coding adventure today!</p>
        <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              {...register('name', { required: true })}
              placeholder="Enter your name"
            />
            {errors.name && <span className="error">Name is required</span>}
          </div>

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

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" {...register('role', { required: true })}>
              <option value="Student">Student</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && <span className="error">Role is required</span>}
          </div>

          <div className="form-group">
            <label htmlFor="dob">Date of Birth</label>
            <input
              type="date"
              id="dob"
              {...register('dob', { required: true })}
            />
            {errors.dob && <span className="error">Date of Birth is required</span>}
          </div>

          <div className="form-group">
            <label htmlFor="parent_email">Parent Email (optional for Student)</label>
            <input
              type="email"
              id="parent_email"
              {...register('parent_email')}
              placeholder="Enter parent email"
            />
          </div>

          <button type="submit" className="submit-btn">Sign Up 🌟</button>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>
        <p className="switch-link">
          Already have an account? <a href="/login">Login</a>
        </p>
      </section>
    </div>
  );
};

export default SignUp;
