import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email address.';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // On successful registration, guide user to login
      navigate('/login', {
        state: { message: 'Registration successful! Please sign in with your credentials.' },
      });
    } catch (err) {
      if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else if (err.response?.data?.details) {
        const details = err.response.data.details;
        const msg = Object.values(details).join(', ');
        setServerError(msg || 'Registration failed. Please check your details.');
      } else {
        setServerError('Unable to connect to server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
      <div className="form-card" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '8px' }}>
            Create Your <span>Account</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Join TravelEase to reserve and manage your holiday tours.
          </p>
        </div>

        {serverError && (
          <div className="alert alert-danger">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">
              Full Name or Username <span>*</span>
            </label>
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="e.g. anil_traveler"
              value={formData.username}
              onChange={handleChange}
              disabled={submitting}
            />
            {errors.username && <p className="form-error">{errors.username}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address <span>*</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">
              Password (min. 6 characters) <span>*</span>
            </label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={submitting}
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            style={{ marginTop: '10px' }}
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Registering...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '24px', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
