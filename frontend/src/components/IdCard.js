import React, { useState, useRef } from 'react';
import YeloooLogo from '../images/YeloooLogo.png';
import './IdCard.css';

const BASE_URL = 'https://localhost:7193';

const IdCard = ({ profile }) => {
  const [orientation, setOrientation] = useState('vertical');
  const cardRef = useRef(null);

  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.middleName || ''} ${profile.lastName || ''}`.trim()
    : (profile?.fullName || profile?.username || 'Member');
  const memberId = profile?.referralCode || profile?.userId || '-';
  const phone = profile?.phoneNumber || profile?.alternatePhoneNumber || 'Not provided';
  const location = [profile?.address, profile?.landmark, profile?.city, profile?.state, profile?.pinCode]
    .filter(Boolean)
    .join(', ') || 'Not provided';
  const roleLabel = profile?.roleName || 'Customer';

  const profileImageUrl = profile?.profileImageUrl
    ? (profile.profileImageUrl.startsWith('/') ? `${BASE_URL}${profile.profileImageUrl}` : profile.profileImageUrl)
    : null;

  const handlePrint = () => {
    const printContent = cardRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>ID Card - ${displayName}</title></head>
        <body style="margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;">
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="id-card-tab">
      <div className="id-card-controls">
        <div className="orientation-toggle">
          <button
            className={`orientation-btn ${orientation === 'vertical' ? 'active' : ''}`}
            onClick={() => setOrientation('vertical')}
            title="Vertical"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Vertical
          </button>
          <button
            className={`orientation-btn ${orientation === 'horizontal' ? 'active' : ''}`}
            onClick={() => setOrientation('horizontal')}
            title="Horizontal"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Horizontal
          </button>
        </div>
        <button className="print-id-btn" onClick={handlePrint}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
          </svg>
          Print
        </button>
      </div>

      <div className="id-card-preview">
        <div
          ref={cardRef}
          className={`id-card ${orientation}`}
        >
          <div className="id-card-header">
            <div className="id-card-logo-bg" />
            <img src={YeloooLogo} alt="Yelooo" className="id-card-logo" />
            <p className="id-card-tagline">Your trusted e-commerce partner</p>
            <div className="id-card-photo-wrap">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt={displayName} className="id-card-photo" />
              ) : (
                <div className="id-card-photo-placeholder">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="id-card-body">
            <h2 className="id-card-name">{displayName}</h2>
            <p className="id-card-role-row">
              <span className="id-card-role-label">{roleLabel} ID :</span>
              <span className="id-card-member-id">{memberId}</span>
            </p>
            <div className="id-card-contact">
              <span className="id-card-icon">
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              </span>
              <span>{phone}</span>
            </div>
            <div className="id-card-contact">
              <span className="id-card-icon">
                <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </span>
              <span>{location}</span>
            </div>
            <hr className="id-card-divider" />
            <div className="id-card-company">
              <strong>Yelooo</strong>
              <p className="id-card-company-address">
                India
              </p>
            </div>
          </div>
          <div className="id-card-footer">
            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            <span>www.yelooo.in</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCard;
