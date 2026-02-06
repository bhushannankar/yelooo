import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import { exportToCSV, exportToXLSX, exportToXLS, exportToPDF } from '../utils/reportExport';
import './AdminPointsReportPage.css';

const API_URL = 'https://localhost:7193/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminPointsReportPage = () => {
  const [users, setUsers] = useState([]);
  const [totals, setTotals] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [levelConfig, setLevelConfig] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalEarned');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchLevelConfig();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/Points/admin/all-users?page=${currentPage}&pageSize=15&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      const rawUsers = response.data.users;
      setUsers(Array.isArray(rawUsers) ? rawUsers : (rawUsers?.$values || []));
      setTotals(response.data.totals);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevelConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/Points/level-config`);
      const data = response.data;
      // Handle $values wrapper
      setLevelConfig({
        ...data,
        levels: Array.isArray(data.levels) ? data.levels : (data.levels?.$values || [])
      });
    } catch (error) {
      console.error('Error fetching level config:', error);
    }
  };

  const normalizeArray = (arr) => Array.isArray(arr) ? arr : (arr?.$values || []);

  const fetchUserDetail = async (userId) => {
    try {
      setDetailLoading(true);
      const response = await axios.get(`${API_URL}/Points/admin/user/${userId}`, {
        headers: getAuthHeader()
      });
      const data = response.data;
      setUserDetail({
        ...data,
        levelEarnings: normalizeArray(data?.levelEarnings),
        recentTransactions: normalizeArray(data?.recentTransactions)
      });
    } catch (error) {
      console.error('Error fetching user detail:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserDetail(user.userId);
  };

  const closeDetail = () => {
    setSelectedUser(null);
    setUserDetail(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handleExport = async (format) => {
    let data = users;
    if (users.length < (pagination?.totalCount ?? 0)) {
      try {
        const res = await axios.get(
          `${API_URL}/Points/admin/all-users?page=1&pageSize=10000&sortBy=${sortBy}&sortOrder=${sortOrder}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`,
          { headers: getAuthHeader() }
        );
        data = Array.isArray(res.data.users) ? res.data.users : (res.data.users?.$values || []);
      } catch (err) {
        console.error('Export fetch error:', err);
        data = users;
      }
    }
    const exportData = data.map(u => ({
      Username: u.username || '',
      Email: u.email || '',
      TotalEarned: u.balance?.totalEarned?.toFixed(2) || '0.00',
      SelfEarned: u.selfEarnings?.toFixed(2) || '0.00',
      ReferralEarned: u.referralEarnings?.toFixed(2) || '0.00',
      CurrentBalance: u.balance?.currentBalance?.toFixed(2) || '0.00',
    }));
    const name = `customer-points-report-${new Date().toISOString().slice(0, 10)}`;
    if (format === 'csv') exportToCSV(exportData, name);
    else if (format === 'xlsx') exportToXLSX(exportData, name, 'Points Report');
    else if (format === 'xls') exportToXLS(exportData, name, 'Points Report');
    else if (format === 'pdf') exportToPDF(exportData, name, 'Customer Points Report');
  };

  return (
    <div className="admin-points-page">
      <Header />
      <div className="admin-points-container">
        <div className="page-header-row">
          <h1 className="page-title">Points Report</h1>
          <div className="export-buttons">
            <span className="export-label">Download:</span>
            <button type="button" className="export-btn" onClick={() => handleExport('csv')}>CSV</button>
            <button type="button" className="export-btn" onClick={() => handleExport('xlsx')}>XLSX</button>
            <button type="button" className="export-btn" onClick={() => handleExport('xls')}>XLS</button>
            <button type="button" className="export-btn" onClick={() => handleExport('pdf')}>PDF</button>
          </div>
        </div>

        {/* Summary Cards */}
        {totals && (
          <div className="totals-summary">
            <div className="total-card">
              <span className="total-label">Total Points Distributed</span>
              <span className="total-value">{totals.totalPointsDistributed?.toFixed(2)}</span>
            </div>
            <div className="total-card">
              <span className="total-label">Total Points Redeemed</span>
              <span className="total-value">{totals.totalPointsRedeemed?.toFixed(2)}</span>
            </div>
            <div className="total-card">
              <span className="total-label">Total Current Balance</span>
              <span className="total-value">{totals.totalCurrentBalance?.toFixed(2)}</span>
            </div>
            <div className="total-card">
              <span className="total-label">Total Users</span>
              <span className="total-value">{totals.totalUsers}</span>
            </div>
          </div>
        )}

        {/* Level Configuration */}
        {levelConfig && (
          <div className="level-config-section">
            <h2>PV Distribution Configuration</h2>
            <div className="config-info">
              <span>PV Rate: <strong>{levelConfig.pvPercentageOfOrder}%</strong> of order value</span>
            </div>
            <div className="levels-grid">
              {levelConfig.levels?.map((level) => (
                <div key={level.levelId} className="level-chip">
                  <span className="level-num">L{level.levelId}</span>
                  <span className="level-pct">{level.pvPercentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="filters-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by username, email, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              <table className="users-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('username')} className="sortable">
                      User {getSortIcon('username')}
                    </th>
                    <th onClick={() => handleSort('totalEarned')} className="sortable">
                      Total Earned {getSortIcon('totalEarned')}
                    </th>
                    <th onClick={() => handleSort('selfEarn')} className="sortable">
                      Self Earned {getSortIcon('selfEarn')}
                    </th>
                    <th onClick={() => handleSort('referralEarn')} className="sortable">
                      Referral Earned {getSortIcon('referralEarn')}
                    </th>
                    <th onClick={() => handleSort('balance')} className="sortable">
                      Balance {getSortIcon('balance')}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <div className="user-cell">
                          <span className="user-name">{user.username}</span>
                          <span className="user-email">{user.email}</span>
                        </div>
                      </td>
                      <td className="number-cell">{user.balance?.totalEarned?.toFixed(2) || '0.00'}</td>
                      <td className="number-cell">{user.selfEarnings?.toFixed(2) || '0.00'}</td>
                      <td className="number-cell highlight">{user.referralEarnings?.toFixed(2) || '0.00'}</td>
                      <td className="number-cell balance">{user.balance?.currentBalance?.toFixed(2) || '0.00'}</td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => handleUserClick(user)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pagination && pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {pagination.totalPages}</span>
                  <button
                    disabled={currentPage === pagination.totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="detail-modal-overlay" onClick={closeDetail}>
            <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>User Points Details</h2>
                <button className="close-btn" onClick={closeDetail}>×</button>
              </div>

              {detailLoading ? (
                <div className="loading">Loading...</div>
              ) : userDetail && (
                <div className="modal-content">
                  <div className="user-info-section">
                    <div className="user-avatar">{userDetail.user?.username?.charAt(0)?.toUpperCase()}</div>
                    <div className="user-info">
                      <h3>{userDetail.user?.username}</h3>
                      <p>{userDetail.user?.email}</p>
                      {(userDetail.user?.firstName || userDetail.user?.lastName) && (
                        <p>{userDetail.user?.firstName} {userDetail.user?.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="detail-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Earned</span>
                      <span className="stat-value">{userDetail.balance?.totalPointsEarned?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Redeemed</span>
                      <span className="stat-value">{userDetail.balance?.totalPointsRedeemed?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Current Balance</span>
                      <span className="stat-value highlight">{userDetail.balance?.currentBalance?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  {userDetail.levelEarnings?.length > 0 && (
                    <div className="level-earnings-section">
                      <h4>Level-wise Earnings</h4>
                      <div className="level-earnings-grid">
                        {userDetail.levelEarnings.map((le) => (
                          <div key={le.levelId} className="level-earning-item">
                            <span className="le-level">Level {le.levelId}</span>
                            <span className="le-points">{le.totalPoints?.toFixed(2)} pts</span>
                            <span className="le-count">{le.transactionCount} txns</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {userDetail.recentTransactions?.length > 0 && (
                    <div className="transactions-section">
                      <h4>Recent Transactions</h4>
                      <div className="transactions-list">
                        {userDetail.recentTransactions.slice(0, 10).map((txn) => (
                          <div key={txn.transactionId} className="txn-row">
                            <div className="txn-type-badge">
                              {txn.transactionType === 'EARNED_SELF' ? '🛒' : '👥'}
                            </div>
                            <div className="txn-info">
                              <span className="txn-desc">{txn.description}</span>
                              <span className="txn-date">{formatDate(txn.createdAt)}</span>
                            </div>
                            <span className="txn-amount">+{txn.pointsAmount?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

export default AdminPointsReportPage;
