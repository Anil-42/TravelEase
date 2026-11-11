import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container section" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <i className="fa-solid fa-compass" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
      <h1 style={{ fontSize: '3rem', color: '#fff', marginBottom: '12px' }}>404 – Destination Not Found</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', marginBottom: '30px' }}>
        The page or tour destination you are seeking seems to have wandered off the map.
      </p>
      <Link to="/" className="btn btn-primary">
        <i className="fa-solid fa-house"></i> Return to Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
