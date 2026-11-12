import React from 'react';
import { Link } from 'react-router-dom';

const PackageCard = ({ pkg }) => {
  const imageUrl = pkg.coverImage
    ? pkg.coverImage.startsWith('http')
      ? pkg.coverImage
      : `/assets/images/${pkg.coverImage}`
    : '/assets/images/tour1.jpg';

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(pkg.basePrice || 0);

  return (
    <div className="package-card">
      <div className="package-card-img">
        <img
          src={imageUrl}
          alt={pkg.title}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/images/tour1.jpg';
          }}
        />
        <div className="package-card-badge">
          <i className="fa-regular fa-clock"></i> {pkg.duration}
        </div>
        {pkg.destination && (
          <div className="package-card-location">
            <i className="fa-solid fa-location-dot"></i> {pkg.destination}
          </div>
        )}
      </div>

      <div className="package-card-body">
        <h3 className="package-card-title">{pkg.title}</h3>
        <p className="package-card-desc">{pkg.description}</p>

        <div className="package-card-footer">
          <div className="package-card-price">
            <span>Starting From</span>
            <strong>{formattedPrice}</strong>
          </div>
          <Link to={`/packages/${pkg.id}`} className="btn btn-outline btn-sm">
            Explore <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PackageCard;
