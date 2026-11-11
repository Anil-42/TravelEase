import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { packageApi } from '../api/packageApi';
import PackageCard from '../components/PackageCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const HomePage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('values');

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packageApi.getAllPackages();
      setPackages(data);
    } catch {
      setError('Unable to load featured packages. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        className="hero"
        style={{ backgroundImage: `url('/assets/images/Background1.jpg')` }}
      >
        <div className="hero-overlay"></div>
        <div className="container hero-content">
          <div className="hero-badge">
            <i className="fa-solid fa-sparkles"></i> Handcrafted Journeys Across India
          </div>
          <h1 className="hero-title">
            Discover Your Next <span>Extraordinary</span> Adventure
          </h1>
          <p className="hero-desc">
            Experience handpicked destinations, royal palaces, mountain escapades, and tranquil backwaters with transparent pricing and full itineraries.
          </p>
          <div className="hero-actions">
            <Link to="/packages" className="btn btn-primary">
              <i className="fa-solid fa-compass"></i> Explore Packages
            </Link>
            <Link to="/contact" className="btn btn-outline">
              <i className="fa-solid fa-paper-plane"></i> Plan Custom Trip
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Counter Banner */}
      <section className="stats-banner">
        <div className="container stats-grid">
          <div className="stat-item">
            <h3>4+</h3>
            <p>Curated Destinations</p>
          </div>
          <div className="stat-item">
            <h3>₹9,499</h3>
            <p>Starting Tour Fare</p>
          </div>
          <div className="stat-item">
            <h3>100%</h3>
            <p>Verified Boutique Stays</p>
          </div>
          <div className="stat-item">
            <h3>24/7</h3>
            <p>Dedicated Concierge</p>
          </div>
        </div>
      </section>

      {/* Featured Packages Section */}
      <section className="section" id="packages">
        <div className="container">
          <h2 className="section-title">
            Featured <span>Tour</span> Packages
          </h2>
          <p className="section-subtitle">
            Explore our bestselling vacation packages with transparent server-side pricing, included meals, and guided sightseeing.
          </p>

          {loading && <LoadingSpinner message="Loading curated packages from database..." />}

          {error && <ErrorMessage message={error} onRetry={fetchPackages} />}

          {!loading && !error && packages.length > 0 && (
            <>
              <div className="packages-grid">
                {packages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginTop: '48px' }}>
                <Link to="/packages" className="btn btn-outline">
                  Browse All Packages <i className="fa-solid fa-arrow-right"></i>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="section" id="about" style={{ background: 'var(--bg-surface)' }}>
        <div className="container about-grid">
          <div className="about-img">
            <img src="/assets/images/About us.jpg" alt="About TravelEase" />
          </div>

          <div className="about-content">
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '16px' }}>
              About <span>TravelEase</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '20px' }}>
              TravelEase is designed to make holiday planning effortless and authentic. We curate end-to-end holiday experiences that blend comfortable accommodations, scenic routes, and memorable local excursions.
            </p>

            {/* Interactive Tabs */}
            <div className="about-tabs">
              <button
                className={`about-tab-btn ${activeTab === 'values' ? 'active' : ''}`}
                onClick={() => setActiveTab('values')}
              >
                Our Values
              </button>
              <button
                className={`about-tab-btn ${activeTab === 'features' ? 'active' : ''}`}
                onClick={() => setActiveTab('features')}
              >
                Why Choose Us
              </button>
              <button
                className={`about-tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
                onClick={() => setActiveTab('experience')}
              >
                Experience
              </button>
            </div>

            <div className="about-tab-content">
              {activeTab === 'values' && (
                <ul>
                  <li>
                    <i className="fa-solid fa-check" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Transparent Pricing:</span> No hidden surcharges, exact pricing per person calculated upfront.
                    </div>
                  </li>
                  <li>
                    <i className="fa-solid fa-check" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Handcrafted Itineraries:</span> Every day is thoughtfully planned to balance adventure and relaxation.
                    </div>
                  </li>
                  <li>
                    <i className="fa-solid fa-check" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Comfortable Stays:</span> Verified 3-star, heritage, and resort hotels in scenic locations.
                    </div>
                  </li>
                </ul>
              )}

              {activeTab === 'features' && (
                <ul>
                  <li>
                    <i className="fa-solid fa-shield-halved" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Hassle-Free Booking:</span> Select dates, choose travelers, and reserve instantly with your account.
                    </div>
                  </li>
                  <li>
                    <i className="fa-solid fa-car" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Private Cab Transfers:</span> Pickups, drop-offs, and sightseeing in sanitized, comfortable vehicles.
                    </div>
                  </li>
                  <li>
                    <i className="fa-solid fa-utensils" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Included Dining:</span> Daily breakfast and regional specialties included in each itinerary.
                    </div>
                  </li>
                </ul>
              )}

              {activeTab === 'experience' && (
                <ul>
                  <li>
                    <i className="fa-solid fa-star" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Goa Coastal Fun:</span> Baga beachside leisure, Aguada fort history, and Mandovi river cruise.
                    </div>
                  </li>
                  <li>
                    <i className="fa-solid fa-star" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Manali Alpine Peaks:</span> Solang Valley snow sports, Hidimba Temple, and Vashisht hot springs.
                    </div>
                  </li>
                  <li>
                    <i className="fa-solid fa-star" style={{ color: 'var(--primary)', marginTop: '4px' }}></i>
                    <div>
                      <span>Jaipur & Kerala:</span> Royal Amber Fort dining, Munnar tea estates, and Alleppey backwater houseboats.
                    </div>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section" id="services">
        <div className="container">
          <h2 className="section-title">
            Our <span>Signature</span> Services
          </h2>
          <p className="section-subtitle">
            From mountain escapes to coastal getaways, discover our end-to-end travel capabilities.
          </p>

          <div className="services-grid">
            <div className="service-card">
              <i className="fa-solid fa-globe"></i>
              <h3>Curated Tour Packages</h3>
              <p>Handpicked holiday packages covering India’s most iconic scenic and cultural destinations.</p>
            </div>

            <div className="service-card">
              <i className="fa-solid fa-plane-departure"></i>
              <h3>Transfers & Sightseeing</h3>
              <p>Airport and railway transfers with dedicated cabs for private, comfortable sightseeing.</p>
            </div>

            <div className="service-card">
              <i className="fa-solid fa-hotel"></i>
              <h3>Verified Accommodations</h3>
              <p>Hand-selected 3-star hotels, mountain-view resorts, and traditional backwater houseboats.</p>
            </div>

            <div className="service-card">
              <i className="fa-solid fa-headset"></i>
              <h3>24/7 Travel Concierge</h3>
              <p>Dedicated customer support to assist you before, during, and after your journey.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section
        className="section"
        style={{
          background: 'linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(/assets/images/Background2.jpg) center/cover',
          textAlign: 'center',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div className="container" style={{ maxWidth: '700px' }}>
          <h2 className="section-title">Ready to Plan Your Next Journey?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px' }}>
            Browse our packages or send an inquiry to customize your ideal holiday itinerary with our travel specialists.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/packages" className="btn btn-primary">
              Browse Packages Now
            </Link>
            <Link to="/contact" className="btn btn-outline">
              Contact Concierge
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
