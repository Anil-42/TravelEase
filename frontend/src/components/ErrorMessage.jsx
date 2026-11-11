import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div className="alert alert-danger" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{message || 'An unexpected error occurred.'}</span>
        </div>
        {onRetry && (
          <button className="btn btn-outline btn-sm" onClick={onRetry}>
            <i className="fa-solid fa-rotate-right"></i> Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
