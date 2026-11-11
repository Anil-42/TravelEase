import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation state
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmModalBooking, setConfirmModalBooking] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingApi.getMyBookings();
      setBookings(data);
    } catch {
      setError('Unable to load your bookings. Please check your network or re-authenticate.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelClick = (booking) => {
    setConfirmModalBooking(booking);
  };

  const handleConfirmCancel = async () => {
    if (!confirmModalBooking) return;
    const targetId = confirmModalBooking.id;
    setCancellingId(targetId);
    setConfirmModalBooking(null);
    setActionMessage(null);

    try {
      const updated = await bookingApi.cancelBooking(targetId);
      setActionMessage({
        type: 'success',
        text: `Booking #${targetId} (${updated.packageTitle}) has been successfully cancelled.`,
      });
      // Refresh list
      fetchBookings();
    } catch (err) {
      setActionMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Failed to cancel booking. Please contact support.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="badge badge-confirmed"><i className="fa-solid fa-circle-check"></i> Confirmed</span>;
      case 'CANCELLED':
        return <span className="badge badge-cancelled"><i className="fa-solid fa-ban"></i> Cancelled</span>;
      default:
        return <span className="badge badge-pending"><i className="fa-solid fa-hourglass-half"></i> Pending</span>;
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'PAID':
        return <span className="badge badge-paid"><i className="fa-solid fa-check"></i> Paid</span>;
      case 'REFUNDED':
        return <span className="badge badge-cancelled"><i className="fa-solid fa-rotate-left"></i> Refunded</span>;
      default:
        return <span className="badge badge-pending"><i className="fa-solid fa-clock"></i> Pending</span>;
    }
  };

  return (
    <div className="container section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '6px' }}>
            My <span>Bookings</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Review, track, and manage your reserved travel itineraries.
          </p>
        </div>
        <Link to="/packages" className="btn btn-outline btn-sm">
          <i className="fa-solid fa-plus"></i> Book Another Trip
        </Link>
      </div>

      {actionMessage && (
        <div className={`alert alert-${actionMessage.type}`}>
          <i className={`fa-solid ${actionMessage.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {loading && <LoadingSpinner message="Retrieving your bookings from database..." />}

      {error && <ErrorMessage message={error} onRetry={fetchBookings} />}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-suitcase-rolling"></i>
          <h3>No bookings yet</h3>
          <p>You have not made any tour reservations. Explore our curated getaways and book your first adventure!</p>
          <Link to="/packages" className="btn btn-primary">
            Explore Tour Packages
          </Link>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="bookings-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-item-card">
              <div className="booking-meta">
                <div className="meta-group">
                  <label>Booking ID</label>
                  <span>#{b.id}</span>
                </div>

                <div className="meta-group" style={{ minWidth: '180px' }}>
                  <label>Package</label>
                  <span>{b.packageTitle}</span>
                </div>

                <div className="meta-group">
                  <label>Travel Date</label>
                  <span>{b.travelStartDate}</span>
                </div>

                <div className="meta-group">
                  <label>Travelers</label>
                  <span>{b.travelers} Guest(s)</span>
                </div>

                <div className="meta-group">
                  <label>Total Fare</label>
                  <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
                    ₹{Number(b.totalPrice).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="meta-group">
                  <label>Booking Status</label>
                  <div>{getStatusBadge(b.status)}</div>
                </div>

                <div className="meta-group">
                  <label>Payment</label>
                  <div>{getPaymentBadge(b.paymentStatus)}</div>
                </div>
              </div>

              {/* Cancellation Action */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {b.status === 'PENDING' ? (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelClick(b)}
                    disabled={cancellingId === b.id}
                  >
                    {cancellingId === b.id ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Cancelling...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-xmark"></i> Cancel Booking
                      </>
                    )}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                    {b.status === 'CANCELLED' ? 'Cancelled' : 'Confirmed'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalBooking && (
        <div className="modal-overlay" onClick={() => setConfirmModalBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--danger)' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '1.5rem' }}></i>
              <h3 style={{ color: '#fff' }}>Cancel Booking #{confirmModalBooking.id}?</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Are you sure you want to cancel your reservation for <strong>{confirmModalBooking.packageTitle}</strong> scheduled for <strong>{confirmModalBooking.travelStartDate}</strong>?
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setConfirmModalBooking(null)}
              >
                Keep Booking
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleConfirmCancel}
              >
                Yes, Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
