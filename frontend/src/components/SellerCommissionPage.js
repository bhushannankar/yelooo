import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_URL } from '../config';
import './SellerCommissionPage.css';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SellerCommissionPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentMethod: 'Cheque',
    chequeNumber: '',
    transactionReference: '',
    bankName: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
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
      const [summaryRes, detailsRes] = await Promise.all([
        axios.get(`${API_URL}/SellerCommission/my-summary`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/SellerCommission/my-details`, { headers: getAuthHeader() })
      ]);
      setSummary(summaryRes.data);
      setDetails(detailsRes.data);
    } catch (err) {
      console.error('Error fetching commission data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
    setPaymentError(null);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentForm.amountPaid);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid amount');
      return;
    }
    if (paymentForm.paymentMethod === 'Cheque' && !paymentForm.chequeNumber?.trim()) {
      setPaymentError('Cheque number is required for cheque payments');
      return;
    }
    if (paymentForm.paymentMethod === 'Online' && !paymentForm.transactionReference?.trim()) {
      setPaymentError('Transaction reference is required for online payments');
      return;
    }
    if (!paymentForm.bankName?.trim()) {
      setPaymentError('Bank name is required');
      return;
    }

    setSubmitting(true);
    setPaymentError(null);
    try {
      await axios.post(`${API_URL}/SellerCommission/submit-payment`, {
        amountPaid: amount,
        paymentMethod: paymentForm.paymentMethod,
        chequeNumber: paymentForm.chequeNumber || null,
        transactionReference: paymentForm.transactionReference || null,
        bankName: paymentForm.bankName.trim(),
        paymentDate: paymentForm.paymentDate,
        notes: paymentForm.notes || null
      }, { headers: getAuthHeader() });
      setShowPaymentForm(false);
      setPaymentForm({
        amountPaid: '',
        paymentMethod: 'Cheque',
        chequeNumber: '',
        transactionReference: '',
        bankName: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchData();
    } catch (err) {
      setPaymentError(err.response?.data || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return '₹0.00';
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Confirmed': return 'status-confirmed';
      case 'Pending': return 'status-pending';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  if (!isLoggedIn || userRole !== 'Seller') return null;

  return (
    <div className="seller-commission-wrapper">
      <Header />
      <div className="seller-commission-container">
        <h1>My Commission to Yelooo</h1>
        <p className="page-subtitle">Commission payable to Yelooo based on your sales</p>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <>
                <div className="commission-summary-cards">
                  <div className="summary-card balance">
                    <span className="card-label">Balance Due</span>
                    <span className="card-value">{formatCurrency(summary.balanceDue)}</span>
                  </div>
                  <div className="summary-card">
                    <span className="card-label">Total Commission Accrued</span>
                    <span className="card-value">{formatCurrency(summary.totalCommissionDue)}</span>
                  </div>
                </div>
                <div className="payment-status-cards">
                  <div className="summary-card paid-by-seller">
                    <span className="card-label">Total Paid by You</span>
                    <span className="card-value">{formatCurrency(summary.totalPaidBySeller ?? summary.totalPaid)}</span>
                    <span className="card-hint">Amount you have submitted to Yelooo</span>
                  </div>
                  <div className="summary-card confirmed">
                    <span className="card-label">Confirmed by Admin</span>
                    <span className="card-value">{formatCurrency(summary.totalConfirmedByAdmin ?? summary.totalPaid)}</span>
                    <span className="card-hint">Amount acknowledged / verified by admin</span>
                  </div>
                  {((summary.pendingPaymentAmount ?? 0) > 0 || (summary.rejectedPaymentAmount ?? 0) > 0) && (
                    <div className="summary-card status-breakdown">
                      <span className="card-label">Status Breakdown</span>
                      <div className="status-breakdown-list">
                        {(summary.pendingPaymentAmount ?? 0) > 0 && (
                          <span className="card-hint">Pending: {formatCurrency(summary.pendingPaymentAmount)}</span>
                        )}
                        {(summary.rejectedPaymentAmount ?? 0) > 0 && (
                          <span className="card-hint rejected">Rejected: {formatCurrency(summary.rejectedPaymentAmount)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="action-bar">
              <button
                className="submit-payment-btn"
                onClick={() => setShowPaymentForm(true)}
              >
                + Record Payment
              </button>
            </div>

            {/* Payment History */}
            {details?.payments && details.payments.length > 0 && (
              <div className="section">
                <h2>Payment History</h2>
                <div className="payments-table-wrap">
                  <table className="payments-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Bank</th>
                        <th>Reference</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.payments.map((p) => (
                        <tr key={p.sellerCommissionPaymentId}>
                          <td>{formatDate(p.paymentDate)}</td>
                          <td>{formatCurrency(p.amountPaid)}</td>
                          <td>{p.paymentMethod}</td>
                          <td>{p.bankName || '-'}</td>
                          <td>{p.chequeNumber || p.transactionReference || '-'}</td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(p.status)}`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Commission Breakdown */}
            {details?.commissions && details.commissions.length > 0 && (
              <div className="section">
                <h2>Commission Breakdown</h2>
                <div className="commissions-table-wrap">
                  <table className="commissions-table">
                    <thead>
                      <tr>
                        <th>Order Date</th>
                        <th>Product</th>
                        <th>Transaction</th>
                        <th>Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.commissions.map((c, i) => (
                        <tr key={i}>
                          <td>{formatDate(c.orderDate)}</td>
                          <td>{c.productName}</td>
                          <td>{formatCurrency(c.transactionAmount)}</td>
                          <td>{formatCurrency(c.commissionAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="modal-overlay" onClick={() => !submitting && setShowPaymentForm(false)}>
            <div className="modal-content payment-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Record Payment to Yelooo</h2>
              {paymentError && <div className="error-msg">{paymentError}</div>}
              <form onSubmit={handleSubmitPayment}>
                <div className="form-group">
                  <label>Amount Paid *</label>
                  <input
                    type="number"
                    name="amountPaid"
                    value={paymentForm.amountPaid}
                    onChange={handlePaymentChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentChange}
                    required
                  >
                    <option value="Cheque">Cheque</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                {paymentForm.paymentMethod === 'Cheque' && (
                  <div className="form-group">
                    <label>Cheque Number *</label>
                    <input
                      type="text"
                      name="chequeNumber"
                      value={paymentForm.chequeNumber}
                      onChange={handlePaymentChange}
                    />
                  </div>
                )}
                {paymentForm.paymentMethod === 'Online' && (
                  <div className="form-group">
                    <label>Transaction Reference *</label>
                    <input
                      type="text"
                      name="transactionReference"
                      value={paymentForm.transactionReference}
                      onChange={handlePaymentChange}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    value={paymentForm.bankName}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={paymentForm.notes}
                    onChange={handlePaymentChange}
                    rows={3}
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowPaymentForm(false)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Payment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerCommissionPage;
