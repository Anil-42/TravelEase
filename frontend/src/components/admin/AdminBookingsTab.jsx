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

const ALLOWED_TRANSITIONS = {
  PENDING: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CONFIRMED', 'COMPLETED', 'CANCELLED'],
  COMPLETED: ['COMPLETED'],
  CANCELLED: ['CANCELLED'],
};

const AdminBookingsTab = ({ onDataChanged }) => {
  const [bookingsPage, setBookingsPage] = useState({ content: [], page: 0, totalPages: 0, totalElements: 0 });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    packageId: '',
    fromDate: '',
    toDate: '',
    page: 0,
    size: 10,
  });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editStatus, setEditStatus] = useState('PENDING');
  const [editPaymentStatus, setEditPaymentStatus] = useState('PENDING');
  const [updating, setUpdating] = useState(false);

  const loadPackages = useCallback(async () => {
    try {
      const list = await adminApi.getAllPackages();
      setPackages(list);
    } catch {
      // Non-blocking filter dropdown load
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getBookings(filters);
      setBookingsPage(data);
    } catch {
      setError('Failed to load bookings from server.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 0 }));
  };

  const resetFilters = () => {
    setFilters({ search: '', status: '', packageId: '', fromDate: '', toDate: '', page: 0, size: 10 });
  };

  const openDetailModal = (b) => {
    setSelectedBooking(b);
    setEditStatus(b.status);
    setEditPaymentStatus(b.paymentStatus);
    setBanner(null);
  };

  const handleStatusSave = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setUpdating(true);
    setBanner(null);
    try {
      const updated = await adminApi.updateBookingStatus(selectedBooking.id, {
        status: editStatus,
        paymentStatus: editPaymentStatus,
      });
      setBanner({
        type: 'success',
        text: `Booking #${updated.id} updated to ${updated.status} (Payment: ${updated.paymentStatus}).`,
      });
      setSelectedBooking(null);
      await loadBookings();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to update booking status.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'CONFIRMED') return 'badge-confirmed';
    if (status === 'COMPLETED') return 'badge-tag';
    if (status === 'CANCELLED') return 'badge-cancelled';
    return 'badge-pending';
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Manage Bookings ({bookingsPage.totalElements || 0})</h2>
          <p>Search, filter, inspect customer details, and execute permitted booking state transitions.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadBookings}>
          <i className="fa-solid fa-rotate"></i> Refresh
        </button>
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: '18px' }}>
          <i className={`fa-solid ${banner.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          <span>{banner.text}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="admin-filter-grid">
        <input
          type="text"
          className="form-control"
          placeholder="Search ID, customer, email, or package..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select
          className="form-control"
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          className="form-control"
          value={filters.packageId}
          onChange={(e) => handleFilterChange('packageId', e.target.value)}
        >
          <option value="">All Packages</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="form-control"
          title="Travel start date from"
          value={filters.fromDate}
          onChange={(e) => handleFilterChange('fromDate', e.target.value)}
        />
        <input
          type="date"
          className="form-control"
          title="Travel start date to"
          value={filters.toDate}
          onChange={(e) => handleFilterChange('toDate', e.target.value)}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={resetFilters}>
          Clear Filters
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading bookings..." />}
      {error && <ErrorMessage message={error} onRetry={loadBookings} />}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Package</th>
                  <th>Travel Date</th>
                  <th>Guests</th>
                  <th>Total Fare</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookingsPage.content.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      No bookings found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  bookingsPage.content.map((b) => (
                    <tr key={b.id}>
                      <td>#{b.id}</td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{b.customerName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.customerEmail}</div>
                      </td>
                      <td>{b.packageTitle}</td>
                      <td>{b.travelStartDate}</td>
                      <td>{b.travelers}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatINR(b.totalPrice)}</td>
                      <td>
                        <span className={`badge ${getStatusClass(b.status)}`}>{b.status}</span>
                      </td>
                      <td>
                        <span className={`badge ${b.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => openDetailModal(b)}>
                          <i className="fa-solid fa-sliders"></i> Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {bookingsPage.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-outline btn-sm"
                disabled={bookingsPage.first}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <i className="fa-solid fa-chevron-left"></i> Previous
              </button>
              <span>
                Page {bookingsPage.page + 1} of {bookingsPage.totalPages} ({bookingsPage.totalElements} bookings)
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={bookingsPage.last}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Booking Detail & Status Update Modal */}
      {selectedBooking && (
        <div className="modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Booking #{selectedBooking.id} Details</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="admin-detail-grid">
              <div>
                <label>Customer Name</label>
                <span>{selectedBooking.customerName}</span>
              </div>
              <div>
                <label>Contact Email</label>
                <span>{selectedBooking.customerEmail}</span>
              </div>
              <div>
                <label>Account Email</label>
                <span>{selectedBooking.userEmail}</span>
              </div>
              <div>
                <label>Package</label>
                <span>{selectedBooking.packageTitle}</span>
              </div>
              <div>
                <label>Travel Date</label>
                <span>{selectedBooking.travelStartDate}</span>
              </div>
              <div>
                <label>Travelers</label>
                <span>{selectedBooking.travelers} Guest(s)</span>
              </div>
              <div>
                <label>Calculated Total</label>
                <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{formatINR(selectedBooking.totalPrice)}</span>
              </div>
              <div>
                <label>Booked At</label>
                <span>{selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <form onSubmit={handleStatusSave} style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Booking Status</label>
                  <select
                    className="form-control"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    disabled={ALLOWED_TRANSITIONS[selectedBooking.status]?.length <= 1}
                  >
                    {(ALLOWED_TRANSITIONS[selectedBooking.status] || [selectedBooking.status]).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Status</label>
                  <select
                    className="form-control"
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PAID" disabled={editStatus === 'CANCELLED'}>
                      PAID
                    </option>
                    <option value="FAILED">FAILED</option>
                    <option value="REFUNDED">REFUNDED</option>
                  </select>
                </div>
              </div>

              {(selectedBooking.status === 'CANCELLED' || selectedBooking.status === 'COMPLETED') && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <i className="fa-solid fa-lock"></i> Status transitions are locked because this booking is already {selectedBooking.status}.
                </p>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedBooking(null)}>
                  Close
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={updating}>
                  {updating ? 'Updating...' : 'Save Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsTab;
