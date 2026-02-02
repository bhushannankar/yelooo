import React from 'react';
import './MinimalFooter.css';

const MinimalFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="minimal-footer">
      <div className="minimal-footer-content">
        <div className="footer-links">
          <a href="/terms" className="footer-link">Terms of Service</a>
          <span className="footer-divider">|</span>
          <a href="/privacy" className="footer-link">Privacy Policy</a>
          <span className="footer-divider">|</span>
          <a href="mailto:support@yelooo.in" className="footer-link">Help</a>
        </div>
        <div className="footer-copyright">
          © {currentYear} Yelooo. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;
