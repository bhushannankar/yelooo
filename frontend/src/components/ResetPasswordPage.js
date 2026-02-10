import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import MinimalHeader from './MinimalHeader';
import MinimalFooter from './MinimalFooter';
import { API_URL } from '../config';
import './Auth.css';

const authApiUrl = `${API_URL}/Auth`;

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, verifying, success, error
  const [message, setMessage] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');

    if (!emailParam || !tokenParam) {
      setStatus('error');
      setMessage('Invalid reset link. Please request a new password reset.');
      return;
    }

    setEmail(emailParam);
    setToken(tokenParam);
    verifyToken(emailParam, tokenParam);
  }, [searchParams]);

  const verifyToken = async (email, token) => {
    setStatus('verifying');
    try {
      const response = await axios.post(`${API_URL}/verify-reset-token`, { email, token });
      if (response.data.isValid) {
        setIsTokenValid(true);
        setStatus('idle');
      } else {
        setIsTokenValid(false);
        setStatus('error');
        setMessage(response.data.message || 'Invalid or expired reset token.');
      }
    } catch (error) {
      setIsTokenValid(false);
      setStatus('error');
      if (error.response && error.response.data) {
        setMessage(error.response.data.message || 'Invalid or expired reset token.');
      } else {
        setMessage('Invalid or expired reset token.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setStatus('error');
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setStatus('loading');

    try {
      const response = await axios.post(`${authApiUrl}/reset-password`, {
        email,
        token,
        newPassword
      });
      setStatus('success');
      setMessage(response.data.message || 'Password has been reset successfully.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      if (error.response && error.response.data) {
        setMessage(error.response.data.message || 'An error occurred. Please try again.');
      } else {
        setMessage('An error occurred. Please try again.');
      }
    }
  };

  if (status === 'verifying') {
    return (
      <div className="auth-page">
        <MinimalHeader />
        <div className="auth-container">
          <div className="auth-form">
            <h2>Verifying Reset Link...</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
              Please wait while we verify your reset link.
            </p>
          </div>
        </div>
        <MinimalFooter />
      </div>
    );
  }

  if (!isTokenValid && status === 'error') {
    return (
      <div className="auth-page">
        <MinimalHeader />
        <div className="auth-container">
          <div className="auth-form">
            <h2>Invalid Reset Link</h2>
            <div className="error-message">
              <p>{message}</p>
            </div>
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
              style={{ marginTop: 'var(--spacing-md)', width: '100%' }}
            >
              Request New Reset Link
            </button>
            <p className="auth-link">
              <span onClick={() => navigate('/login')}>Back to Login</span>
            </p>
          </div>
        </div>
        <MinimalFooter />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="auth-page">
        <MinimalHeader />
        <div className="auth-container">
          <div className="auth-form">
            <h2>Password Reset Successful</h2>
            <div className="success-message">
              <p>{message}</p>
              <p style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                Redirecting to login page...
              </p>
            </div>
          </div>
        </div>
        <MinimalFooter />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <MinimalHeader />
      <div className="auth-container">
        <div className="auth-form">
          <h2>Reset Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)' }}>
          Enter your new password below.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              disabled
              style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password (min. 6 characters)"
              disabled={status === 'loading'}
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              disabled={status === 'loading'}
              minLength={6}
            />
          </div>
          <button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Resetting Password...' : 'Reset Password'}
          </button>
          {status === 'error' && <p className="error-message">{message}</p>}
          <p className="auth-link">
            <span onClick={() => navigate('/login')}>Back to Login</span>
          </p>
        </form>
        </div>
      </div>
      <MinimalFooter />
    </div>
  );
};

export default ResetPasswordPage;
