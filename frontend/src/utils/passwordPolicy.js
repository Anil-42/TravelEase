export function evaluatePasswordStrength(password = '') {
  const checks = [
    {
      id: 'length',
      label: '8 to 128 characters',
      passed: password.length >= 8 && password.length <= 128,
    },
    {
      id: 'uppercase',
      label: 'At least 1 uppercase letter (A-Z)',
      passed: /[A-Z]/.test(password),
    },
    {
      id: 'lowercase',
      label: 'At least 1 lowercase letter (a-z)',
      passed: /[a-z]/.test(password),
    },
    {
      id: 'digit',
      label: 'At least 1 number (0-9)',
      passed: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'At least 1 special character (!@#$%^&* etc.)',
      passed: /[^A-Za-z0-9\s]/.test(password),
    },
    {
      id: 'whitespace',
      label: 'No leading or trailing spaces',
      passed: password.length > 0 && password === password.trim(),
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const allPassed = passedCount === checks.length;

  let level = 'weak';
  let label = 'Weak';
  let color = 'var(--danger)';

  if (!password) {
    level = 'empty';
    label = 'Enter password';
    color = 'var(--text-subtle)';
  } else if (allPassed && password.length >= 12) {
    level = 'very-strong';
    label = 'Very Strong';
    color = 'var(--success)';
  } else if (allPassed) {
    level = 'strong';
    label = 'Strong';
    color = 'var(--success)';
  } else if (passedCount >= 4) {
    level = 'good';
    label = 'Fair — almost there';
    color = 'var(--warning)';
  }

  return {
    checks,
    passedCount,
    totalCount: checks.length,
    percent: password ? Math.round((passedCount / checks.length) * 100) : 0,
    isValid: allPassed,
    level,
    label,
    color,
  };
}

export function getFirstPasswordError(password) {
  const result = evaluatePasswordStrength(password || '');
  if (result.isValid) return '';
  const failed = result.checks.find((c) => !c.passed);
  return failed ? `Password requirement not met: ${failed.label}` : 'Password does not meet security requirements.';
}
