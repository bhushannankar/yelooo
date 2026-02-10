import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { API_URL } from '../config';
import './MyNetworkPage.css';

const MyNetworkPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [networkData, setNetworkData] = useState(null);
  const [legsData, setLegsData] = useState(null);
  const [uplineData, setUplineData] = useState(null);
  const [referralInfo, setReferralInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandedLegs, setExpandedLegs] = useState({});

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [networkRes, legsRes, uplineRes, referralRes] = await Promise.all([
        axios.get(`${API_URL}/Referral/my-network`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/Referral/my-legs`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/Referral/my-upline`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/Referral/my-referral-code`, { headers: getAuthHeader() })
      ]);

      // Normalize data to handle $values wrapper from .NET API
      const normalizeArray = (arr) => Array.isArray(arr) ? arr : (arr?.$values || []);
      
      const network = networkRes.data;
      if (network) {
        network.levelCounts = normalizeArray(network.levelCounts);
        network.directReferrals = normalizeArray(network.directReferrals);
        network.downline = normalizeArray(network.downline);
      }
      setNetworkData(network);

      const legs = legsRes.data;
      if (legs) {
        legs.legs = normalizeArray(legs.legs);
        // Normalize nested members and levelBreakdown in each leg
        if (legs.legs) {
          legs.legs = legs.legs.map(leg => ({
            ...leg,
            members: normalizeArray(leg.members),
            levelBreakdown: normalizeArray(leg.levelBreakdown)
          }));
        }
      }
      setLegsData(legs);

      const upline = uplineRes.data;
      if (upline) {
        upline.upline = normalizeArray(upline.upline);
      }
      setUplineData(upline);
      
      setReferralInfo(referralRes.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching network data:', err);
      setError('Failed to load network data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (referralInfo?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralInfo.referralLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const sendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    try {
      await axios.post(`${API_URL}/Referral/send-invitation`, 
        { email: inviteEmail },
        { headers: getAuthHeader() }
      );
      alert(`Invitation sent to ${inviteEmail}! Share your referral link with them.`);
      setInviteEmail('');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const toggleLeg = (legRootId) => {
    setExpandedLegs(prev => ({
      ...prev,
      [legRootId]: !prev[legRootId]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="network-wrapper">
        <Header />
        <div className="network-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your network...</p>
          </div>
        </div>
      </div>
    );
  }

  const canInvite = (referralInfo?.referralLevel || 1) < 8;

  return (
    <div className="network-wrapper">
      <Header />
      <div className="network-container">
        <div className="network-header">
          <h1>My Network</h1>
          <p>Manage your referral network and grow your team</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Referral Link Section */}
        <div className="referral-link-card">
          <div className="referral-link-header">
            <h3>Your Referral Link</h3>
            <span className="level-badge">Level {referralInfo?.referralLevel || 1}</span>
          </div>
          <div className="referral-link-content">
            <div className="link-box">
              <input 
                type="text" 
                value={referralInfo?.referralLink || ''} 
                readOnly 
              />
              <button 
                className={`copy-btn ${copySuccess ? 'copied' : ''}`}
                onClick={copyReferralLink}
              >
                {copySuccess ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="referral-code">
              Code: <strong>{referralInfo?.referralCode}</strong>
            </p>
          </div>

          {/* Invite Form */}
          {canInvite ? (
            <form className="invite-form" onSubmit={sendInvitation}>
              <input
                type="email"
                placeholder="Enter email to invite"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
              <button type="submit" disabled={inviting}>
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          ) : (
            <div className="max-level-warning">
              You've reached the maximum level (8). You cannot add more members below you.
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon direct">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{networkData?.directReferralsCount || 0}</span>
              <span className="stat-label">Direct Referrals (Legs)</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{networkData?.totalDownlineCount || 0}</span>
              <span className="stat-label">Total Network</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon level">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-value">{referralInfo?.referralLevel || 1}</span>
              <span className="stat-label">Your Level</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="network-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Level Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'legs' ? 'active' : ''}`}
            onClick={() => setActiveTab('legs')}
          >
            My Legs ({legsData?.totalLegs || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <h3>Members by Level</h3>
              {networkData?.levelCounts?.length > 0 ? (
                <div className="level-bars">
                  {networkData.levelCounts.map((level) => {
                    const maxCount = Math.max(...networkData.levelCounts.map(l => l.count));
                    const widthPercent = (level.count / maxCount) * 100;
                    return (
                      <div key={level.level} className="level-bar-row">
                        <span className="level-label">Level {level.level}</span>
                        <div className="level-bar-container">
                          <div 
                            className="level-bar" 
                            style={{ width: `${widthPercent}%` }}
                          ></div>
                        </div>
                        <span className="level-count">{level.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No members in your network yet. Share your referral link to grow your team!</p>
                </div>
              )}

              {/* Referrer Info */}
              {networkData?.referrer && (
                <div className="referrer-info">
                  <h4>You were referred by</h4>
                  <div className="referrer-card">
                    <div className="referrer-avatar">
                      {networkData.referrer.username?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="referrer-details">
                      <span className="referrer-name">{networkData.referrer.username}</span>
                      <span className="referrer-level">Level {networkData.referrer.referralLevel}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'legs' && (
            <div className="legs-section">
              {legsData?.legs?.length > 0 ? (
                <div className="legs-list">
                  {legsData.legs.map((leg) => (
                    <div key={leg.legRootId} className="leg-card">
                      <div 
                        className="leg-header"
                        onClick={() => toggleLeg(leg.legRootId)}
                      >
                        <div className="leg-info">
                          <div className="leg-avatar">
                            {leg.legRootName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="leg-details">
                            <span className="leg-name">{leg.legRootName}</span>
                            <span className="leg-email">{leg.legRootEmail}</span>
                            <span className="leg-date">Joined {formatDate(leg.legRootJoinedAt)}</span>
                          </div>
                        </div>
                        <div className="leg-stats">
                          <span className="leg-members">{leg.totalMembers} members</span>
                          <span className="leg-depth">Max depth: {leg.maxLevel}</span>
                          <svg 
                            className={`expand-icon ${expandedLegs[leg.legRootId] ? 'expanded' : ''}`}
                            viewBox="0 0 24 24" 
                            fill="currentColor"
                            width="24"
                            height="24"
                          >
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                          </svg>
                        </div>
                      </div>

                      {expandedLegs[leg.legRootId] && leg.members?.length > 0 && (
                        <div className="leg-members-list">
                          <div className="level-breakdown">
                            {leg.levelBreakdown?.map(lb => (
                              <span key={lb.level} className="level-chip">
                                L{lb.level}: {lb.count}
                              </span>
                            ))}
                          </div>
                          <table className="members-table">
                            <thead>
                              <tr>
                                <th>Member</th>
                                <th>Level</th>
                                <th>Joined</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leg.members.map((member) => (
                                <tr key={member.descendantUserId}>
                                  <td>
                                    <div className="member-info">
                                      <span className="member-name">{member.username}</span>
                                      <span className="member-email">{member.email}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="level-badge-sm">L{member.level}</span>
                                  </td>
                                  <td>{formatDate(member.joinedAt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="60" height="60">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                  <h4>No Legs Yet</h4>
                  <p>Share your referral link to start building your network!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyNetworkPage;
