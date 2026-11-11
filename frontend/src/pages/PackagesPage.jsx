import React, { useState, useEffect } from 'react';
import { packageApi } from '../api/packageApi';
import PackageCard from '../components/PackageCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const PackagesPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packageApi.getAllPackages();
      setPackages(data);
    } catch {
      setError('Failed to load packages from server. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Filter and sort packages
  const filteredPackages = packages
    .filter((pkg) => {
      const term = searchTerm.toLowerCase();
      return (
        pkg.title.toLowerCase().includes(term) ||
        pkg.description.toLowerCase().includes(term) ||
        pkg.duration.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') {
        return a.basePrice - b.basePrice;
      }
      if (sortBy === 'price-high') {
        return b.basePrice - a.basePrice;
      }
      return 0;
    });

  return (
    <div className="packages-page">
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(rgba(8,8,8,0.7), rgba(8,8,8,0.9)), url(/assets/images/bg.jpg) center/cover',
          padding: '80px 0 60px',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="container">
          <h1 className="section-title">
            Explore <span>Tour Packages</span>
          </h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Choose from our collection of handpicked getaways across India.
          </p>
        </div>
      </div>

      <div className="container section">
        {/* Search & Filter Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '36px',
            background: 'var(--bg-card)',
            padding: '18px 24px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by destination or package name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <i
              className="fa-solid fa-magnifying-glass"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            ></i>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sort By:</label>
            <select
              className="form-control"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="default">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Content States */}
        {loading && <LoadingSpinner message="Fetching packages from MySQL database..." />}

        {error && <ErrorMessage message={error} onRetry={fetchPackages} />}

        {!loading && !error && filteredPackages.length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-plane-slash"></i>
            <h3>No packages found</h3>
            <p>We couldn't find any tour packages matching your search criteria.</p>
            <button className="btn btn-outline btn-sm" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          </div>
        )}

        {!loading && !error && filteredPackages.length > 0 && (
          <div className="packages-grid">
            {filteredPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;
