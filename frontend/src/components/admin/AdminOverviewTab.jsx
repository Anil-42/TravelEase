import React from 'react';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

const AdminOverviewTab = ({ stats, loading, error, onRefresh, onNavigateTab }) => {
  if (loading) return <LoadingSpinner message="Loading live dashboard metrics..." />;
  if (error) return <ErrorMessage message={error} onRetry={onRefresh} />;
  if (!stats) return null;

  const cards = [
    {
      label: 'Registered Customers',
      value: stats.totalCustomers,
      sub: `${stats.activeCustomers} active accounts`,
      icon: 'fa-users',
      tone: 'info',
      actionTab: 'customers',
    },
    {
      label: 'Total Bookings',
      value: stats.totalBookings,
      sub: `${stats.completedBookings} completed trips`,
      icon: 'fa-calendar-check',
      tone: 'primary',
      actionTab: 'bookings',
    },
    {
      label: 'Pending Bookings',
      value: stats.pendingBookings,
      sub: `${formatINR(stats.pendingBookingValue)} awaiting confirmation`,
      icon: 'fa-hourglass-half',
      tone: 'warning',
      actionTab: 'bookings',
    },
    {
      label: 'Confirmed Bookings',
      value: stats.confirmedBookings,
      sub: 'Ready for travel',
      icon: 'fa-circle-check',
      tone: 'success',
      actionTab: 'bookings',
    },
    {
      label: 'Cancelled Bookings',
      value: stats.cancelledBookings,
      sub: 'Excluded from revenue',
      icon: 'fa-ban',
      tone: 'danger',
      actionTab: 'bookings',
    },
    {
      label: 'Confirmed Booking Value',
      value: formatINR(stats.confirmedRevenue),
      sub: 'CONFIRMED + COMPLETED bookings only',
      icon: 'fa-indian-rupee-sign',
      tone: 'success',
      actionTab: 'analytics',
    },
  ];

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Executive Overview</h2>
          <p>Real-time platform metrics aggregated directly from the MySQL database.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onRefresh}>
          <i className="fa-solid fa-rotate"></i> Refresh Metrics
        </button>
      </div>

      <div className="admin-kpi-grid">
        {cards.map((card) => (
          <button
            key={card.label}
            type="button"
            className={`admin-kpi-card tone-${card.tone}`}
            onClick={() => onNavigateTab(card.actionTab)}
          >
            <div className="admin-kpi-top">
              <span className="admin-kpi-label">{card.label}</span>
              <span className="admin-kpi-icon">
                <i className={`fa-solid ${card.icon}`}></i>
              </span>
            </div>
            <div className="admin-kpi-value">{card.value}</div>
            <div className="admin-kpi-sub">{card.sub}</div>
          </button>
        ))}
      </div>

      {/* Operational Quick Summary */}
      <div className="admin-split-grid">
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3>
              <i className="fa-solid fa-compass" style={{ color: 'var(--primary)' }}></i> Catalog & Enquiries Summary
            </h3>
          </div>
          <div className="admin-summary-rows">
            <div className="admin-summary-row">
              <span>Active Tour Packages</span>
              <strong>
                {stats.availablePackages} / {stats.totalPackages} available
              </strong>
            </div>
            <div className="admin-summary-row">
              <span>New Customer Enquiries</span>
              <strong style={{ color: stats.newEnquiries > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {stats.newEnquiries} new (of {stats.totalEnquiries} total)
              </strong>
            </div>
            <div className="admin-summary-row">
              <span>Booking Value Calculation</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>
                {stats.revenueDefinition}
              </span>
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3>
              <i className="fa-solid fa-bolt" style={{ color: 'var(--primary)' }}></i> Quick Actions
            </h3>
          </div>
          <div className="admin-quick-actions">
            <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('packages')}>
              <i className="fa-solid fa-plus"></i> Manage Tour Packages
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigateTab('bookings')}>
              <i className="fa-solid fa-list-check"></i> Review Pending Bookings ({stats.pendingBookings})
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigateTab('enquiries')}>
              <i className="fa-solid fa-envelope-open-text"></i> View Enquiries ({stats.newEnquiries} New)
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigateTab('analytics')}>
              <i className="fa-solid fa-chart-column"></i> Open Analytics Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
