import React from 'react';
import { Link } from 'react-router-dom';

const currentYear = new Date().getFullYear();

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Col 1: Brand Info */}
        <div className="footer-col">
          <div className="nav-brand" style={{ marginBottom: '16px' }}>
            <img src="/assets/images/Logo4.png" alt="TravelEase Logo" style={{ height: '36px' }} />
            <span>Travel</span>Ease
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--text-muted)' }}>
            Your premier travel companion for handcrafted holiday tours, serene backwaters, royal palaces, and mountain escapades with transparent pricing.
          </p>
          <div className="social-links">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Facebook">
              <i className="fa-brands fa-facebook"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Twitter">
              <i className="fa-brands fa-twitter"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-link" aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin"></i>
            </a>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div className="footer-col">
          <h4>Quick Navigation</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/packages">Tour Packages</Link></li>
            <li><a href="/#about">About Us</a></li>
            <li><a href="/#services">Our Services</a></li>
            <li><Link to="/contact">Contact Support</Link></li>
          </ul>
        </div>

        {/* Col 3: Popular Tours */}
        <div className="footer-col">
          <h4>Curated Tours</h4>
          <ul>
            <li><Link to="/packages/1">Goa Beach Escape</Link></li>
            <li><Link to="/packages/2">Manali Mountain Getaway</Link></li>
            <li><Link to="/packages/3">Jaipur Royal Heritage</Link></li>
            <li><Link to="/packages/4">Kerala Backwater Bliss</Link></li>
          </ul>
        </div>

        {/* Col 4: Contact Info */}
        <div className="footer-col">
          <h4>Get in Touch</h4>
          <ul style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i>
              <span>Connaught Place, New Delhi, India</span>
            </li>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <i className="fa-solid fa-envelope" style={{ color: 'var(--primary)' }}></i>
              <span>support@travelease.com</span>
            </li>
            <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <i className="fa-solid fa-phone" style={{ color: 'var(--primary)' }}></i>
              <span>98xxx xxx09</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>&copy; {currentYear} TravelEase Modernized Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
