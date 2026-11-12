import React, { useState, useMemo } from 'react';
import { evaluatePasswordStrength } from '../utils/passwordPolicy';

const PasswordStrengthInput = ({
  label = 'Password',
  name = 'password',
  value,
  onChange,
  placeholder = 'Enter a password (8–128 chars)',
  disabled = false,
  required = true,
  showChecklist = true,
  confirmValue,
  onConfirmChange,
  confirmName = 'confirmPassword',
  confirmLabel = 'Confirm Password',
  error = '',
  confirmError = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = useMemo(() => evaluatePasswordStrength(value || ''), [value]);

  const showConfirmField = typeof onConfirmChange === 'function';
  const passwordsMatch = showConfirmField && Boolean(confirmValue) && value === confirmValue;
  const passwordsMismatch = showConfirmField && Boolean(confirmValue) && value !== confirmValue;

  return (
    <div>
      <div className="form-group">
        <label className="form-label">
          {label} {required && <span>*</span>}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            name={name}
            className="form-control"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            style={{ paddingRight: '42px' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}

        {/* Real-time strength bar */}
        {showChecklist && (
          <div className="pw-meter-wrap">
            <div className="pw-meter-header">
              <span>Password Strength</span>
              <strong style={{ color: strength.color }}>{strength.label}</strong>
            </div>
            <div className="pw-meter-track">
              <div
                className="pw-meter-fill"
                style={{
                  width: `${strength.percent}%`,
                  background: strength.color,
                }}
              />
            </div>

            <ul className="pw-checklist">
              {strength.checks.map((item) => (
                <li key={item.id} className={item.passed ? 'passed' : 'pending'}>
                  <i className={`fa-solid ${item.passed ? 'fa-circle-check' : 'fa-circle-dot'}`}></i>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {showConfirmField && (
        <div className="form-group">
          <label className="form-label">
            {confirmLabel} {required && <span>*</span>}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              name={confirmName}
              className="form-control"
              placeholder="Re-enter your password"
              value={confirmValue}
              onChange={onConfirmChange}
              disabled={disabled}
              required={required}
              style={{ paddingRight: '42px' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
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
              <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
          {passwordsMatch && (
            <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '5px' }}>
              <i className="fa-solid fa-check"></i> Passwords match
            </p>
          )}
          {passwordsMismatch && (
            <p className="form-error">Passwords do not match.</p>
          )}
          {!passwordsMismatch && confirmError && <p className="form-error">{confirmError}</p>}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthInput;
