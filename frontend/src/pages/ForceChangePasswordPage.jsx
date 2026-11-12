import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthInput from '../components/PasswordStrengthInput';
import { evaluatePasswordStrength, getFirstPasswordError } from '../utils/passwordPolicy';

const ForceChangePasswordPage = () => {
  const { isAuthenticated, mustChangePassword, user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!mustChangePassword && !success) {
    return <Navigate to={user?.role === 'ROLE_ADMIN' ? '/admin' : '/my-bookings'} replace />;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.currentPassword) {
      setError('Please enter your temporary/current password.');
      return;
    }

    const strength = evaluatePasswordStrength(formData.newPassword);
    if (!strength.isValid) {
      setError(getFirstPasswordError(formData.newPassword));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('New password must be different from your temporary password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(res.message || 'Password updated successfully! Please sign in with your new strong password.');
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = setTimeout(() => {
        logout();
        navigate('/login?reason=password_changed', { replace: true });
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update password. Please verify your temporary password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
      <div className="form-card" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              margin: '0 auto 14px',
            }}
          >
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h2 style={{ fontSize: '1.75rem', color: '#fff', marginBottom: '8px' }}>
            Password Update <span>Required</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Signed in as <strong>{user?.email}</strong>. You must replace your temporary password with a strong password before continuing.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <i className="fa-solid fa-circle-check"></i>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Current / Temporary Password <span>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                className="form-control"
                placeholder="Enter your temporary password"
                value={formData.currentPassword}
                onChange={handleChange}
                disabled={loading || Boolean(success)}
                required
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label="Toggle current password visibility"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <i className={`fa-solid ${showCurrent ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <PasswordStrengthInput
            label="New Strong Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            confirmValue={formData.confirmPassword}
            onConfirmChange={handleChange}
            disabled={loading || Boolean(success)}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              disabled={loading || Boolean(success)}
            >
              Sign Out
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={loading || Boolean(success)}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Updating Password...
                </>
              ) : (
                'Save New Password & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
