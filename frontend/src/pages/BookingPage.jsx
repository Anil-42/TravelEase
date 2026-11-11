import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { packageApi } from '../api/packageApi';
import { bookingApi } from '../api/bookingApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Compute tomorrow's date outside render to avoid impure function call
const getTomorrowDate = () => {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().split('T')[0];
};

const BookingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tomorrow = getTomorrowDate();

  const [formData, setFormData] = useState({
    customerName: user?.username || '',
    customerEmail: user?.email || '',
    travelStartDate: tomorrow,
    travelers: '1', // String state allows user to delete/backspace and type freely
  });

  const [travelersError, setTravelersError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPackage = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await packageApi.getPackageById(id);
        if (isMounted) setPkg(data);
      } catch {
        if (isMounted) {
          setError('Tour package not found. Please choose a valid package.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPackage();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (submitError) setSubmitError('');
  };

  const handleTravelersChange = (e) => {
    const val = e.target.value;

    // 1. Allow temporary empty string so user can clear/backspace the field
    if (val === '') {
      setFormData((prev) => ({ ...prev, travelers: '' }));
      setTravelersError('Please enter number of travelers (1–50).');
      if (submitError) setSubmitError('');
      return;
    }

    // 2. Reject non-numeric input (decimals, negatives, plus, symbols, letters)
    if (!/^\d+$/.test(val)) {
      return;
    }

    const num = parseInt(val, 10);

    // 3. Validate bounds (1 to 50)
    if (num === 0) {
      setFormData((prev) => ({ ...prev, travelers: val }));
      setTravelersError('Minimum number of travelers is 1.');
    } else if (num > 50) {
      setFormData((prev) => ({ ...prev, travelers: val }));
      setTravelersError('Maximum number of travelers is 50 per booking.');
    } else {
      setFormData((prev) => ({ ...prev, travelers: val }));
      setTravelersError('');
    }

    if (submitError) setSubmitError('');
  };

  const handleTravelersBlur = () => {
    // When leaving field, restore to 1 if empty or 0, clamp to 50 if > 50
    const parsed = parseInt(formData.travelers, 10);
    if (!formData.travelers || isNaN(parsed) || parsed < 1) {
      setFormData((prev) => ({ ...prev, travelers: '1' }));
      setTravelersError('');
    } else if (parsed > 50) {
      setFormData((prev) => ({ ...prev, travelers: '50' }));
      setTravelersError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerEmail.trim()) {
      setSubmitError('Customer name and email are required.');
      return;
    }
    if (!formData.travelStartDate) {
      setSubmitError('Please select a travel start date.');
      return;
    }

    const travelerCount = parseInt(formData.travelers, 10);
    if (
      !formData.travelers ||
      isNaN(travelerCount) ||
      travelerCount < 1 ||
      travelerCount > 50 ||
      !/^\d+$/.test(String(formData.travelers).trim())
    ) {
      setSubmitError('Number of travelers must be a valid whole number between 1 and 50.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const bookingPayload = {
        packageId: parseInt(id, 10),
        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        travelStartDate: formData.travelStartDate,
        travelers: travelerCount,
      };

      const result = await bookingApi.createBooking(bookingPayload);
      setConfirmedBooking(result);
    } catch (err) {
      if (err.response?.data?.message) {
        setSubmitError(err.response.data.message);
      } else if (err.response?.data?.details) {
        setSubmitError(Object.values(err.response.data.details).join(', '));
      } else {
        setSubmitError('Failed to create booking. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Preparing booking details..." />;
  if (error) return <ErrorMessage message={error} onRetry={() => navigate('/packages')} />;
  if (!pkg) return null;

  // Dynamic fare preview based on valid traveler count
  const parsedCount = parseInt(formData.travelers, 10);
  const isValidTravelers = !isNaN(parsedCount) && parsedCount >= 1 && parsedCount <= 50;
  const effectiveCount = isValidTravelers ? parsedCount : 0;
  const estimatedPreview = (pkg.basePrice * effectiveCount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  // If booking submitted, show receipt
  if (confirmedBooking) {
    return (
      <div className="container section" style={{ maxWidth: '650px' }}>
        <div className="form-card" style={{ maxWidth: '100%', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 20px',
            }}
          >
            <i className="fa-solid fa-clock"></i>
          </div>

          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>
            Booking Request Received!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Your booking reference is <strong>#{confirmedBooking.id}</strong>.
          </p>

          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'left',
              marginBottom: '24px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.92rem' }}>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block', textTransform: 'uppercase', fontSize: '0.78rem' }}>Package</span>
                <strong style={{ color: '#fff' }}>{confirmedBooking.packageTitle}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block', textTransform: 'uppercase', fontSize: '0.78rem' }}>Travelers</span>
                <strong style={{ color: '#fff' }}>{confirmedBooking.travelers} Guest(s)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block', textTransform: 'uppercase', fontSize: '0.78rem' }}>Travel Start Date</span>
                <strong style={{ color: '#fff' }}>{confirmedBooking.travelStartDate}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block', textTransform: 'uppercase', fontSize: '0.78rem' }}>Server Total Fare</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.2rem' }}>
                  ₹{Number(confirmedBooking.totalPrice).toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block', textTransform: 'uppercase', fontSize: '0.78rem' }}>Booking Status</span>
                <span className="badge badge-pending">
                  {confirmedBooking.status}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-subtle)', display: 'block', textTransform: 'uppercase', fontSize: '0.78rem' }}>Payment Status</span>
                <span className="badge badge-pending">
                  {confirmedBooking.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          <div className="alert alert-info" style={{ textAlign: 'left', fontSize: '0.88rem' }}>
            <i className="fa-solid fa-circle-info" style={{ fontSize: '1.2rem' }}></i>
            <span>
              Your reservation request has been submitted and is currently <strong>PENDING</strong> confirmation. Our team will review and confirm your booking. You can track or cancel this reservation anytime from your dashboard.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '24px' }}>
            <Link to="/my-bookings" className="btn btn-primary">
              <i className="fa-solid fa-suitcase-rolling"></i> View My Bookings
            </Link>
            <Link to="/packages" className="btn btn-outline">
              Browse More Packages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to={`/packages/${id}`} style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
          <i className="fa-solid fa-arrow-left"></i> Back to package details
        </Link>
        <h1 className="section-title" style={{ textAlign: 'left', marginTop: '10px' }}>
          Reserve <span>{pkg.title}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Complete the form below. Total fare is calculated and verified on the server ({pkg.duration}).
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
        {/* Form Column */}
        <div className="form-card" style={{ maxWidth: '100%', margin: 0 }}>
          {submitError && (
            <div className="alert alert-danger">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Lead Traveler Name <span>*</span></label>
              <input
                type="text"
                name="customerName"
                className="form-control"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Full name as on ID"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email <span>*</span></label>
              <input
                type="email"
                name="customerEmail"
                className="form-control"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="Booking voucher will be sent here"
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Travel Start Date <span>*</span></label>
              <input
                type="date"
                name="travelStartDate"
                className="form-control"
                value={formData.travelStartDate}
                min={tomorrow}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Number of Travelers <span>*</span></label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                name="travelers"
                className="form-control"
                value={formData.travelers}
                onChange={handleTravelersChange}
                onBlur={handleTravelersBlur}
                placeholder="1"
                required
                disabled={submitting}
              />
              {travelersError ? (
                <p className="form-error">{travelersError}</p>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  Base rate ₹{pkg.basePrice.toLocaleString('en-IN')} per traveler (1 to 50 guests)
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting || Boolean(travelersError)}
              style={{ marginTop: '16px' }}
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Confirming with Server...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </form>
        </div>

        {/* Fare Summary Card */}
        <div>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
            }}
          >
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '16px' }}>
              Fare Breakdown
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Price:</span>
              <span style={{ color: '#fff' }}>₹{pkg.basePrice.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Travelers:</span>
              <span style={{ color: isValidTravelers ? '#fff' : 'var(--text-subtle)' }}>
                {isValidTravelers ? `× ${parsedCount}` : '—'}
              </span>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span style={{ fontWeight: '600', color: '#fff' }}>Estimated Total:</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                {isValidTravelers ? estimatedPreview : '₹0'}
              </strong>
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: 'var(--text-subtle)',
                lineHeight: '1.5',
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
              Total price is verified and enforced on the server. Client totals are never trusted.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
