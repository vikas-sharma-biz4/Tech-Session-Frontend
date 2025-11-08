import React from 'react';
import { validatePasswordStrength } from '../utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  if (!password) {
    return null;
  }

  const { score, feedback, isValid } = validatePasswordStrength(password);

  const getStrengthLabel = (): string => {
    if (score === 0) return 'Very Weak';
    if (score === 1) return 'Weak';
    if (score === 2) return 'Fair';
    if (score === 3) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (): string => {
    if (score === 0 || score === 1) return '#e74c3c';
    if (score === 2) return '#f39c12';
    if (score === 3) return '#3498db';
    return '#2ecc71';
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: index < score ? getStrengthColor() : '#e0e0e0',
                borderRadius: '2px',
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: '12px', color: getStrengthColor(), fontWeight: '600' }}>
          {getStrengthLabel()}
        </span>
      </div>
      {feedback.length > 0 && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          <div style={{ fontWeight: '600', marginBottom: '2px' }}>Requirements:</div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {feedback.map((item, index) => (
              <li key={index} style={{ marginBottom: '2px' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {isValid && (
        <div style={{ fontSize: '12px', color: '#2ecc71', marginTop: '4px', fontWeight: '600' }}>
          ✓ Password meets all requirements
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
