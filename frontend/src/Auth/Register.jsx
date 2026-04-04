import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "../style/Register.css";
import api from "../api";
import ThemeToggle from "../Components/ThemeToggle";

export const Register = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post(
        '/auth/register',
        { name, password, institution },
        { withCredentials: true }
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/login');
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'An error occurred while registering. Please try again.'
      );
    }
  };

  return (
    <div className="register-container">
      <div className="auth-theme-switcher">
        <ThemeToggle />
      </div>
      <div className="register-card">
        <div className="register-branding">
          <h1 className="branding-main">CodeArena</h1>
          <h3 className="branding-sub">Competitive Programming Platform</h3>
        </div>

        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              autoComplete="username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="institution">Institution</label>
            <input
              type="text"
              id="institution"
              autoComplete="organization"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
            />
          </div>
          <button type="submit">Register</button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <p className="register-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};
