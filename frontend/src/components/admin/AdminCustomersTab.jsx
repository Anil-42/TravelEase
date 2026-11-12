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

const AdminCustomersTab = ({ onDataChanged }) => {
  const [customersPage, setCustomersPage] = useState({ content: [], page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    active: '',
    page: 0,
    size: 10,
  });

  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getCustomers(filters);
      setCustomersPage(data);
    } catch {
      setError('Failed to load customer accounts.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const openCustomerHistory = async (customer) => {
    setDetailLoading(true);
    setDetailData({ customer, bookings: [] });
    try {
      const full = await adminApi.getCustomerDetail(customer.id);
      setDetailData(full);
    } catch {
      setBanner({ type: 'danger', text: 'Unable to load customer booking history.' });
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    setBanner(null);
    try {
      const nextActive = !toggleTarget.active;
      const updated = await adminApi.updateCustomerStatus(toggleTarget.id, nextActive);
      setBanner({
        type: 'success',
        text: `Customer "${updated.username}" has been ${updated.active ? 'activated' : 'deactivated'}.`,
      });
      setToggleTarget(null);
      await loadCustomers();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to update customer status.',
      });
      setToggleTarget(null);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Manage Customers ({customersPage.totalElements || 0})</h2>
          <p>Search registered travelers, view booking history, and manage account active status.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadCustomers}>
          <i className="fa-solid fa-rotate"></i> Refresh
        </button>
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: '18px' }}>
          <i className={`fa-solid ${banner.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          <span>{banner.text}</span>
        </div>
      )}

      <div className="admin-filter-grid" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search customers by name or email..."
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 0 }))}
        />
        <select
          className="form-control"
          value={filters.active}
          onChange={(e) => setFilters((prev) => ({ ...prev, active: e.target.value, page: 0 }))}
        >
          <option value="">All Account Statuses</option>
          <option value="true">Active Only</option>
          <option value="false">Deactivated Only</option>
        </select>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setFilters({ search: '', active: '', page: 0, size: 10 })}
        >
          Reset
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading customer directory..." />}
      {error && <ErrorMessage message={error} onRetry={loadCustomers} />}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Registered</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customersPage.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      No customer accounts match your query.
                    </td>
                  </tr>
                ) : (
                  customersPage.content.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{c.username}</td>
                      <td>{c.email}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className="badge badge-tag">{c.bookingCount} bookings</span>
                      </td>
                      <td>
                        <span className={`badge ${c.active ? 'badge-confirmed' : 'badge-cancelled'}`}>
                          {c.active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openCustomerHistory(c)}>
                            <i className="fa-solid fa-eye"></i> History
                          </button>
                          <button
                            className={`btn btn-sm ${c.active ? 'btn-danger' : 'btn-outline'}`}
                            onClick={() => setToggleTarget(c)}
                          >
                            {c.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {customersPage.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-outline btn-sm"
                disabled={customersPage.first}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <i className="fa-solid fa-chevron-left"></i> Previous
              </button>
              <span>
                Page {customersPage.page + 1} of {customersPage.totalPages} ({customersPage.totalElements} customers)
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={customersPage.last}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Customer Detail & Booking History Modal */}
      {detailData && (
        <div className="modal-overlay" onClick={() => setDetailData(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Customer Profile: {detailData.customer.username}</h3>
              <button
                onClick={() => setDetailData(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="admin-detail-grid" style={{ marginBottom: '20px' }}>
              <div>
                <label>Email</label>
                <span>{detailData.customer.email}</span>
              </div>
              <div>
                <label>Account Status</label>
                <span>{detailData.customer.active ? 'Active' : 'Deactivated'}</span>
              </div>
              <div>
                <label>Registered On</label>
                <span>{detailData.customer.createdAt ? new Date(detailData.customer.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div>
                <label>Total Bookings</label>
                <span>{detailData.customer.bookingCount}</span>
              </div>
            </div>

            <h4 style={{ color: '#fff', marginBottom: '12px' }}>Booking History</h4>
            {detailLoading ? (
              <LoadingSpinner message="Loading customer bookings..." />
            ) : detailData.bookings.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>This customer has not placed any bookings yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Package</th>
                      <th>Travel Date</th>
                      <th>Fare</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailData.bookings.map((b) => (
                      <tr key={b.id}>
                        <td>#{b.id}</td>
                        <td>{b.packageTitle}</td>
                        <td>{b.travelStartDate}</td>
                        <td style={{ color: 'var(--primary)' }}>{formatINR(b.totalPrice)}</td>
                        <td>{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activate / Deactivate Confirmation Modal */}
      {toggleTarget && (
        <div className="modal-overlay" onClick={() => setToggleTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '12px' }}>
              {toggleTarget.active ? 'Deactivate' : 'Activate'} Customer Account?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
              {toggleTarget.active
                ? `Deactivating ${toggleTarget.email} prevents future logins and API access while preserving all existing booking history.`
                : `Re-activating ${toggleTarget.email} allows the customer to sign in and create new bookings again.`}
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setToggleTarget(null)}>
                Cancel
              </button>
              <button
                className={`btn btn-sm ${toggleTarget.active ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleConfirmToggle}
                disabled={toggling}
              >
                {toggling ? 'Updating...' : toggleTarget.active ? 'Confirm Deactivate' : 'Confirm Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomersTab;
