import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import Footer from './Footer';
import './ProfilePage.css';

const API_URL = 'https://localhost:7193/api';
const BASE_URL = 'https://localhost:7193';

const ProfilePage = () => {
  const navigate = useNavigate();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const token = localStorage.getItem('jwtToken');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    phoneNumber: '',
    alternatePhoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pinCode: '',
    country: 'India'
  });

  // Bank details form state
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    bankName: '',
    branchName: '',
    ifscCode: '',
    accountType: 'Savings'
  });
  const [hasBankDetails, setHasBankDetails] = useState(false);
  const [bankDetailId, setBankDetailId] = useState(null);
  const [editBankMode, setEditBankMode] = useState(false);

  // KYC form state
  const [kycForm, setKycForm] = useState({
    documentType: 'Aadhaar',
    documentNumber: '',
    documentFront: null,
    documentBack: null
  });
  const [kycDocuments, setKycDocuments] = useState([]);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/UserProfile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
      setProfileForm({
        firstName: response.data.firstName || '',
        middleName: response.data.middleName || '',
        lastName: response.data.lastName || '',
        fullName: response.data.fullName || '',
        phoneNumber: response.data.phoneNumber || '',
        alternatePhoneNumber: response.data.alternatePhoneNumber || '',
        dateOfBirth: response.data.dateOfBirth ? response.data.dateOfBirth.split('T')[0] : '',
        gender: response.data.gender || '',
        address: response.data.address || '',
        addressLine2: response.data.addressLine2 || '',
        landmark: response.data.landmark || '',
        city: response.data.city || '',
        state: response.data.state || '',
        pinCode: response.data.pinCode || '',
        country: response.data.country || 'India'
      });

      // Set bank details if exists
      if (response.data.bankDetails && response.data.bankDetails.length > 0) {
        const bank = response.data.bankDetails[0];
        setHasBankDetails(true);
        setBankDetailId(bank.bankDetailId);
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchBankDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/UserProfile/bank-details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data && response.data.length > 0) {
        const bank = response.data[0];
        setHasBankDetails(true);
        setBankDetailId(bank.bankDetailId);
        setBankForm({
          accountHolderName: bank.accountHolderName || '',
          accountNumber: bank.accountNumber || '',
          confirmAccountNumber: bank.accountNumber || '',
          bankName: bank.bankName || '',
          branchName: bank.branchName || '',
          ifscCode: bank.ifscCode || '',
          accountType: bank.accountType || 'Savings'
        });
      }
    } catch (err) {
      console.error('Failed to load bank details:', err);
    }
  }, [token]);

  const fetchKycDocuments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/Kyc/my-documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKycDocuments(response.data || []);
    } catch (err) {
      console.error('Failed to load KYC documents:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchBankDetails();
    fetchKycDocuments();
  }, [isLoggedIn, navigate, fetchProfile, fetchBankDetails, fetchKycDocuments]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/UserProfile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showMessage('success', 'Profile updated successfully');
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      showMessage('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleBankSubmit = async (e) => {
    e.preventDefault();
    
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      showMessage('error', 'Account numbers do not match');
      return;
    }

    setSaving(true);
    try {
      const bankData = {
        accountHolderName: bankForm.accountHolderName,
        accountNumber: bankForm.accountNumber,
        bankName: bankForm.bankName,
        branchName: bankForm.branchName,
        ifscCode: bankForm.ifscCode,
        accountType: bankForm.accountType
      };

      if (hasBankDetails && bankDetailId) {
        await axios.put(`${API_URL}/UserProfile/bank-details/${bankDetailId}`, bankData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('success', 'Bank details updated successfully');
      } else {
        await axios.post(`${API_URL}/UserProfile/bank-details`, bankData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showMessage('success', 'Bank details added successfully');
      }
      setEditBankMode(false);
      fetchBankDetails();
      fetchProfile();
    } catch (err) {
      showMessage('error', err.response?.data || 'Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    
    if (!kycForm.documentFront) {
      showMessage('error', 'Please upload the front side of your document');
      return;
    }

    setUploadingKyc(true);
    try {
      const formData = new FormData();
      formData.append('documentType', kycForm.documentType);
      formData.append('documentNumber', kycForm.documentNumber);
      formData.append('documentFront', kycForm.documentFront);
      if (kycForm.documentBack) {
        formData.append('documentBack', kycForm.documentBack);
      }

      await axios.post(`${API_URL}/Kyc/submit`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      showMessage('success', 'KYC document submitted successfully. Awaiting verification.');
      setKycForm({
        documentType: 'Aadhaar',
        documentNumber: '',
        documentFront: null,
        documentBack: null
      });
      fetchKycDocuments();
      fetchProfile();
    } catch (err) {
      showMessage('error', err.response?.data || 'Failed to submit KYC document');
    } finally {
      setUploadingKyc(false);
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showMessage('error', 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image size should be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/UserProfile/upload-image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update profile with new image URL
      setProfile(prev => ({ ...prev, profileImageUrl: response.data.imageUrl }));
      showMessage('success', 'Profile photo updated successfully');
    } catch (err) {
      showMessage('error', err.response?.data || 'Failed to upload profile photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getKycStatusBadge = (status) => {
    const statusClasses = {
      'NotSubmitted': 'badge-default',
      'Pending': 'badge-warning',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger'
    };
    return statusClasses[status] || 'badge-default';
  };

  const getKycStatusText = (status) => {
    const statusTexts = {
      'NotSubmitted': 'Not Submitted',
      'Pending': 'Pending Verification',
      'Approved': 'Verified',
      'Rejected': 'Rejected'
    };
    return statusTexts[status] || status;
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Header />
        <div className="profile-container">
          <div className="error">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {profile?.profileImageUrl ? (
                <img src={`${BASE_URL}${profile.profileImageUrl}`} alt="Profile" />
              ) : (
                <div className="avatar-placeholder">
                  {profile?.fullName?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <label className="avatar-upload-btn" htmlFor="profile-photo-input">
              {uploadingPhoto ? (
                <span className="uploading-spinner"></span>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                  <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z"/>
                </svg>
              )}
            </label>
            <input
              type="file"
              id="profile-photo-input"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleProfilePhotoUpload}
              style={{ display: 'none' }}
              disabled={uploadingPhoto}
            />
          </div>
          <div className="profile-info">
            <h1>{profile?.firstName ? `${profile.firstName} ${profile.middleName || ''} ${profile.lastName || ''}`.trim() : (profile?.fullName || profile?.username)}</h1>
            <p className="email">{profile?.email}</p>
            <div className="kyc-status-badge">
              <span className={`badge ${getKycStatusBadge(profile?.kycStatus)}`}>
                KYC: {getKycStatusText(profile?.kycStatus)}
              </span>
              {profile?.kycApprovedAt && (
                <span className="approved-date">
                  Verified on {new Date(profile.kycApprovedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Personal Info
          </button>
          <button 
            className={`tab ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            Bank Details
          </button>
          <button 
            className={`tab ${activeTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc')}
          >
            KYC Verification
          </button>
        </div>

        <div className="profile-content">
          {/* Personal Info Tab */}
          {activeTab === 'profile' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Personal Information</h2>
                {!editMode && (
                  <button className="btn-edit" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                )}
              </div>

              {editMode ? (
                <form onSubmit={handleProfileSubmit} className="profile-form">
                  {/* Name Section */}
                  <h3 className="form-section-title">Name Details</h3>
                  <div className="form-row three-col">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                        placeholder="First name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Middle Name</label>
                      <input
                        type="text"
                        value={profileForm.middleName}
                        onChange={(e) => setProfileForm({...profileForm, middleName: e.target.value})}
                        placeholder="Middle name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  {/* Contact Section */}
                  <h3 className="form-section-title">Contact Information</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({...profileForm, phoneNumber: e.target.value})}
                        placeholder="Primary phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Alternate Phone Number</label>
                      <input
                        type="tel"
                        value={profileForm.alternatePhoneNumber}
                        onChange={(e) => setProfileForm({...profileForm, alternatePhoneNumber: e.target.value})}
                        placeholder="Alternate phone number"
                      />
                    </div>
                  </div>

                  {/* Personal Details Section */}
                  <h3 className="form-section-title">Personal Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={profileForm.dateOfBirth}
                        onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  {/* Address Section */}
                  <h3 className="form-section-title">Address Details</h3>
                  <div className="form-group full-width">
                    <label>Address Line 1</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                      placeholder="House/Flat No., Building Name, Street"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={profileForm.addressLine2}
                      onChange={(e) => setProfileForm({...profileForm, addressLine2: e.target.value})}
                      placeholder="Area, Colony, Sector"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Landmark</label>
                      <input
                        type="text"
                        value={profileForm.landmark}
                        onChange={(e) => setProfileForm({...profileForm, landmark: e.target.value})}
                        placeholder="Near landmark"
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                  </div>
                  <div className="form-row three-col">
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={profileForm.state}
                        onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                        placeholder="State"
                      />
                    </div>
                    <div className="form-group">
                      <label>Pin Code</label>
                      <input
                        type="text"
                        value={profileForm.pinCode}
                        onChange={(e) => setProfileForm({...profileForm, pinCode: e.target.value})}
                        placeholder="Pin code"
                        maxLength="6"
                      />
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <input
                        type="text"
                        value={profileForm.country}
                        onChange={(e) => setProfileForm({...profileForm, country: e.target.value})}
                        placeholder="Country"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-details">
                  {/* Name Details */}
                  <div className="detail-section-title">Name Details</div>
                  <div className="detail-row">
                    <span className="label">First Name</span>
                    <span className="value">{profile?.firstName || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Middle Name</span>
                    <span className="value">{profile?.middleName || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Last Name</span>
                    <span className="value">{profile?.lastName || 'Not provided'}</span>
                  </div>

                  {/* Contact Details */}
                  <div className="detail-section-title">Contact Information</div>
                  <div className="detail-row">
                    <span className="label">Email</span>
                    <span className="value">{profile?.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Phone Number</span>
                    <span className="value">{profile?.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Alternate Phone</span>
                    <span className="value">{profile?.alternatePhoneNumber || 'Not provided'}</span>
                  </div>

                  {/* Personal Details */}
                  <div className="detail-section-title">Personal Details</div>
                  <div className="detail-row">
                    <span className="label">Date of Birth</span>
                    <span className="value">
                      {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Gender</span>
                    <span className="value">{profile?.gender || 'Not provided'}</span>
                  </div>

                  {/* Address Details */}
                  <div className="detail-section-title">Address Details</div>
                  <div className="detail-row">
                    <span className="label">Address Line 1</span>
                    <span className="value">{profile?.address || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Address Line 2</span>
                    <span className="value">{profile?.addressLine2 || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Landmark</span>
                    <span className="value">{profile?.landmark || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">City</span>
                    <span className="value">{profile?.city || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">State</span>
                    <span className="value">{profile?.state || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Pin Code</span>
                    <span className="value">{profile?.pinCode || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Country</span>
                    <span className="value">{profile?.country || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bank Details Tab */}
          {activeTab === 'bank' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>Bank Account Details</h2>
                {hasBankDetails && !editBankMode && (
                  <button className="btn-edit" onClick={() => setEditBankMode(true)}>
                    Edit Bank Details
                  </button>
                )}
              </div>

              {(!hasBankDetails || editBankMode) ? (
                <form onSubmit={handleBankSubmit} className="bank-form">
                  <div className="form-group">
                    <label>Account Holder Name *</label>
                    <input
                      type="text"
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm({...bankForm, accountHolderName: e.target.value})}
                      placeholder="Enter account holder name"
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Account Number *</label>
                      <input
                        type="text"
                        value={bankForm.accountNumber}
                        onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                        placeholder="Enter account number"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm Account Number *</label>
                      <input
                        type="text"
                        value={bankForm.confirmAccountNumber}
                        onChange={(e) => setBankForm({...bankForm, confirmAccountNumber: e.target.value})}
                        placeholder="Re-enter account number"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bank Name *</label>
                      <input
                        type="text"
                        value={bankForm.bankName}
                        onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})}
                        placeholder="Enter bank name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Branch Name *</label>
                      <input
                        type="text"
                        value={bankForm.branchName}
                        onChange={(e) => setBankForm({...bankForm, branchName: e.target.value})}
                        placeholder="Enter branch name"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>IFSC Code *</label>
                      <input
                        type="text"
                        value={bankForm.ifscCode}
                        onChange={(e) => setBankForm({...bankForm, ifscCode: e.target.value.toUpperCase()})}
                        placeholder="Enter IFSC code"
                        required
                        maxLength="11"
                      />
                    </div>
                    <div className="form-group">
                      <label>Account Type</label>
                      <select
                        value={bankForm.accountType}
                        onChange={(e) => setBankForm({...bankForm, accountType: e.target.value})}
                      >
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    {editBankMode && (
                      <button type="button" className="btn-cancel" onClick={() => setEditBankMode(false)}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn-save" disabled={saving}>
                      {saving ? 'Saving...' : (hasBankDetails ? 'Update Bank Details' : 'Add Bank Details')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bank-details">
                  <div className="bank-card">
                    <div className="bank-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                      </svg>
                    </div>
                    <div className="bank-info">
                      <h3>{bankForm.bankName}</h3>
                      <p className="branch">{bankForm.branchName}</p>
                      <p className="account-holder">{bankForm.accountHolderName}</p>
                      <p className="account-number">
                        A/C: {'*'.repeat(bankForm.accountNumber.length - 4)}{bankForm.accountNumber.slice(-4)}
                      </p>
                      <p className="ifsc">IFSC: {bankForm.ifscCode}</p>
                      <span className="account-type-badge">{bankForm.accountType}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KYC Tab */}
          {activeTab === 'kyc' && (
            <div className="tab-content">
              <div className="section-header">
                <h2>KYC Verification</h2>
              </div>

              {/* KYC Status Card */}
              <div className={`kyc-status-card ${profile?.kycStatus?.toLowerCase()}`}>
                <div className="status-icon">
                  {profile?.kycStatus === 'Approved' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  )}
                  {profile?.kycStatus === 'Pending' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  )}
                  {profile?.kycStatus === 'Rejected' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                  {profile?.kycStatus === 'NotSubmitted' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  )}
                </div>
                <div className="status-info">
                  <h3>{getKycStatusText(profile?.kycStatus)}</h3>
                  {profile?.kycStatus === 'Approved' && (
                    <p>Your identity has been verified. You can now access all features.</p>
                  )}
                  {profile?.kycStatus === 'Pending' && (
                    <p>Your documents are being reviewed. This usually takes 1-2 business days.</p>
                  )}
                  {profile?.kycStatus === 'Rejected' && (
                    <p>Your verification was rejected. Please resubmit with valid documents.</p>
                  )}
                  {profile?.kycStatus === 'NotSubmitted' && (
                    <p>Complete your KYC verification to access all features.</p>
                  )}
                </div>
              </div>

              {/* Show rejection reason if applicable */}
              {profile?.kycDocument?.status === 'Rejected' && profile?.kycDocument?.rejectionReason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {profile.kycDocument.rejectionReason}
                </div>
              )}

              {/* KYC Submission Form - show only if not approved and not pending */}
              {profile?.kycStatus !== 'Approved' && profile?.kycStatus !== 'Pending' && (
                <div className="kyc-form-section">
                  <h3>Submit KYC Documents</h3>
                  <form onSubmit={handleKycSubmit} className="kyc-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Document Type *</label>
                        <select
                          value={kycForm.documentType}
                          onChange={(e) => setKycForm({...kycForm, documentType: e.target.value})}
                          required
                        >
                          <option value="Aadhaar">Aadhaar Card</option>
                          <option value="PAN">PAN Card</option>
                          <option value="Passport">Passport</option>
                          <option value="VoterId">Voter ID</option>
                          <option value="DrivingLicense">Driving License</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Document Number *</label>
                        <input
                          type="text"
                          value={kycForm.documentNumber}
                          onChange={(e) => setKycForm({...kycForm, documentNumber: e.target.value})}
                          placeholder="Enter document number"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Document Front Side *</label>
                        <div className="file-upload">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => setKycForm({...kycForm, documentFront: e.target.files[0]})}
                            required
                            id="doc-front"
                          />
                          <label htmlFor="doc-front" className="file-label">
                            {kycForm.documentFront ? kycForm.documentFront.name : 'Choose file'}
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Document Back Side (Optional)</label>
                        <div className="file-upload">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => setKycForm({...kycForm, documentBack: e.target.files[0]})}
                            id="doc-back"
                          />
                          <label htmlFor="doc-back" className="file-label">
                            {kycForm.documentBack ? kycForm.documentBack.name : 'Choose file'}
                          </label>
                        </div>
                      </div>
                    </div>
                    <p className="file-hint">Accepted formats: JPG, PNG, PDF (Max 5MB each)</p>
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={uploadingKyc}>
                        {uploadingKyc ? 'Uploading...' : 'Submit for Verification'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Previous KYC Submissions */}
              {kycDocuments.length > 0 && (
                <div className="kyc-history">
                  <h3>Submission History</h3>
                  <div className="kyc-list">
                    {kycDocuments.map((doc) => (
                      <div key={doc.kycDocumentId} className={`kyc-item ${doc.status.toLowerCase()}`}>
                        <div className="kyc-item-header">
                          <span className="doc-type">{doc.documentType}</span>
                          <span className={`status-badge ${doc.status.toLowerCase()}`}>{doc.status}</span>
                        </div>
                        <div className="kyc-item-details">
                          <p>Document No: {doc.documentNumber}</p>
                          <p>Submitted: {new Date(doc.submittedAt).toLocaleDateString()}</p>
                          {doc.reviewedAt && (
                            <p>Reviewed: {new Date(doc.reviewedAt).toLocaleDateString()}</p>
                          )}
                          {doc.rejectionReason && (
                            <p className="rejection">Reason: {doc.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
