import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

const STATUS_COLORS = {
  CONFIRMED: 'var(--success)',
  COMPLETED: 'var(--info)',
  PENDING: 'var(--warning)',
  CANCELLED: 'var(--danger)',
};

const AdminAnalyticsTab = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch {
      setError('Unable to load booking analytics from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) return <LoadingSpinner message="Computing database booking analytics..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadAnalytics} />;
  if (!analytics) return null;

  const { statusDistribution = [], bookingsOverTime = [], popularPackages = [] } = analytics;
  const totalStatusBookings = statusDistribution.reduce((acc, s) => acc + s.count, 0) || 1;
  const maxTrendCount = Math.max(...bookingsOverTime.map((m) => m.bookingCount), 1);
  const maxPkgCount = Math.max(...popularPackages.map((p) => p.bookingCount), 1);

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Reports & Booking Analytics</h2>
          <p>Aggregated trends, package demand, and status distribution computed via SQL group queries.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadAnalytics}>
          <i className="fa-solid fa-rotate"></i> Refresh Charts
        </button>
      </div>

      <div className="admin-analytics-grid">
        {/* Status Distribution */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3>
              <i className="fa-solid fa-chart-pie" style={{ color: 'var(--primary)' }}></i> Booking Status Distribution
            </h3>
          </div>
          {statusDistribution.length === 0 ? (
            <p className="admin-empty-hint">No bookings recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {statusDistribution.map((item) => {
                const pct = Math.round((item.count / totalStatusBookings) * 100);
                const color = STATUS_COLORS[item.status] || 'var(--primary)';
                return (
                  <div key={item.status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                      <span style={{ fontWeight: '600', color: '#fff' }}>
                        {item.status} ({item.count})
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {pct}% &middot; {formatINR(item.totalValue)}
                      </span>
                    </div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bookings Over Time */}
        <div className="admin-panel">
          <div className="admin-panel-header">
            <h3>
              <i className="fa-solid fa-chart-line" style={{ color: 'var(--primary)' }}></i> Bookings & Revenue Over Time
            </h3>
          </div>
          {bookingsOverTime.length === 0 ? (
            <p className="admin-empty-hint">No historical booking trends available yet.</p>
          ) : (
            <div className="admin-trend-bars">
              {bookingsOverTime.map((m) => {
                const heightPct = Math.max(12, Math.round((m.bookingCount / maxTrendCount) * 100));
                return (
                  <div key={m.period} className="admin-trend-col">
                    <div className="admin-trend-value">{m.bookingCount}</div>
                    <div className="admin-trend-track">
                      <div
                        className="admin-trend-bar"
                        style={{ height: `${heightPct}%` }}
                        title={`${m.period}: ${m.bookingCount} bookings (${formatINR(m.confirmedRevenue)} confirmed)`}
                      />
                    </div>
                    <div className="admin-trend-label">{m.period}</div>
                    <div className="admin-trend-rev">{formatINR(m.confirmedRevenue)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Popular Travel Packages */}
      <div className="admin-panel" style={{ marginTop: '24px' }}>
        <div className="admin-panel-header">
          <h3>
            <i className="fa-solid fa-trophy" style={{ color: 'var(--primary)' }}></i> Most Popular Travel Packages
          </h3>
        </div>
        {popularPackages.length === 0 ? (
          <p className="admin-empty-hint">No package booking trends recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {popularPackages.map((pkg, idx) => {
              const pct = Math.round((pkg.bookingCount / maxPkgCount) * 100);
              return (
                <div key={pkg.packageId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.92rem' }}>
                      #{idx + 1} {pkg.title}{' '}
                      <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '0.82rem' }}>
                        ({pkg.destination})
                      </span>
                    </span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--primary)', fontWeight: '600' }}>
                      {pkg.bookingCount} bookings &middot; {formatINR(pkg.confirmedRevenue)} confirmed
                    </span>
                  </div>
                  <div className="admin-bar-track">
                    <div className="admin-bar-fill" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsTab;
