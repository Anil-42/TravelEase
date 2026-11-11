import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Success notice if redirected from register or password change
  const queryParams = new URLSearchParams(location.search);
  const passwordChangedNotice = queryParams.get('reason') === 'password_changed'
    ? 'Password successfully changed. Please log in with your new password.'
    : '';
  const successNotice = location.state?.message || passwordChangedNotice || '';
  const returnTo = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Redirect user to their intended destination
      navigate(returnTo, { replace: true });
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (err.response?.status === 403) {
        setError('Your account is deactivated. Please contact customer support.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to connect to authentication server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
      <div className="form-card" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>
            Welcome <span>Back</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Sign in to access your bookings and travel details.
          </p>
        </div>

        {successNotice && (
          <div className="alert alert-success">
            <i className="fa-solid fa-circle-check"></i>
            <span>{successNotice}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
            style={{ marginTop: '10px' }}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Authenticating...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '0.9rem' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Create One Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
