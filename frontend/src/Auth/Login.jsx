import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/login.css';
import { AuthContext } from '../context/ContextCreation';
import api from "../api";
import ThemeToggle from '../Components/ThemeToggle';

export const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post(
        '/auth/login',
        { name, password },
      );

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        login();
        navigate('/');
      } else {
        setError('Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'An error occurred while logging in. Please try again.'
      );
    }
  };

  return (
    <div className="login-container">
      <div className="auth-theme-switcher">
        <ThemeToggle />
      </div>
      <div className="login-card">
        <div className="login-branding">
          <h1 className="branding-main">CodeArena</h1>
          <h3 className="branding-sub">Competitive Programming Platform</h3>
        </div>

        <h2>Login</h2>
        <form onSubmit={handleLogin}>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <p className="login-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};
