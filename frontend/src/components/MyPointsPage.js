import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import './MyPointsPage.css';

const API_URL = 'https://localhost:7193/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('jwtToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MyPointsPage = () => {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [levelEarnings, setLevelEarnings] = useState([]);
  const [levelConfig, setLevelConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [transactionFilter, setTransactionFilter] = useState('');

  useEffect(() => {
    fetchBalance();
    fetchLevelConfig();
    fetchLevelEarnings();
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, currentPage, transactionFilter]);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API_URL}/Points/my-balance`, {
        headers: getAuthHeader()
      });
      setBalance(response.data);
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      let url = `${API_URL}/Points/my-transactions?page=${currentPage}&pageSize=10`;
      if (transactionFilter) {
        url += `&type=${transactionFilter}`;
      }
      const response = await axios.get(url, {
        headers: getAuthHeader()
      });
      const data = response.data;
      // Handle $values wrapper
      const txns = data.transactions;
      setTransactions(Array.isArray(txns) ? txns : (txns?.$values || []));
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchLevelEarnings = async () => {
    try {
      const response = await axios.get(`${API_URL}/Points/my-level-earnings`, {
        headers: getAuthHeader()
      });
      setLevelEarnings(Array.isArray(response.data) ? response.data : response.data.$values || []);
    } catch (error) {
      console.error('Error fetching level earnings:', error);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'EARNED_SELF':
        return '🛒';
      case 'EARNED_REFERRAL':
        return '👥';
      case 'REDEEMED':
        return '🎁';
      default:
        return '💰';
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'EARNED_SELF':
        return 'Own Purchase';
      case 'EARNED_REFERRAL':
        return 'Referral Bonus';
      case 'REDEEMED':
        return 'Redeemed';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="points-page">
        <Header />
        <div className="points-container">
          <div className="loading-spinner">Loading your points...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="points-page">
      <Header />
      <div className="points-container">
        <h1 className="page-title">My Points</h1>

        {/* Points Summary Cards */}
        <div className="points-summary">
          <div className="summary-card balance-card">
            <div className="card-icon">💎</div>
            <div className="card-content">
              <span className="card-label">Current Balance</span>
              <span className="card-value">{balance?.currentBalance?.toFixed(2) || '0.00'}</span>
              <span className="card-subtitle">PV Points</span>
            </div>
          </div>
          <div className="summary-card earned-card">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <span className="card-label">Total Earned</span>
              <span className="card-value">{balance?.totalPointsEarned?.toFixed(2) || '0.00'}</span>
              <span className="card-subtitle">Lifetime</span>
            </div>
          </div>
          <div className="summary-card self-card">
            <div className="card-icon">🛒</div>
            <div className="card-content">
              <span className="card-label">Own Purchases</span>
              <span className="card-value">{balance?.pointsFromOwnPurchases?.toFixed(2) || '0.00'}</span>
              <span className="card-subtitle">Points</span>
            </div>
          </div>
          <div className="summary-card referral-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <span className="card-label">Referral Bonus</span>
              <span className="card-value">{balance?.pointsFromReferrals?.toFixed(2) || '0.00'}</span>
              <span className="card-subtitle">Points</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="points-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transaction History
          </button>
          <button
            className={`tab-btn ${activeTab === 'how-it-works' ? 'active' : ''}`}
            onClick={() => setActiveTab('how-it-works')}
          >
            How It Works
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <h2>Level-wise Earnings</h2>
              {levelEarnings.length > 0 ? (
                <div className="level-earnings-chart">
                  {levelEarnings.map((level) => (
                    <div key={level.levelId} className="level-bar-item">
                      <div className="level-info">
                        <span className="level-name">{level.levelName}</span>
                        <span className="level-points">{level.totalPoints?.toFixed(2)} pts</span>
                      </div>
                      <div className="level-bar-container">
                        <div 
                          className="level-bar-fill"
                          style={{ 
                            width: `${Math.min((level.totalPoints / (balance?.totalPointsEarned || 1)) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <span className="level-count">{level.transactionCount} transactions</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No earnings yet. Start shopping or refer friends to earn points!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="transactions-section">
              <div className="transactions-header">
                <h2>Transaction History</h2>
                <select 
                  value={transactionFilter} 
                  onChange={(e) => { setTransactionFilter(e.target.value); setCurrentPage(1); }}
                  className="filter-select"
                >
                  <option value="">All Transactions</option>
                  <option value="EARNED_SELF">Own Purchases</option>
                  <option value="EARNED_REFERRAL">Referral Bonus</option>
                  <option value="REDEEMED">Redeemed</option>
                </select>
              </div>

              {transactions.length > 0 ? (
                <>
                  <div className="transactions-list">
                    {transactions.map((txn) => (
                      <div key={txn.transactionId} className="transaction-item">
                        <div className="txn-icon">{getTransactionIcon(txn.transactionType)}</div>
                        <div className="txn-details">
                          <div className="txn-main">
                            <span className="txn-type">{getTransactionLabel(txn.transactionType)}</span>
                            <span className={`txn-amount ${txn.pointsAmount >= 0 ? 'positive' : 'negative'}`}>
                              {txn.pointsAmount >= 0 ? '+' : ''}{txn.pointsAmount?.toFixed(2)}
                            </span>
                          </div>
                          <div className="txn-sub">
                            <span className="txn-description">{txn.description}</span>
                            {txn.sourceUserName && txn.transactionType === 'EARNED_REFERRAL' && (
                              <span className="txn-source">From: {txn.sourceUserName}</span>
                            )}
                          </div>
                          <div className="txn-meta">
                            <span className="txn-date">{formatDate(txn.createdAt)}</span>
                            {txn.orderAmount && (
                              <span className="txn-order">Order: ₹{txn.orderAmount?.toFixed(2)}</span>
                            )}
                            <span className="txn-balance">Balance: {txn.balanceAfter?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

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
              ) : (
                <div className="no-data">
                  <p>No transactions found.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'how-it-works' && levelConfig && (
            <div className="how-it-works-section">
              <h2>How Points Work</h2>
              
              <div className="info-card">
                <h3>Earning Points</h3>
                <p>
                  When you or someone in your network makes a purchase, <strong>{levelConfig.pvPercentageOfOrder}%</strong> of 
                  the order value is converted into PV (Point Value) and distributed across 8 levels.
                </p>
              </div>

              <div className="levels-table">
                <h3>PV Distribution by Level</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Description</th>
                      <th>PV %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {levelConfig.levels?.map((level) => (
                      <tr key={level.levelId}>
                        <td className="level-cell">Level {level.levelId}</td>
                        <td>{level.levelName}</td>
                        <td className="percentage-cell">{level.pvPercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="example-card">
                <h3>Example</h3>
                <p>
                  If you make a purchase of <strong>₹1,000</strong>:
                </p>
                <ul>
                  <li>Total PV = ₹1,000 × 10% = <strong>₹100</strong></li>
                  <li>You (Level 1) get: ₹100 × 10% = <strong>₹10</strong></li>
                  <li>Your referrer (Level 2) gets: ₹100 × 40% = <strong>₹40</strong></li>
                  <li>And so on up the chain...</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MyPointsPage;
