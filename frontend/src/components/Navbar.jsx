import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from './ChangePasswordModal';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const closeMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-container">
          {/* Left Section: Logo & Brand Name */}
          <div className="navbar-left">
            <Link to="/" className="nav-brand" onClick={closeMenu}>
              <img src="/assets/images/Logo4.png" alt="TravelEase Logo" />
              <span>Travel</span>Ease
            </Link>
          </div>

          {/* Center Section: Navigation Links (Desktop) */}
          <ul className="navbar-center">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
                onClick={closeMenu}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/packages"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
                onClick={closeMenu}
              >
                Tour Packages
              </NavLink>
            </li>
            <li>
              <a href="/#about" className="nav-link" onClick={closeMenu}>
                About
              </a>
            </li>
            <li>
              <a href="/#services" className="nav-link" onClick={closeMenu}>
                Services
              </a>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  isActive ? 'nav-link active' : 'nav-link'
                }
                onClick={closeMenu}
              >
                Contact
              </NavLink>
            </li>
          </ul>

          {/* Right Section: Authentication Controls (Desktop) */}
          <div className="navbar-right">
            {isAuthenticated ? (
              <div className="auth-group">
                {isAdmin && (
                  <Link to="/admin" className="btn btn-primary btn-sm">
                    <i className="fa-solid fa-gauge-high"></i> Admin Panel
                  </Link>
                )}
                <Link to="/my-bookings" className="btn btn-outline btn-sm">
                  <i className="fa-solid fa-suitcase-rolling"></i> My Bookings
                </Link>
                <div className="user-greeting">
                  <i className="fa-solid fa-circle-user"></i>
                  <span>
                    Hi, <strong>{user?.username}</strong>
                  </span>
                </div>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={() => setChangePwOpen(true)}
                  title="Change Password"
                  aria-label="Change Password"
                >
                  <i className="fa-solid fa-key"></i>
                </button>
                <button
                  className="btn btn-outline btn-sm btn-icon"
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
            ) : (
              <div className="auth-group">
                <Link to="/login" className="btn btn-outline btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="nav-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
          >
            <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>

        {/* Mobile Drawer */}
        <div className={`nav-mobile-drawer ${mobileOpen ? 'open' : ''}`}>
          <ul className="nav-mobile-links">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMenu}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/packages"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMenu}
              >
                Tour Packages
              </NavLink>
            </li>
            <li>
              <a href="/#about" onClick={closeMenu}>
                About
              </a>
            </li>
            <li>
              <a href="/#services" onClick={closeMenu}>
                Services
              </a>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) => (isActive ? 'active' : '')}
                onClick={closeMenu}
              >
                Contact
              </NavLink>
            </li>
          </ul>

          <div className="nav-mobile-auth">
            {isAuthenticated ? (
              <>
                <div className="user-greeting" style={{ justifyContent: 'center' }}>
                  <i className="fa-solid fa-circle-user"></i>
                  <span>
                    Hi, <strong>{user?.username}</strong>
                  </span>
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="btn btn-primary btn-sm btn-block"
                    onClick={closeMenu}
                  >
                    <i className="fa-solid fa-gauge-high"></i> Admin Panel
                  </Link>
                )}
                <Link
                  to="/my-bookings"
                  className="btn btn-outline btn-sm btn-block"
                  onClick={closeMenu}
                >
                  <i className="fa-solid fa-suitcase-rolling"></i> My Bookings
                </Link>
                <button
                  className="btn btn-outline btn-sm btn-block"
                  onClick={() => {
                    closeMenu();
                    setChangePwOpen(true);
                  }}
                >
                  <i className="fa-solid fa-key"></i> Change Password
                </button>
                <button
                  className="btn btn-danger btn-sm btn-block"
                  onClick={handleLogout}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> Sign Out
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link
                  to="/login"
                  className="btn btn-outline btn-sm btn-block"
                  onClick={closeMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm btn-block"
                  onClick={closeMenu}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </>
  );
};

export default Navbar;
