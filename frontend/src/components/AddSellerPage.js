import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL } from '../config';
import './AddSellerPage.css';

const AddSellerPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    commissionPercent: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Redirect if not admin
  if (!isLoggedIn || userRole !== 'Admin') {
    navigate('/');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    const commission = parseFloat(formData.commissionPercent);
    if (formData.commissionPercent !== '' && (isNaN(commission) || commission < 0 || commission > 100)) {
      setError('Commission % must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('jwtToken');
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      if (formData.commissionPercent !== '') {
        payload.commissionPercent = parseFloat(formData.commissionPercent);
      }
      await axios.post(`${API_URL}/Sellers`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess(true);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        commissionPercent: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/admin/sellers');
      }, 2000);

    } catch (err) {
      setError(err.response?.data || 'Failed to create seller. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-seller-wrapper">
      <Header />
      <div className="add-seller-container">
        <div className="add-seller-card">
          <h2>Add New Seller</h2>
          <p className="subtitle">Create a new seller account</p>

          {success && (
            <div className="success-message">
              Seller created successfully! Redirecting...
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="seller-form">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter username"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (min 6 characters)"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="commissionPercent">Commission % (Admin receives)</label>
              <input
                type="number"
                id="commissionPercent"
                name="commissionPercent"
                value={formData.commissionPercent}
                onChange={handleChange}
                placeholder="e.g. 10 (0-100)"
                min="0"
                max="100"
                step="0.5"
                disabled={loading}
              />
              <small className="form-hint">Percentage of seller&apos;s transaction value that admin will receive</small>
            </div>

            <div className="button-group">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => navigate('/admin/sellers')}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Seller'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSellerPage;
