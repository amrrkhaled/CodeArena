import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../style/login.css';
import api from "../api";
import ThemeToggle from '../Components/ThemeToggle';
export const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post(
        '/auth/admin/login',
        { username, password },
        { withCredentials: true }
      );

      if (response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        navigate('/admin/dashboard'); // redirect to admin dashboard
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
          <h3 className="branding-sub">Admin Panel</h3>
        </div>

        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

      </div>
    </div>
  );
};
