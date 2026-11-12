import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthInput from './PasswordStrengthInput';
import { evaluatePasswordStrength, getFirstPasswordError } from '../utils/passwordPolicy';

const INITIAL_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const ChangePasswordModalContent = ({ onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM);

  const [showCurrent, setShowCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const redirectTimerRef = useRef(null);

  const clearPendingTimer = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPendingTimer();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.currentPassword) {
      setError('Current password is required.');
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

    if (formData.currentPassword === formData.newPassword) {
      setError('New password cannot be identical to current password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(res.message || 'Password updated successfully! Revoking session...');
      clearPendingTimer();
      redirectTimerRef.current = setTimeout(() => {
        logout();
        onClose();
        navigate('/login?reason=password_changed');
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
              }}
            >
              <i className="fa-solid fa-key"></i>
            </div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>Change Password</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success" style={{ marginBottom: '16px', fontSize: '0.88rem' }}>
            <i className="fa-solid fa-circle-check"></i>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                className="form-control"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                disabled={loading || Boolean(success)}
                required
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
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
            label="New Password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            confirmValue={formData.confirmPassword}
            onConfirmChange={handleChange}
            disabled={loading || Boolean(success)}
          />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onClose}
              disabled={loading || Boolean(success)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || Boolean(success)}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <ChangePasswordModalContent onClose={onClose} />;
};

export default ChangePasswordModal;
