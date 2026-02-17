import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL, normalizeList } from '../config';
import './AddSellerPage.css';
import './Auth.css';

/** Build selectable items at Sub, Tertiary, and Quaternary levels (tertiary/quaternary optional). */
const flattenCategorySelections = (categories, normalizeList) => {
  const items = [];
  normalizeList(categories).forEach((c) => {
    normalizeList(c?.subCategories).forEach((s) => {
      items.push({ type: 'sub', id: s.subCategoryId, path: `${c.categoryName} › ${s.subCategoryName}` });
      normalizeList(s?.tertiaryCategories).forEach((t) => {
        items.push({ type: 'tertiary', id: t.tertiaryCategoryId, path: `${c.categoryName} › ${s.subCategoryName} › ${t.tertiaryCategoryName}` });
        normalizeList(t?.quaternaryCategories).forEach((q) => {
          items.push({ type: 'quaternary', id: q.quaternaryCategoryId, path: `${c.categoryName} › ${s.subCategoryName} › ${t.tertiaryCategoryName} › ${q.quaternaryCategoryName}` });
        });
      });
    });
  });
  return items;
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
  const [subCategoryIds, setSubCategoryIds] = useState([]);
  const [tertiaryCategoryIds, setTertiaryCategoryIds] = useState([]);
  const [quaternaryCategoryIds, setQuaternaryCategoryIds] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successUserId, setSuccessUserId] = useState(null);
  const [successReferralCode, setSuccessReferralCode] = useState('');

  useEffect(() => {
    axios.get(`${API_URL}/Categories/with-subcategories`)
      .then((res) => setCategoryTree(normalizeList(res.data)))
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
      if (subCategoryIds.length > 0) payload.subCategoryIds = subCategoryIds;
      if (tertiaryCategoryIds.length > 0) payload.tertiaryCategoryIds = tertiaryCategoryIds;
      if (quaternaryCategoryIds.length > 0) payload.quaternaryCategoryIds = quaternaryCategoryIds;
      const res = await axios.post(`${API_URL}/Sellers`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = res.data || {};
      const userId = data.userId ?? data.sellerId;
      const referralCode = data.referralCode ?? '';

      setSuccess(true);
      setSuccessUserId(userId);
      setSuccessReferralCode(referralCode);
      setShowSuccessPopup(true);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        commissionPercent: ''
      });
      setSubCategoryIds([]);
      setTertiaryCategoryIds([]);
      setQuaternaryCategoryIds([]);

    } catch (err) {
      setError(err.response?.data || 'Failed to create seller. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessPopup(false);
    setSuccessUserId(null);
    setSuccessReferralCode('');
    navigate('/admin/sellers');
  };

  return (
    <div className="add-seller-wrapper">
      {showSuccessPopup && (
        <div className="auth-snackbar-overlay" role="dialog" aria-label="Seller created successfully">
          <div className="auth-snackbar">
            <p className="auth-snackbar-title">Seller created successfully!</p>
            <p className="auth-snackbar-message">
              User Id: <strong>{successUserId != null ? successUserId : '—'}</strong>
              {successReferralCode && (
                <> · Referral Code (for login): <strong>{successReferralCode}</strong></>
              )}
            </p>
            <p className="auth-snackbar-note">A welcome email has been sent to the seller&apos;s email address.</p>
            <button type="button" className="auth-snackbar-ok" onClick={handleSuccessOk}>OK</button>
          </div>
        </div>
      )}
      <Header />
      <div className="add-seller-container">
        <div className="add-seller-card">
          <h2>Add New Seller</h2>
          <p className="subtitle">Create a new seller account</p>

          {success && !showSuccessPopup && (
            <div className="success-message">
              Seller created successfully!
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
              <small className="form-hint">Select at SubCategory, Tertiary, or Quaternary level. Tertiary and Quaternary are optional — you can assign at SubCategory only.</small>
              <div className="quaternary-checkboxes">
                {flattenCategorySelections(categoryTree, normalizeList).map((item) => {
                  const checked = item.type === 'sub' ? subCategoryIds.includes(item.id)
                    : item.type === 'tertiary' ? tertiaryCategoryIds.includes(item.id)
                      : quaternaryCategoryIds.includes(item.id);
                  const setter = item.type === 'sub' ? setSubCategoryIds : item.type === 'tertiary' ? setTertiaryCategoryIds : setQuaternaryCategoryIds;
                  const typeLabel = item.type === 'sub' ? 'Sub' : item.type === 'tertiary' ? 'Tert' : 'Quat';
                  return (
                    <label key={`${item.type}-${item.id}`} className="quaternary-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setter(prev => [...prev, item.id]);
                          } else {
                            setter(prev => prev.filter(id => id !== item.id));
                          }
                        }}
                      />
                      <span className="quaternary-path"><span className="category-type-badge">{typeLabel}</span> {item.path}</span>
                    </label>
                  );
                })}
                {flattenCategorySelections(categoryTree, normalizeList).length === 0 && (
                  <p className="no-categories-msg">No categories yet. Add them under Admin → Manage Categories.</p>
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
