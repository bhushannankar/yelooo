import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL } from '../config';
import './AddSellerPage.css';

const flattenQuaternary = (categories) => {
  const list = [];
  if (!Array.isArray(categories)) return list;
  categories.forEach((c) => {
    (c.subCategories || []).forEach((s) => {
      (s.tertiaryCategories || []).forEach((t) => {
        (t.quaternaryCategories || []).forEach((q) => {
          list.push({
            quaternaryCategoryId: q.quaternaryCategoryId,
            quaternaryCategoryName: q.quaternaryCategoryName,
            path: `${c.categoryName} › ${s.subCategoryName} › ${t.tertiaryCategoryName} › ${q.quaternaryCategoryName}`
          });
        });
      });
    });
  });
  return list;
};

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
  const [quaternaryCategoryIds, setQuaternaryCategoryIds] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/Categories/with-subcategories`)
      .then((res) => setCategoryTree(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategoryTree([]));
  }, []);

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
      if (quaternaryCategoryIds.length > 0) {
        payload.quaternaryCategoryIds = quaternaryCategoryIds;
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
      setQuaternaryCategoryIds([]);

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

            <div className="form-group categories-seller">
              <label>Categories this seller can sell in</label>
              <small className="form-hint">Select quaternary categories. This seller will only appear when adding products in these categories.</small>
              <div className="quaternary-checkboxes">
                {flattenQuaternary(categoryTree).map((q) => (
                  <label key={q.quaternaryCategoryId} className="quaternary-check">
                    <input
                      type="checkbox"
                      checked={quaternaryCategoryIds.includes(q.quaternaryCategoryId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setQuaternaryCategoryIds(prev => [...prev, q.quaternaryCategoryId]);
                        } else {
                          setQuaternaryCategoryIds(prev => prev.filter(id => id !== q.quaternaryCategoryId));
                        }
                      }}
                    />
                    <span className="quaternary-path">{q.path}</span>
                  </label>
                ))}
                {flattenQuaternary(categoryTree).length === 0 && (
                  <p className="no-categories-msg">No quaternary categories yet. Add them under Admin → Manage Categories.</p>
                )}
              </div>
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
