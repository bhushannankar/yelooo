import React from 'react';
import YeloooLogo from '../images/YeloooLogo.png';
import './MinimalHeader.css';

const MinimalHeader = () => {
  return (
    <header className="minimal-header">
      <div className="minimal-header-content">
        <div className="minimal-logo">
          <img src={YeloooLogo} alt="Yelooo" className="minimal-logo-image" />
        </div>
        <div className="minimal-header-right">
          <a href="mailto:support@yelooo.in" className="help-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Need help?
          </a>
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader;
