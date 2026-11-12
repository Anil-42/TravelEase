import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/adminApi';
import ChangePasswordModal from '../components/ChangePasswordModal';
import AdminOverviewTab from '../components/admin/AdminOverviewTab';
import AdminPackagesTab from '../components/admin/AdminPackagesTab';
import AdminBookingsTab from '../components/admin/AdminBookingsTab';
import AdminCustomersTab from '../components/admin/AdminCustomersTab';
import AdminEnquiriesTab from '../components/admin/AdminEnquiriesTab';
import AdminAnalyticsTab from '../components/admin/AdminAnalyticsTab';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'fa-gauge-high' },
  { id: 'packages', label: 'Manage Packages', icon: 'fa-map-location-dot' },
  { id: 'bookings', label: 'Manage Bookings', icon: 'fa-calendar-check' },
  { id: 'customers', label: 'Manage Customers', icon: 'fa-users' },
  { id: 'enquiries', label: 'Contact Enquiries', icon: 'fa-envelope-open-text' },
  { id: 'analytics', label: 'Reports / Analytics', icon: 'fa-chart-column' },
];

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch {
      setStatsError('Unable to load overview statistics from backend.');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const pendingAlertsCount = (stats?.pendingBookings || 0) + (stats?.newEnquiries || 0);

  return (
    <div className="admin-shell">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && <div className="admin-backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <Link to="/" className="nav-brand" style={{ fontSize: '1.25rem' }}>
            <img src="/assets/images/Logo4.png" alt="TravelEase Logo" style={{ height: '32px' }} />
            <span>Travel</span>Ease
          </Link>
          <span className="admin-role-pill">ADMIN PORTAL</span>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span>{item.label}</span>
              {item.id === 'bookings' && stats?.pendingBookings > 0 && (
                <span className="admin-nav-count">{stats.pendingBookings}</span>
              )}
              {item.id === 'enquiries' && stats?.newEnquiries > 0 && (
                <span className="admin-nav-count">{stats.newEnquiries}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/packages" className="admin-nav-btn">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span>Public Storefront</span>
          </Link>
          <button type="button" className="admin-nav-btn danger" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle admin sidebar"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div>
              <h1 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>
                {NAV_ITEMS.find((i) => i.id === activeTab)?.label || 'Admin Dashboard'}
              </h1>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                TravelEase Operations & Security Console
              </span>
            </div>
          </div>

          <div className="admin-topbar-actions">
            {/* Notification indicator */}
            <button
              type="button"
              className="admin-notif-btn"
              onClick={() => handleNavClick(stats?.pendingBookings > 0 ? 'bookings' : 'enquiries')}
              title={`${stats?.pendingBookings || 0} pending bookings, ${stats?.newEnquiries || 0} new enquiries`}
            >
              <i className="fa-solid fa-bell"></i>
              {pendingAlertsCount > 0 && <span className="admin-notif-badge">{pendingAlertsCount}</span>}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setChangePwOpen(true)}
              title="Change administrator password"
            >
              <i className="fa-solid fa-key"></i>
              <span className="hide-sm">Password</span>
            </button>

            <div className="admin-profile-chip">
              <i className="fa-solid fa-user-shield" style={{ color: 'var(--primary)' }}></i>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', lineHeight: 1.2 }}>
                  {user?.username || 'Admin'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Workspace */}
        <main className="admin-content">
          {activeTab === 'overview' && (
            <AdminOverviewTab
              stats={stats}
              loading={statsLoading}
              error={statsError}
              onRefresh={loadStats}
              onNavigateTab={handleNavClick}
            />
          )}
          {activeTab === 'packages' && <AdminPackagesTab onDataChanged={loadStats} />}
          {activeTab === 'bookings' && <AdminBookingsTab onDataChanged={loadStats} />}
          {activeTab === 'customers' && <AdminCustomersTab onDataChanged={loadStats} />}
          {activeTab === 'enquiries' && <AdminEnquiriesTab onDataChanged={loadStats} />}
          {activeTab === 'analytics' && <AdminAnalyticsTab />}
        </main>
      </div>

      <ChangePasswordModal isOpen={changePwOpen} onClose={() => setChangePwOpen(false)} />
    </div>
  );
};

export default AdminDashboardPage;
