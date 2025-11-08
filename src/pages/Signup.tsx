import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signup, verifySignupOTP } from '../store/slices/authSlice';
import { selectLoading, selectError, selectIsAuthenticated } from '../store/selectors';
import { SignupFormData } from '../types';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import {
  sanitizeInput,
  preventPasswordPaste,
  preventPasswordContextMenu,
  formatOTPInput,
  validatePasswordNoLeadingSpaces,
} from '../utils/validation';

// Password validation regex: 8-16 chars, alphanumeric, at least one uppercase, one lowercase, one number, one special char
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,16}$/;
const namePattern = /^[a-zA-Z\s'-]{2,50}$/;

const signupSchema: yup.ObjectSchema<SignupFormData> = yup.object({
  name: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .matches(namePattern, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .required('Name is required')
    .test(
      'no-leading-space',
      'Name cannot start with a space',
      (value) => !value || value.trim() === value
    ),
  email: yup
    .string()
    .email('Invalid email format')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email must contain @ and domain')
    .max(255, 'Email must be at most 255 characters')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must be at most 16 characters')
    .matches(
      passwordPattern,
      'Password must contain 8-16 characters with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&#)'
    )
    .test('no-leading-space', 'Password cannot start with a space', validatePasswordNoLeadingSpaces)
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const otpSchema = yup.object({
  otp: yup
    .string()
    .matches(/^[0-9]{6}$/, 'OTP must be 6 digits')
    .required('OTP is required'),
});

interface OTPFormData {
  otp: string;
}

const Signup: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();

  const signupForm = useForm<SignupFormData>({
    mode: 'onChange',
    resolver: yupResolver(signupSchema),
  });

  const otpForm = useForm<OTPFormData>({
    mode: 'onChange',
    resolver: yupResolver(otpSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Auto-focus on name field when component mounts
  useEffect(() => {
    if (step === 1 && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((timer) => {
          if (timer <= 1) {
            setCanResend(true);
            return 0;
          }
          return timer - 1;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleGoogleSignup = (): void => {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const onSignupSubmit = async (data: SignupFormData): Promise<void> => {
    const result = await dispatch(
      signup({ name: data.name, email: data.email, password: data.password })
    );

    if (signup.fulfilled.match(result)) {
      const payload = result.payload as { success: boolean; email?: string };
      if (payload.success) {
        setEmail(data.email);
        setSuccess('Account created! Please check your email for verification OTP.');
        setResendTimer(60);
        setCanResend(false);
        setTimeout(() => {
          setStep(2);
          setSuccess('');
        }, 2000);
      }
    }
  };

  const onOTPSubmit = async (data: OTPFormData): Promise<void> => {
    const result = await dispatch(verifySignupOTP({ email, otp: data.otp }));

    if (verifySignupOTP.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  const onResendOTP = async (): Promise<void> => {
    if (!canResend || !email) return;

    const result = await dispatch(
      signup({
        name: signupForm.getValues('name'),
        email,
        password: signupForm.getValues('password'),
      })
    );

    if (signup.fulfilled.match(result)) {
      setSuccess('New OTP sent to your email!');
      setResendTimer(60);
      setCanResend(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>{step === 1 ? 'Sign up for a new account' : 'Verify your email address'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="btn-google"
              disabled={loading}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.86-2.6 3.29-4.53 6.15-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <div className="divider">
              <span>OR</span>
            </div>

            <form
              onSubmit={signupForm.handleSubmit(onSignupSubmit)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.currentTarget.requestSubmit();
                }
              }}
            >
              <div className="form-group">
                <label htmlFor="name">
                  Full Name <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  ref={nameInputRef}
                  {...signupForm.register('name', {
                    onChange: (e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      if (sanitized !== e.target.value) {
                        e.target.value = sanitized;
                      }
                    },
                  })}
                  className={signupForm.formState.errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
                {signupForm.formState.errors.name && (
                  <div className="error-message">{signupForm.formState.errors.name.message}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  {...signupForm.register('email', {
                    onChange: (e) => {
                      const sanitized = sanitizeInput(e.target.value);
                      if (sanitized !== e.target.value) {
                        e.target.value = sanitized;
                      }
                    },
                  })}
                  className={signupForm.formState.errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                  maxLength={255}
                />
                {signupForm.formState.errors.email && (
                  <div className="error-message">{signupForm.formState.errors.email.message}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    {...signupForm.register('password', {
                      onChange: (e) => {
                        if (e.target.value.startsWith(' ')) {
                          e.target.value = e.target.value.trimStart();
                        }
                      },
                    })}
                    className={signupForm.formState.errors.password ? 'error' : ''}
                    placeholder="Enter password (8-16 characters)"
                    maxLength={16}
                    onPaste={preventPasswordPaste}
                    onContextMenu={preventPasswordContextMenu}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <div className="error-message">
                    {signupForm.formState.errors.password.message}
                  </div>
                )}
                <PasswordStrengthIndicator password={signupForm.watch('password') || ''} />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm Password <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    {...signupForm.register('confirmPassword', {
                      onChange: (e) => {
                        if (e.target.value.startsWith(' ')) {
                          e.target.value = e.target.value.trimStart();
                        }
                      },
                    })}
                    className={signupForm.formState.errors.confirmPassword ? 'error' : ''}
                    placeholder="Confirm your password"
                    maxLength={16}
                    onPaste={preventPasswordPaste}
                    onContextMenu={preventPasswordContextMenu}
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#666',
                    }}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <div className="error-message">
                    {signupForm.formState.errors.confirmPassword.message}
                  </div>
                )}
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)}>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                {...otpForm.register('otp', {
                  onChange: (e) => {
                    e.target.value = formatOTPInput(e.target.value);
                  },
                })}
                className={otpForm.formState.errors.otp ? 'error' : ''}
                style={{
                  letterSpacing: 'normal',
                  textAlign: 'left',
                  fontSize: '16px',
                  fontWeight: '400',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  width: '100%',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4A90E2';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e1e5e9';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              {otpForm.formState.errors.otp && (
                <div className="error-message">{otpForm.formState.errors.otp.message}</div>
              )}

              <div
                style={{
                  textAlign: 'right',
                  marginTop: '8px',
                  fontSize: '14px',
                }}
              >
                {canResend ? (
                  <button
                    type="button"
                    onClick={onResendOTP}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4A90E2',
                      textDecoration: 'underline',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: loading ? 0.6 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <span
                    style={{
                      color: '#666',
                      fontSize: '13px',
                      fontStyle: 'italic',
                    }}
                  >
                    Resend OTP in {resendTimer}s
                  </span>
                )}
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        <div className="text-center mt-2">
          <span>Already have an account? </span>
          <Link to="/login" className="link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
