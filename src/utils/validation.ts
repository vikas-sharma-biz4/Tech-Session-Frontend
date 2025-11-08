/**
 * Password strength validation
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters');
  }

  if (password.length <= 16) {
    score++;
  } else {
    feedback.push('At most 16 characters');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('One lowercase letter');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('One uppercase letter');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('One number');
  }

  if (/[@$!%*?&#]/.test(password)) {
    score++;
  } else {
    feedback.push('One special character (@$!%*?&#)');
  }

  const isValid = score >= 6 && password.length >= 8 && password.length <= 16;

  return {
    score: Math.min(score, 4), // Cap at 4 for UI display
    feedback,
    isValid,
  };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validate name format
 */
export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name);
};

/**
 * Prevent copy-paste on password fields
 */
export const preventPasswordPaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
  e.preventDefault();
};

/**
 * Prevent context menu on password fields (right-click)
 */
export const preventPasswordContextMenu = (e: React.MouseEvent<HTMLInputElement>): void => {
  e.preventDefault();
};

/**
 * Format OTP input (numbers only)
 */
export const formatOTPInput = (value: string): string => {
  return value.replace(/\D/g, '').substring(0, 6);
};

/**
 * Trim leading/trailing spaces from input
 */
export const trimInput = (value: string): string => {
  return value.trim();
};

/**
 * Validate no leading spaces in password
 */
export const validatePasswordNoLeadingSpaces = (password: string): boolean => {
  return password.length === 0 || password[0] !== ' ';
};
