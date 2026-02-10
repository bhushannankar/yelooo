import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_URL, BASE_URL } from '../config';
import './OfflinePurchasePage.css';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const OfflineSalePage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    customerReferralCode: '',
    amount: '',
    transactionDate: new Date().toISOString().split('T')[0],
    transactionReference: '',
    receiptImageUrl: ''
  });

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Seller') {
      navigate('/');
      return;
    }
    fetchData();
  }, [isLoggedIn, userRole, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/OfflineTransaction/my-submissions`, { headers: getAuthHeader() });
      setSubmissions(Array.isArray(res.data) ? res.data : res.data?.$values || []);
      setError(null);
    } catch (err) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API_URL}/ImageUpload/receipt`, fd, {
        headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
      });
      setForm(prev => ({ ...prev, receiptImageUrl: res.data.imageUrl }));
    } catch (err) {
      setError(err.response?.data || 'Failed to upload receipt.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = (form.customerReferralCode || '').trim();
    const amount = parseFloat(form.amount);
    if (!code || amount <= 0) {
      setError('Please enter customer referral code and a valid amount.');
      return;
    }
    if (!form.receiptImageUrl) {
      setError('Please upload the bill/receipt image.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/OfflineTransaction/submit-as-seller`, {
        customerReferralCode: code,
        amount,
        receiptImageUrl: form.receiptImageUrl,
        transactionDate: form.transactionDate,
        transactionReference: form.transactionReference || null
      }, { headers: getAuthHeader() });
      setForm({ customerReferralCode: '', amount: '', transactionDate: new Date().toISOString().split('T')[0], transactionReference: '', receiptImageUrl: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  if (!isLoggedIn || userRole !== 'Seller') return null;

  return (
    <div className="offline-purchase-wrapper">
      <Header />
      <div className="offline-purchase-container">
        <h1>Submit Offline Sale</h1>
        <p className="page-subtitle">Customer bought from your store? Enter their referral code and upload the bill so they get points after admin verification.</p>

        {error && <div className="error-banner">{error}</div>}

        <div className="offline-form-section">
          <h2>Upload Bill & Transaction Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Referral Code *</label>
                <input
                  type="text"
                  placeholder="e.g. YA000123"
                  value={form.customerReferralCode}
                  onChange={(e) => setForm(prev => ({ ...prev, customerReferralCode: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (₹) *</label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Transaction Date *</label>
                <input type="date" value={form.transactionDate} onChange={(e) => setForm(prev => ({ ...prev, transactionDate: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Transaction Reference (optional)</label>
                <input type="text" placeholder="Bill no., bank ref, etc." value={form.transactionReference} onChange={(e) => setForm(prev => ({ ...prev, transactionReference: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label>Upload Bill / Receipt Image *</label>
              <div className="upload-area">
                <input type="file" accept="image/*" onChange={handleFileUpload} />
                {form.receiptImageUrl ? (
                  <div className="preview-wrap">
                    <img src={`${BASE_URL}${form.receiptImageUrl}`} alt="Receipt" />
                    <span className="uploaded-tag">Uploaded</span>
                  </div>
                ) : (
                  <p>Click or drop image here (JPG, PNG, max 5MB)</p>
                )}
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
          </form>
        </div>

        <div className="my-submissions-section">
          <h2>My Submissions</h2>
          {loading ? (
            <p>Loading...</p>
          ) : submissions.length === 0 ? (
            <p className="no-data">No submissions yet.</p>
          ) : (
            <div className="submissions-table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.offlineTransactionId}>
                      <td>{formatDate(s.transactionDate)}</td>
                      <td>{s.customerName} ({s.customerReferralCode})</td>
                      <td>₹{Number(s.amount).toFixed(2)}</td>
                      <td><span className={`status-badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OfflineSalePage;
