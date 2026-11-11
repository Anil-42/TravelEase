import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/authApi';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your account email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.forgotPassword({ email: email.trim().toLowerCase() });
      setSubmittedMessage(res.message || 'If that email address is in our system, you will receive password reset instructions shortly.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to process password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
      <div className="form-card" style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(13, 148, 136, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              margin: '0 auto 16px',
            }}
          >
            <i className="fa-solid fa-lock"></i>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '6px' }}>
            Forgot <span>Password?</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enter your registered email and we'll send you instructions to securely reset your password.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {submittedMessage ? (
          <div>
            <div className="alert alert-success">
              <i className="fa-solid fa-envelope-circle-check"></i>
              <span>{submittedMessage}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', margin: '20px 0' }}>
              The reset link will expire in <strong>15 minutes</strong> and can only be used once. Please check your inbox and spam folder.
            </p>
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link to="/login" className="btn btn-outline btn-block">
                <i className="fa-solid fa-arrow-left"></i> Return to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{ marginTop: '12px' }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Sending Instructions...
                </>
              ) : (
                'Send Reset Instructions'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-arrow-left"></i> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
