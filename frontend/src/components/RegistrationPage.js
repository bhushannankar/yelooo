import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { registerUser } from '../features/auth/authSlice';
import MinimalHeader from './MinimalHeader';
import MinimalFooter from './MinimalFooter';
import './Auth.css';

const API_URL = 'https://localhost:7193/api';

const RegistrationPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [referralError, setReferralError] = useState('');
  const [validatingReferral, setValidatingReferral] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authStatus = useSelector((state) => state.auth.status);
  const authError = useSelector((state) => state.auth.error);

  // Get referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  const validateReferralCode = async (code) => {
    if (!code) {
      setReferrerInfo(null);
      setReferralError('');
      return;
    }

    setValidatingReferral(true);
    setReferralError('');

    try {
      const response = await axios.get(`${API_URL}/Referral/validate/${code}`);
      if (response.data.valid) {
        setReferrerInfo(response.data);
        setReferralError('');
      } else {
        setReferrerInfo(null);
        setReferralError(response.data.message || 'Invalid referral code');
      }
    } catch (error) {
      setReferrerInfo(null);
      setReferralError(error.response?.data?.message || 'Invalid referral code');
    } finally {
      setValidatingReferral(false);
    }
  };

  const handleReferralCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setReferralCode(code);
    if (code.length >= 8) {
      validateReferralCode(code);
    } else {
      setReferrerInfo(null);
      setReferralError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate referral code
    if (!referralCode) {
      setReferralError('A referral code is required to register');
      return;
    }

    if (!referrerInfo) {
      setReferralError('Please enter a valid referral code');
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const resultAction = await dispatch(registerUser({ 
      username, 
      email, 
      password,
      referralCode 
    }));
    
    if (registerUser.fulfilled.match(resultAction)) {
      alert(`Registration successful! You were referred by ${referrerInfo.referrerName}. Please log in.`);
      navigate('/login');
    }
  };

  return (
    <div className="auth-page">
      <MinimalHeader />
      <div className="auth-container">
        <h2>Register</h2>
      
      {/* Referral Info Banner */}
      {referrerInfo && (
        <div className="referral-info-banner">
          <div className="referral-icon">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="referral-details">
            <span className="referral-label">You're being referred by</span>
            <span className="referrer-name">{referrerInfo.referrerName}</span>
            <span className="your-level">You will be at Level {referrerInfo.yourLevel} in the network</span>
          </div>
        </div>
      )}

      {!referralCode && !searchParams.get('ref') && (
        <div className="no-referral-warning">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <span>Registration requires a referral link. Please ask an existing member for their referral link.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="referralCode">Referral Code: *</label>
          <input
            type="text"
            id="referralCode"
            value={referralCode}
            onChange={handleReferralCodeChange}
            placeholder="Enter referral code"
            required
            className={referralError ? 'input-error' : referrerInfo ? 'input-success' : ''}
          />
          {validatingReferral && <span className="validating">Validating...</span>}
          {referralError && <span className="field-error">{referralError}</span>}
          {referrerInfo && !validatingReferral && (
            <span className="field-success">✓ Valid referral from {referrerInfo.referrerName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="username">Username: *</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email: *</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password: *</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password: *</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button 
          type="submit" 
          disabled={authStatus === 'loading' || !referrerInfo || validatingReferral}
        >
          {authStatus === 'loading' ? 'Registering...' : 'Register'}
        </button>
        
        {authStatus === 'failed' && <p className="error-message">{authError}</p>}
        
        <p className="auth-link">
          Already have an account? <span onClick={() => navigate('/login')}>Login here</span>
        </p>
      </form>
      </div>
      <MinimalFooter />
    </div>
  );
};

export default RegistrationPage;
