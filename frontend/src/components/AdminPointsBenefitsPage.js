import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_URL } from '../config';
import './AdminPointsBenefitsPage.css';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const BENEFIT_TYPES = [
  { value: 'ExtraDiscountPercent', label: 'Extra % discount', unit: '%' },
  { value: 'FixedDiscount', label: 'Fixed discount', unit: '₹' },
  { value: 'FreeShipping', label: 'Free shipping (value)', unit: '₹' }
];

const AdminPointsBenefitsPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [redemptionConfig, setRedemptionConfig] = useState({ pointsPerRupee: 10, isActive: true });
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  const [showBenefitForm, setShowBenefitForm] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState(null);
  const [benefitForm, setBenefitForm] = useState({
    pointsThreshold: '',
    benefitType: 'ExtraDiscountPercent',
    benefitValue: '',
    description: '',
    isActive: true,
    displayOrder: 0
  });

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/');
      return;
    }
    fetchData();
  }, [isLoggedIn, userRole, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, benefitsRes] = await Promise.all([
        axios.get(`${API_URL}/Points/admin/redemption-config`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/Points/admin/benefits`, { headers: getAuthHeader() })
      ]);
      setRedemptionConfig({
        pointsPerRupee: configRes.data?.pointsPerRupee ?? 10,
        isActive: configRes.data?.isActive ?? true
      });
      const raw = benefitsRes.data;
      setBenefits(Array.isArray(raw) ? raw : (raw?.$values || []));
    } catch (err) {
      console.error('Error fetching points data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setConfigSaving(true);
      setConfigMessage('');
      await axios.put(`${API_URL}/Points/admin/redemption-config`, {
        pointsPerRupee: parseInt(redemptionConfig.pointsPerRupee, 10) || 10,
        isActive: redemptionConfig.isActive
      }, { headers: getAuthHeader() });
      setConfigMessage('Redemption config updated successfully.');
    } catch (err) {
      setConfigMessage(err.response?.data?.message || 'Failed to save config.');
    } finally {
      setConfigSaving(false);
    }
  };

  const resetBenefitForm = () => {
    setBenefitForm({
      pointsThreshold: '',
      benefitType: 'ExtraDiscountPercent',
      benefitValue: '',
      description: '',
      isActive: true,
      displayOrder: 0
    });
    setEditingBenefit(null);
    setShowBenefitForm(false);
  };

  const handleEditBenefit = (b) => {
    setEditingBenefit(b);
    setBenefitForm({
      pointsThreshold: String(b.pointsThreshold),
      benefitType: b.benefitType || 'ExtraDiscountPercent',
      benefitValue: String(b.benefitValue),
      description: b.description || '',
      isActive: b.isActive ?? true,
      displayOrder: b.displayOrder ?? 0
    });
    setShowBenefitForm(true);
  };

  const handleSaveBenefit = async () => {
    const threshold = parseInt(benefitForm.pointsThreshold, 10);
    const value = parseFloat(benefitForm.benefitValue);
    if (isNaN(threshold) || threshold < 0) {
      alert('Enter a valid points threshold.');
      return;
    }
    if (isNaN(value) || value < 0) {
      alert('Enter a valid benefit value.');
      return;
    }
    try {
      if (editingBenefit) {
        await axios.put(`${API_URL}/Points/admin/benefits/${editingBenefit.pointsBenefitId}`, {
          pointsThreshold: threshold,
          benefitType: benefitForm.benefitType,
          benefitValue: value,
          description: benefitForm.description || null,
          isActive: benefitForm.isActive,
          displayOrder: parseInt(benefitForm.displayOrder, 10) || 0
        }, { headers: getAuthHeader() });
        alert('Benefit updated.');
      } else {
        await axios.post(`${API_URL}/Points/admin/benefits`, {
          pointsThreshold: threshold,
          benefitType: benefitForm.benefitType,
          benefitValue: value,
          description: benefitForm.description || null,
          isActive: benefitForm.isActive,
          displayOrder: parseInt(benefitForm.displayOrder, 10) || 0
        }, { headers: getAuthHeader() });
        alert('Benefit created.');
      }
      resetBenefitForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save benefit.');
    }
  };

  const handleDeleteBenefit = async (id) => {
    if (!window.confirm('Delete this benefit?')) return;
    try {
      await axios.delete(`${API_URL}/Points/admin/benefits/${id}`, { headers: getAuthHeader() });
      fetchData();
      resetBenefitForm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete benefit.');
    }
  };

  const getBenefitTypeLabel = (type) => BENEFIT_TYPES.find(t => t.value === type)?.label || type;
  const getBenefitUnit = (type) => BENEFIT_TYPES.find(t => t.value === type)?.unit || '';

  if (loading) {
    return (
      <div className="admin-points-benefits-page">
        <Header />
        <div className="admin-points-benefits-content">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-points-benefits-page">
      <Header />
      <div className="admin-points-benefits-content">
        <h1>Points & Benefits Management</h1>

        {/* Redemption Config */}
        <section className="admin-section config-section">
          <h2>Redemption Config</h2>
          <p className="section-desc">Points per ₹1 when customers redeem points at checkout.</p>
          <div className="config-form">
            <label>
              Points per Rupee
              <input
                type="number"
                min="1"
                value={redemptionConfig.pointsPerRupee}
                onChange={(e) => setRedemptionConfig({ ...redemptionConfig, pointsPerRupee: e.target.value })}
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={redemptionConfig.isActive}
                onChange={(e) => setRedemptionConfig({ ...redemptionConfig, isActive: e.target.checked })}
              />
              Redemption enabled
            </label>
            <button onClick={handleSaveConfig} disabled={configSaving}>
              {configSaving ? 'Saving...' : 'Save Config'}
            </button>
            {configMessage && <span className="config-message">{configMessage}</span>}
          </div>
        </section>

        {/* Benefits */}
        <section className="admin-section benefits-section">
          <div className="section-header-row">
            <div>
              <h2>Threshold Benefits</h2>
              <p className="section-desc">Benefits customers receive when their earned points cross a threshold.</p>
            </div>
            <button className="btn-add" onClick={() => { resetBenefitForm(); setShowBenefitForm(true); }}>
              + Add Benefit
            </button>
          </div>

          {showBenefitForm && (
            <div className="benefit-form-card">
              <h3>{editingBenefit ? 'Edit Benefit' : 'New Benefit'}</h3>
              <div className="form-grid">
                <label>
                  Points threshold
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1000"
                    value={benefitForm.pointsThreshold}
                    onChange={(e) => setBenefitForm({ ...benefitForm, pointsThreshold: e.target.value })}
                  />
                </label>
                <label>
                  Benefit type
                  <select
                    value={benefitForm.benefitType}
                    onChange={(e) => setBenefitForm({ ...benefitForm, benefitType: e.target.value })}
                  >
                    {BENEFIT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Benefit value {getBenefitUnit(benefitForm.benefitType)}
                  <input
                    type="number"
                    min="0"
                    step={benefitForm.benefitType === 'ExtraDiscountPercent' ? '1' : '0.01'}
                    placeholder="e.g. 5"
                    value={benefitForm.benefitValue}
                    onChange={(e) => setBenefitForm({ ...benefitForm, benefitValue: e.target.value })}
                  />
                </label>
                <label>
                  Description (optional)
                  <input
                    type="text"
                    placeholder="e.g. 5% extra discount"
                    value={benefitForm.description}
                    onChange={(e) => setBenefitForm({ ...benefitForm, description: e.target.value })}
                  />
                </label>
                <label>
                  Display order
                  <input
                    type="number"
                    min="0"
                    value={benefitForm.displayOrder}
                    onChange={(e) => setBenefitForm({ ...benefitForm, displayOrder: e.target.value })}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={benefitForm.isActive}
                    onChange={(e) => setBenefitForm({ ...benefitForm, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleSaveBenefit}>Save</button>
                <button className="btn-secondary" onClick={resetBenefitForm}>Cancel</button>
              </div>
            </div>
          )}

          <div className="benefits-table-wrap">
            <table className="benefits-table">
              <thead>
                <tr>
                  <th>Threshold</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Description</th>
                  <th>Active</th>
                  <th>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {benefits.length === 0 ? (
                  <tr>
                    <td colSpan="7">No benefits defined. Add one to reward high-point customers.</td>
                  </tr>
                ) : (
                  benefits.map((b) => (
                    <tr key={b.pointsBenefitId} className={!b.isActive ? 'inactive' : ''}>
                      <td>{b.pointsThreshold}</td>
                      <td>{getBenefitTypeLabel(b.benefitType)}</td>
                      <td>{b.benefitValue}{getBenefitUnit(b.benefitType)}</td>
                      <td>{b.description || '—'}</td>
                      <td>{b.isActive ? 'Yes' : 'No'}</td>
                      <td>{b.displayOrder}</td>
                      <td>
                        <button className="btn-small" onClick={() => handleEditBenefit(b)}>Edit</button>
                        <button className="btn-small btn-danger" onClick={() => handleDeleteBenefit(b.pointsBenefitId)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPointsBenefitsPage;
