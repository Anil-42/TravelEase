import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { packageApi } from '../api/packageApi';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const PackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packageApi.getPackageById(id);
      setPkg(data);
    } catch {
      setError('Tour package not found or unable to load details from server.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleBookNow = () => {
    if (isAuthenticated) {
      navigate(`/book/${id}`);
    } else {
      navigate('/login', { state: { from: { pathname: `/book/${id}` } } });
    }
  };

  if (loading) return <LoadingSpinner message="Loading tour package details..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDetail} />;
  if (!pkg) return null;

  const heroImage = pkg.detailImage
    ? pkg.detailImage.startsWith('http')
      ? pkg.detailImage
      : `/assets/images/${pkg.detailImage}`
    : '/assets/images/Background1.jpg';

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(pkg.basePrice || 0);

  return (
    <div className="package-detail-page">
      {/* Detail Hero Header */}
      <div
        className="detail-hero"
        style={{ backgroundImage: `url('${heroImage}')` }}
      >
        <div className="detail-hero-overlay">
          <div className="container">
            <Link to="/packages" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-arrow-left"></i> Back to all packages
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {pkg.destination && (
                <span className="badge badge-tag">
                  <i className="fa-solid fa-location-dot"></i> {pkg.destination}
                </span>
              )}
              <span className="badge badge-tag">
                <i className="fa-regular fa-clock"></i> {pkg.duration}
              </span>
              <span className={`badge ${pkg.available ? 'badge-confirmed' : 'badge-cancelled'}`}>
                {pkg.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <h1 className="hero-title" style={{ fontSize: '2.8rem', marginTop: '10px', marginBottom: '8px' }}>
              {pkg.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container section" style={{ paddingTop: '40px' }}>
        <div className="detail-layout">
          {/* Left Column: Itinerary, Description, Inclusions */}
          <div className="detail-main">
            {/* Overview */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '16px' }}>Tour Overview</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.8' }}>
                {pkg.description}
              </p>
            </div>

            {/* Itinerary Timeline */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '24px' }}>
                Day-by-Day <span style={{ color: 'var(--primary)' }}>Itinerary</span>
              </h2>

              <div className="timeline-container">
                {pkg.itinerary && pkg.itinerary.length > 0 ? (
                  pkg.itinerary.map((item, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-day">Day {item.day || index + 1}</div>
                      <h4 className="timeline-title">{item.title}</h4>
                      <p className="timeline-desc">{item.details}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Detailed daily schedule will be provided upon booking.</p>
                )}
              </div>
            </div>

            {/* Inclusions */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '16px' }}>
                What's <span style={{ color: 'var(--primary)' }}>Included</span>
              </h2>
              {pkg.inclusions && pkg.inclusions.length > 0 ? (
                <ul className="inclusions-list">
                  {pkg.inclusions.map((inc, i) => (
                    <li key={i}>
                      <i className="fa-solid fa-circle-check"></i>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Standard hotel accommodation, transfers, and sightseeing included.</p>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <div className="detail-sidebar">
            <div className="booking-sidebar-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Base Fare</span>
                <div>
                  <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)' }}>
                    {formattedPrice}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}> / person</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '16px 0', margin: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
                  <span style={{ color: '#fff', fontWeight: '500' }}>{pkg.duration}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Availability:</span>
                  <span style={{ color: pkg.available ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                    {pkg.available ? 'Instant Confirmation' : 'Sold Out'}
                  </span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-block"
                onClick={handleBookNow}
                disabled={!pkg.available}
                style={{ padding: '14px', fontSize: '1.05rem', marginBottom: '16px' }}
              >
                <i className="fa-solid fa-calendar-check"></i> Book This Tour
              </button>

              {!isAuthenticated && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', textAlign: 'center' }}>
                  <i className="fa-solid fa-lock"></i> You will be prompted to sign in before booking.
                </p>
              )}

              {/* Assurances */}
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary)' }}></i>
                  <span>Zero hidden costs – transparent server calculation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--primary)' }}></i>
                  <span>Free booking cancellation while PENDING</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fa-solid fa-phone" style={{ color: 'var(--primary)' }}></i>
                  <span>24/7 on-trip concierge support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPage;
