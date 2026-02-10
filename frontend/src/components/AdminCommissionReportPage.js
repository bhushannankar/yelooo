import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { exportToCSV, exportToXLSX, exportToXLS, exportToPDF } from '../utils/reportExport';
import { API_URL } from '../config';
import './AdminCommissionReportPage.css';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminCommissionReportPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const userRole = useSelector((state) => state.auth.userRole);

  const [report, setReport] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerDetails, setSellerDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentFilters, setPaymentFilters] = useState({
    fromDate: '',
    toDate: '',
    bankName: '',
    status: ''
  });

  useEffect(() => {
    if (!isLoggedIn || userRole !== 'Admin') {
      navigate('/');
      return;
    }
    fetchReport();
    fetchSummary();
  }, [isLoggedIn, userRole, navigate]);

  useEffect(() => {
    if (isLoggedIn && userRole === 'Admin') {
      fetchPayments();
    }
  }, [isLoggedIn, userRole]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/Commission/report`, {
        headers: getAuthHeader()
      });
      const data = response.data;
      setReport(Array.isArray(data) ? data : (data?.$values || []));
    } catch (err) {
      console.error('Error fetching commission report:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/Commission/summary`, {
        headers: getAuthHeader()
      });
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching commission summary:', err);
    }
  };

  const fetchSellerDetails = async (sellerId) => {
    try {
      setDetailLoading(true);
      const response = await axios.get(`${API_URL}/Commission/seller/${sellerId}`, {
        headers: getAuthHeader()
      });
      const data = response.data;
      setSellerDetails(Array.isArray(data) ? data : (data?.$values || []));
    } catch (err) {
      console.error('Error fetching seller details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    fetchSellerDetails(seller.sellerId);
  };

  const closeDetail = () => {
    setSelectedSeller(null);
    setSellerDetails([]);
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const params = new URLSearchParams();
      if (paymentFilters.fromDate) params.append('fromDate', paymentFilters.fromDate);
      if (paymentFilters.toDate) params.append('toDate', paymentFilters.toDate);
      if (paymentFilters.bankName?.trim()) params.append('bankName', paymentFilters.bankName.trim());
      if (paymentFilters.status?.trim()) params.append('status', paymentFilters.status.trim());
      const response = await axios.get(`${API_URL}/Commission/payments?${params.toString()}`, {
        headers: getAuthHeader()
      });
      const data = response.data;
      setPayments(Array.isArray(data) ? data : (data?.$values || []));
    } catch (err) {
      console.error('Error fetching commission payments:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setPaymentFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchPayments();
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/Commission/payments/${id}/status`, { status }, {
        headers: getAuthHeader()
      });
      fetchPayments();
    } catch (err) {
      console.error('Error updating payment status:', err);
    }
  };

  const formatCurrency = (val) => {
    if (val == null) return '₹0.00';
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleExportCommissionReport = (format) => {
    const data = report.map(r => ({
      Seller: r.sellerName || '',
      Email: r.sellerEmail || '',
      TransactionCount: r.transactionCount ?? 0,
      TotalTransactionAmount: r.totalTransactionAmount ?? 0,
      TotalCommission: r.totalCommissionAmount ?? 0,
    }));
    const name = `commission-report-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'csv') exportToCSV(data, name);
    else if (format === 'xlsx') exportToXLSX(data, name, 'Commission Report');
    else if (format === 'xls') exportToXLS(data, name, 'Commission Report');
    else if (format === 'pdf') exportToPDF(data, name, 'Seller Commission Report');
  };

  const handleExportPayments = (format) => {
    const data = payments.map(p => ({
      Seller: p.sellerName || '',
      Email: p.sellerEmail || '',
      AmountPaid: p.amountPaid ?? 0,
      PaymentMethod: p.paymentMethod || '',
      ChequeOrRef: p.chequeNumber || p.transactionReference || '',
      BankName: p.bankName || '',
      PaymentDate: formatDate(p.paymentDate),
      Status: p.status || '',
      AccountHolder: p.sellerBankDetails?.accountHolderName || '',
      BankDetails: p.sellerBankDetails ? `${p.sellerBankDetails.bankName} - ${p.sellerBankDetails.branchName}` : '',
      AccountNumber: p.sellerBankDetails?.accountNumber || '',
      IFSC: p.sellerBankDetails?.ifscCode || '',
    }));
    const name = `commission-payments-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'csv') exportToCSV(data, name);
    else if (format === 'xlsx') exportToXLSX(data, name, 'Commission Payments');
    else if (format === 'xls') exportToXLS(data, name, 'Commission Payments');
    else if (format === 'pdf') exportToPDF(data, name, 'Commission Payments (CA Report)');
  };

  if (!isLoggedIn || userRole !== 'Admin') {
    return null;
  }

  return (
    <div className="admin-commission-wrapper">
      <Header />
      <div className="admin-commission-container">
        <div className="page-header-row">
          <div>
            <h1>Seller Commission Report</h1>
            <p className="page-subtitle">Commission received from each seller based on transactions</p>
          </div>
          <div className="export-buttons">
            <span className="export-label">Download Report:</span>
            <button type="button" className="export-btn" onClick={() => handleExportCommissionReport('csv')}>CSV</button>
            <button type="button" className="export-btn" onClick={() => handleExportCommissionReport('xlsx')}>XLSX</button>
            <button type="button" className="export-btn" onClick={() => handleExportCommissionReport('xls')}>XLS</button>
            <button type="button" className="export-btn" onClick={() => handleExportCommissionReport('pdf')}>PDF</button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="commission-summary-cards">
            <div className="summary-card">
              <span className="card-label">Total Commission Received</span>
              <span className="card-value primary">{formatCurrency(summary.totalCommissionAmount)}</span>
            </div>
            <div className="summary-card">
              <span className="card-label">Total Transaction Value</span>
              <span className="card-value">{formatCurrency(summary.totalTransactionAmount)}</span>
            </div>
            <div className="summary-card">
              <span className="card-label">Transactions Count</span>
              <span className="card-value">{summary.transactionCount || 0}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading commission report...</div>
        ) : report.length === 0 ? (
          <div className="no-data">
            No commission data yet. Commission is recorded when customers place orders for products sold by sellers.
          </div>
        ) : (
          <div className="report-table-container">
            <table className="commission-report-table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Email</th>
                  <th>Transaction Count</th>
                  <th>Total Transaction Amount</th>
                  <th>Total Commission</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {report.map((row) => (
                  <tr key={row.sellerId}>
                    <td>{row.sellerName}</td>
                    <td>{row.sellerEmail}</td>
                    <td>{row.transactionCount}</td>
                    <td>{formatCurrency(row.totalTransactionAmount)}</td>
                    <td className="commission-amount">{formatCurrency(row.totalCommissionAmount)}</td>
                    <td>
                      <button
                        className="view-details-btn"
                        onClick={() => handleSellerClick(row)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Commission Payments Report (for CA) */}
        <div className="payments-section">
          <div className="payments-header-row">
            <div>
              <h2>Commission Payments (CA Report)</h2>
              <p className="section-subtitle">Payments submitted by sellers – filter by date or bank for CA reporting</p>
            </div>
            <div className="export-buttons">
              <span className="export-label">Download Payments:</span>
              <button type="button" className="export-btn" onClick={() => handleExportPayments('csv')}>CSV</button>
              <button type="button" className="export-btn" onClick={() => handleExportPayments('xlsx')}>XLSX</button>
              <button type="button" className="export-btn" onClick={() => handleExportPayments('xls')}>XLS</button>
              <button type="button" className="export-btn" onClick={() => handleExportPayments('pdf')}>PDF</button>
            </div>
          </div>
          <div className="payments-filters">
            <div className="filter-group">
              <label>From Date</label>
              <input type="date" name="fromDate" value={paymentFilters.fromDate} onChange={handleFilterChange} />
            </div>
            <div className="filter-group">
              <label>To Date</label>
              <input type="date" name="toDate" value={paymentFilters.toDate} onChange={handleFilterChange} />
            </div>
            <div className="filter-group">
              <label>Bank Name</label>
              <input type="text" name="bankName" value={paymentFilters.bankName} onChange={handleFilterChange} placeholder="Filter by bank" />
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select name="status" value={paymentFilters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <button className="apply-filters-btn" onClick={handleApplyFilters}>Apply Filters</button>
          </div>
          {paymentsLoading ? (
            <div className="loading">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="no-data">No commission payments found.</div>
          ) : (
            <div className="payments-table-container">
              <table className="payments-report-table">
                <thead>
                  <tr>
                    <th>Seller</th>
                    <th>Email</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Cheque / Ref</th>
                    <th>Bank</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                    <th>Seller Bank Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.sellerCommissionPaymentId}>
                      <td>{p.sellerName}</td>
                      <td>{p.sellerEmail}</td>
                      <td>{formatCurrency(p.amountPaid)}</td>
                      <td>{p.paymentMethod}</td>
                      <td>{p.chequeNumber || p.transactionReference || '-'}</td>
                      <td>{p.bankName || '-'}</td>
                      <td>{formatDate(p.paymentDate)}</td>
                      <td>
                        <span className={`status-badge status-${p.status?.toLowerCase()}`}>{p.status}</span>
                      </td>
                      <td>
                        {p.sellerBankDetails ? (
                          <div className="seller-bank-info">
                            <div>{p.sellerBankDetails.accountHolderName}</div>
                            <div>{p.sellerBankDetails.bankName} - {p.sellerBankDetails.branchName}</div>
                            <div>A/c: {p.sellerBankDetails.accountNumber} | IFSC: {p.sellerBankDetails.ifscCode}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td>
                        {p.status === 'Pending' && (
                          <div className="payment-actions">
                            <button className="confirm-btn" onClick={() => handleUpdatePaymentStatus(p.sellerCommissionPaymentId, 'Confirmed')}>Confirm</button>
                            <button className="reject-btn" onClick={() => handleUpdatePaymentStatus(p.sellerCommissionPaymentId, 'Rejected')}>Reject</button>
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

        {/* Seller Detail Modal */}
        {selectedSeller && (
          <div className="modal-overlay" onClick={closeDetail}>
            <div className="modal-content commission-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Commission Details: {selectedSeller.sellerName}</h2>
                <button className="close-btn" onClick={closeDetail}>×</button>
              </div>
              {detailLoading ? (
                <div className="loading">Loading...</div>
              ) : sellerDetails.length === 0 ? (
                <p>No transaction details found.</p>
              ) : (
                <div className="detail-table-wrap">
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Order Date</th>
                        <th>Product</th>
                        <th>Transaction Amount</th>
                        <th>Commission %</th>
                        <th>Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerDetails.map((d) => (
                        <tr key={d.sellerCommissionId}>
                          <td>{formatDate(d.orderDate)}</td>
                          <td>{d.productName}</td>
                          <td>{formatCurrency(d.transactionAmount)}</td>
                          <td>{d.commissionPercent}%</td>
                          <td>{formatCurrency(d.commissionAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default AdminCommissionReportPage;
