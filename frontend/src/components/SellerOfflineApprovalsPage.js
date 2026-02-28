import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_URL, BASE_URL } from '../config';
import './AdminOfflineTransactionsPage.css';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SellerOfflineApprovalsPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'Pending', fromDate: '', toDate: '' });
  const [rejectNotes, setRejectNotes] = useState({});

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
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      const res = await axios.get(`${API_URL}/OfflineTransaction/seller/pending?${params}`, { headers: getAuthHeader() });
      const list = res.data || [];
      setTransactions(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API_URL}/OfflineTransaction/seller/${id}/status`, { status: 'Approved' }, { headers: getAuthHeader() });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const notes = rejectNotes[id] || '';
    if (!window.confirm('Reject this offline purchase?')) return;
    try {
      await axios.put(`${API_URL}/OfflineTransaction/seller/${id}/status`, { status: 'Rejected', notes }, { headers: getAuthHeader() });
      setRejectNotes(prev => ({ ...prev, [id]: '' }));
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || 'Failed to reject');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  if (!isLoggedIn || userRole !== 'Seller') return null;

  const pendingCount = transactions.filter(t => t.status === 'Pending').length;

  return (
    <div className="admin-offline-wrapper">
      <Header />
      <div className="admin-offline-container">
        <h1>Approve Offline Purchases</h1>
        <p className="page-subtitle">Customers submit offline purchases from your store here. Approve to credit points to the customer. Admin can also review.</p>

        <div className="summary-cards">
          <div className="card"><span className="label">Total</span><span className="val">{transactions.length}</span></div>
          <div className="card"><span className="label">Pending</span><span className="val pending">{pendingCount}</span></div>
        </div>

        <div className="filters-bar">
          <input type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
          <input type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
          <select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <button onClick={handleApplyFilters}>Apply</button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="no-data">No offline purchases found.</p>
        ) : (
          <div className="transactions-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer (Code)</th>
                  <th>Amount</th>
                  <th>Ref</th>
                  <th>Receipt</th>
                  <th>Status</th>
                  <th>Submitted By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.offlineTransactionId}>
                    <td>{formatDate(t.transactionDate)}</td>
                    <td>{t.customerName} ({t.customerReferralCode})</td>
                    <td>₹{Number(t.amount).toFixed(2)}</td>
                    <td>{t.transactionReference || '-'}</td>
                    <td>
                      {t.receiptImageUrl && (
                        <a href={`${BASE_URL}${t.receiptImageUrl}`} target="_blank" rel="noopener noreferrer">View</a>
                      )}
                    </td>
                    <td><span className={`status-badge ${t.status?.toLowerCase()}`}>{t.status}</span></td>
                    <td>{t.submittedBy}</td>
                    <td>
                      {t.status === 'Pending' && (
                        <div className="action-btns">
                          <button className="approve-btn" onClick={() => handleApprove(t.offlineTransactionId)}>Approve</button>
                          <input
                            type="text"
                            placeholder="Reject reason"
                            value={rejectNotes[t.offlineTransactionId] || ''}
                            onChange={(e) => setRejectNotes(prev => ({ ...prev, [t.offlineTransactionId]: e.target.value }))}
                            className="reject-input"
                          />
                          <button className="reject-btn" onClick={() => handleReject(t.offlineTransactionId)}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SellerOfflineApprovalsPage;
