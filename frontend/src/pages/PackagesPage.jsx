import React, { useState, useEffect, useCallback } from 'react';
import { packageApi } from '../api/packageApi';
import PackageCard from '../components/PackageCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const PackagesPage = () => {
  const [pagedData, setPagedData] = useState({ content: [], page: 0, totalPages: 0, totalElements: 0, first: true, last: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: debouncedSearch,
        page,
        size: 9,
        sortBy: sortBy === 'default' ? 'id' : 'basePrice',
        direction: sortBy === 'price-high' ? 'desc' : 'asc',
      };
      const data = await packageApi.getPagedPackages(params);
      setPagedData(data);
    } catch {
      setError('Failed to load packages from server. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, sortBy]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

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
            Choose from our collection of {pagedData.totalElements || 10} handpicked getaways across India.
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
              placeholder="Search by destination, title, or experience..."
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
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
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

        {!loading && !error && pagedData.content.length === 0 && (
          <div className="empty-state">
            <i className="fa-solid fa-plane-slash"></i>
            <h3>No packages found</h3>
            <p>We couldn't find any tour packages matching your search criteria.</p>
            <button className="btn btn-outline btn-sm" onClick={() => setSearchTerm('')}>
              Clear Search
            </button>
          </div>
        )}

        {!loading && !error && pagedData.content.length > 0 && (
          <>
            <div className="packages-grid">
              {pagedData.content.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

            {pagedData.totalPages > 1 && (
              <div className="admin-pagination" style={{ marginTop: '40px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={pagedData.first}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <i className="fa-solid fa-chevron-left"></i> Previous
                </button>
                <span>
                  Page {pagedData.page + 1} of {pagedData.totalPages} ({pagedData.totalElements} packages)
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={pagedData.last}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PackagesPage;
