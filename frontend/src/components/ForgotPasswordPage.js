import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MinimalHeader from './MinimalHeader';
import MinimalFooter from './MinimalFooter';
import { API_URL } from '../config';
import './Auth.css';

const authApiUrl = `${API_URL}/Auth`;

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    setResetLink('');

    try {
      const response = await axios.post(`${authApiUrl}/forgot-password`, { email });
      setStatus('success');
      setMessage(response.data.message || 'If an account with that email exists, a password reset link has been sent.');
      if (response.data.resetLink) {
        setResetLink(response.data.resetLink);
      }
    } catch (error) {
      setStatus('error');
      if (error.response && error.response.data) {
        setMessage(error.response.data.message || 'An error occurred. Please try again.');
      } else {
        setMessage('An error occurred. Please try again.');
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetLink).then(() => {
      alert('Reset link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = resetLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Reset link copied to clipboard!');
    });
  };

  return (
    <div className="auth-page">
      <MinimalHeader />
      <div className="auth-container">
        <div className="auth-form">
          <h2>Forgot Password</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {status === 'success' ? (
          <div className="success-message">
            <p>{message}</p>
            
            {resetLink ? (
              <div style={{ 
                marginTop: 'var(--spacing-lg)', 
                padding: 'var(--spacing-md)', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <p style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--text-primary)'
                }}>
                  🔗 Password Reset Link (Development Mode):
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-sm)',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <input
                    type="text"
                    value={resetLink}
                    readOnly
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      backgroundColor: 'var(--primary-color)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📋 Copy Link
                  </button>
                </div>
                <a
                  href={resetLink}
                  style={{
                    display: 'inline-block',
                    marginTop: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    backgroundColor: 'var(--btn-primary)',
                    color: 'var(--btn-primary-text)',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  🔓 Open Reset Password Page
                </a>
                <p style={{ 
                  marginTop: 'var(--spacing-md)', 
                  fontSize: 'var(--font-size-xs)', 
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic'
                }}>
                  Note: In production, this link will be sent to your email address.
                </p>
              </div>
            ) : (
              <p style={{ marginTop: 'var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}>
                Please check your email for the password reset link.
              </p>
            )}
            
            <button 
              type="button" 
              onClick={() => window.location.href = '/login'}
              style={{ marginTop: 'var(--spacing-lg)', width: '100%' }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
                disabled={status === 'loading'}
              />
            </div>
            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
            {status === 'error' && <p className="error-message">{message}</p>}
            <p className="auth-link">
              Remember your password? <span onClick={() => window.location.href = '/login'}>Login here</span>
            </p>
          </form>
        )}
        </div>
      </div>
      <MinimalFooter />
    </div>
  );
};

export default ForgotPasswordPage;
