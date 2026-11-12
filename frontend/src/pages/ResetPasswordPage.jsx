import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';
import PasswordStrengthInput from '../components/PasswordStrengthInput';
import { evaluatePasswordStrength, getFirstPasswordError } from '../utils/passwordPolicy';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token') || '';

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Password reset token is missing from the URL.');
      return;
    }

    const strength = evaluatePasswordStrength(formData.newPassword);
    if (!strength.isValid) {
      setError(getFirstPasswordError(formData.newPassword));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(res.message || 'Password reset successfully! Redirecting to sign in...');
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
      redirectTimerRef.current = setTimeout(() => {
        navigate('/login?reason=password_changed', { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Password reset link is invalid or has expired. Please request a new link.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container section" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center' }}>
      <div className="form-card" style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
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
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '6px' }}>
            Choose New <span>Password</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Set a strong, fresh password for your TravelEase account.
          </p>
        </div>

        {!token ? (
          <div>
            <div className="alert alert-danger">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>Password reset token is missing or malformed. Please request a new password reset link.</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/forgot-password" className="btn btn-primary btn-block">
                Request Password Reset
              </Link>
            </div>
          </div>
        ) : (
          <>
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
              <PasswordStrengthInput
                label="New Password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                confirmValue={formData.confirmPassword}
                onConfirmChange={handleChange}
                disabled={loading || Boolean(success)}
              />

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || Boolean(success)}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Resetting Password...
                  </>
                ) : (
                  'Set New Password'
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                  <i className="fa-solid fa-arrow-left"></i> Return to Sign In
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
