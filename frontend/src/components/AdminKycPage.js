import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { API_URL, BASE_URL } from '../config';
import './AdminKycPage.css';

const AdminKycPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);
  const token = localStorage.getItem('jwtToken');

  const [kycList, setKycList] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState('Pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchKycList = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/Kyc/all?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Handle both direct array and $values wrapped response
      const data = response.data;
      const list = Array.isArray(data) ? data : (data?.$values || []);
      setKycList(list);
    } catch (err) {
      console.error('Failed to load KYC list:', err);
      setKycList([]);
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/Kyc/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load KYC stats:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/');
      return;
    }
    fetchKycList();
    fetchStats();
  }, [isLoggedIn, userRole, navigate, fetchKycList, fetchStats]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const viewKycDetails = async (kycId) => {
    setDetailLoading(true);
    try {
      const response = await axios.get(`${API_URL}/Kyc/${kycId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedKyc(response.data);
    } catch (err) {
      showMessage('error', 'Failed to load KYC details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (kycId) => {
    if (!window.confirm('Are you sure you want to approve this KYC?')) return;
    
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/Kyc/${kycId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'KYC approved successfully');
      setSelectedKyc(null);
      fetchKycList();
      fetchStats();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to approve KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showMessage('error', 'Please provide a rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/Kyc/${selectedKyc.kycDocumentId}/reject`, 
        { rejectionReason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      showMessage('success', 'KYC rejected');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedKyc(null);
      fetchKycList();
      fetchStats();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to reject KYC');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      'Pending': 'badge-warning',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger'
    };
    return classes[status] || 'badge-default';
  };

  if (!isLoggedIn || userRole !== 'Admin') {
    return null;
  }

  return (
    <div className="admin-kyc-page">
      <Header />
      <div className="admin-kyc-container">
        <div className="page-header">
          <h1>KYC Verification Management</h1>
          <p>Review and approve customer KYC documents</p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card pending" onClick={() => setFilter('Pending')}>
            <div className="stat-number">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
          <div className="stat-card approved" onClick={() => setFilter('Approved')}>
            <div className="stat-number">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card rejected" onClick={() => setFilter('Rejected')}>
            <div className="stat-number">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card total" onClick={() => setFilter('')}>
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'Pending' ? 'active' : ''}`}
            onClick={() => setFilter('Pending')}
          >
            Pending
          </button>
          <button 
            className={`filter-tab ${filter === 'Approved' ? 'active' : ''}`}
            onClick={() => setFilter('Approved')}
          >
            Approved
          </button>
          <button 
            className={`filter-tab ${filter === 'Rejected' ? 'active' : ''}`}
            onClick={() => setFilter('Rejected')}
          >
            Rejected
          </button>
          <button 
            className={`filter-tab ${filter === '' ? 'active' : ''}`}
            onClick={() => setFilter('')}
          >
            All
          </button>
        </div>

        <div className="kyc-content">
          {/* KYC List */}
          <div className="kyc-list-panel">
            {loading ? (
              <div className="loading">Loading KYC requests...</div>
            ) : kycList.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <p>No KYC requests found</p>
              </div>
            ) : (
              <div className="kyc-list">
                {kycList.map((kyc) => (
                  <div 
                    key={kyc.kycDocumentId} 
                    className={`kyc-list-item ${selectedKyc?.kycDocumentId === kyc.kycDocumentId ? 'selected' : ''}`}
                    onClick={() => viewKycDetails(kyc.kycDocumentId)}
                  >
                    <div className="kyc-item-header">
                      <span className="username">{kyc.fullName || kyc.username}</span>
                      <span className={`badge ${getStatusBadge(kyc.status)}`}>{kyc.status}</span>
                    </div>
                    <div className="kyc-item-info">
                      <p><strong>Document:</strong> {kyc.documentType}</p>
                      <p><strong>Submitted:</strong> {new Date(kyc.submittedAt).toLocaleDateString()}</p>
                      <p><strong>Email:</strong> {kyc.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KYC Detail Panel */}
          <div className="kyc-detail-panel">
            {detailLoading ? (
              <div className="loading">Loading details...</div>
            ) : selectedKyc ? (
              <div className="kyc-detail">
                <div className="detail-header">
                  <h2>KYC Details</h2>
                  <span className={`badge ${getStatusBadge(selectedKyc.status)}`}>
                    {selectedKyc.status}
                  </span>
                </div>

                {/* User Info */}
                <div className="detail-section">
                  <h3>Customer Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Username</label>
                      <span>{selectedKyc.user.username}</span>
                    </div>
                    <div className="info-item">
                      <label>Full Name</label>
                      <span>{selectedKyc.user.fullName || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <span>{selectedKyc.user.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone</label>
                      <span>{selectedKyc.user.phoneNumber || 'Not provided'}</span>
                    </div>
                    <div className="info-item full-width">
                      <label>Address</label>
                      <span>
                        {selectedKyc.user.address ? 
                          `${selectedKyc.user.address}, ${selectedKyc.user.city || ''} ${selectedKyc.user.state || ''} ${selectedKyc.user.pinCode || ''}` 
                          : 'Not provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                <div className="detail-section">
                  <h3>Document Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Document Type</label>
                      <span>{selectedKyc.documentType}</span>
                    </div>
                    <div className="info-item">
                      <label>Document Number</label>
                      <span>{selectedKyc.documentNumber}</span>
                    </div>
                    <div className="info-item">
                      <label>Submitted On</label>
                      <span>{new Date(selectedKyc.submittedAt).toLocaleString()}</span>
                    </div>
                    {selectedKyc.reviewedAt && (
                      <div className="info-item">
                        <label>Reviewed On</label>
                        <span>{new Date(selectedKyc.reviewedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedKyc.reviewedBy && (
                      <div className="info-item">
                        <label>Reviewed By</label>
                        <span>{selectedKyc.reviewedBy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Images */}
                <div className="detail-section">
                  <h3>Document Images</h3>
                  <div className="document-images">
                    <div className="doc-image">
                      <label>Front Side</label>
                      <a href={`${BASE_URL}${selectedKyc.documentFrontUrl}`} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={`${BASE_URL}${selectedKyc.documentFrontUrl}`} 
                          alt="Document Front" 
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="image-placeholder" style={{ display: 'none' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <span>Click to view</span>
                        </div>
                      </a>
                    </div>
                    {selectedKyc.documentBackUrl && (
                      <div className="doc-image">
                        <label>Back Side</label>
                        <a href={`${BASE_URL}${selectedKyc.documentBackUrl}`} target="_blank" rel="noopener noreferrer">
                          <img 
                            src={`${BASE_URL}${selectedKyc.documentBackUrl}`} 
                            alt="Document Back"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                          <div className="image-placeholder" style={{ display: 'none' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            <span>Click to view</span>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                {selectedKyc.user.bankDetails && selectedKyc.user.bankDetails.length > 0 && (
                  <div className="detail-section">
                    <h3>Bank Details</h3>
                    {selectedKyc.user.bankDetails.map((bank, index) => (
                      <div key={index} className="info-grid">
                        <div className="info-item">
                          <label>Account Holder</label>
                          <span>{bank.accountHolderName}</span>
                        </div>
                        <div className="info-item">
                          <label>Account Number</label>
                          <span>{bank.accountNumber}</span>
                        </div>
                        <div className="info-item">
                          <label>Bank Name</label>
                          <span>{bank.bankName}</span>
                        </div>
                        <div className="info-item">
                          <label>Branch</label>
                          <span>{bank.branchName}</span>
                        </div>
                        <div className="info-item">
                          <label>IFSC Code</label>
                          <span>{bank.ifscCode}</span>
                        </div>
                        <div className="info-item">
                          <label>Account Type</label>
                          <span>{bank.accountType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedKyc.rejectionReason && (
                  <div className="detail-section rejection">
                    <h3>Rejection Reason</h3>
                    <p>{selectedKyc.rejectionReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedKyc.status === 'Pending' && (
                  <div className="action-buttons">
                    <button 
                      className="btn-reject"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                    <button 
                      className="btn-approve"
                      onClick={() => handleApprove(selectedKyc.kycDocumentId)}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-detail">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Select a KYC request to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Reject KYC</h3>
            <p>Please provide a reason for rejection. This will be shown to the customer.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="4"
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-reject" 
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminKycPage;
