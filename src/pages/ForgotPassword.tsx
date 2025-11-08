import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from '../store/hooks';
import { forgotPassword, resetPasswordWithOTP } from '../store/slices/authSlice';
import { ForgotPasswordFormData, ResetPasswordFormData } from '../types';

const emailSchema: yup.ObjectSchema<ForgotPasswordFormData> = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

const otpSchema: yup.ObjectSchema<ResetPasswordFormData> = yup.object({
  otp: yup.string().matches(/^[0-9]{6}$/, 'OTP must be 6 digits').required('OTP is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
});

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [canResend, setCanResend] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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

  const emailForm = useForm<ForgotPasswordFormData>({
    mode: 'onChange',
    resolver: yupResolver(emailSchema),
  });

  const otpForm = useForm<ResetPasswordFormData>({
    mode: 'onChange',
    resolver: yupResolver(otpSchema),
  });

  const onEmailSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await dispatch(forgotPassword(data.email));
    
    if (forgotPassword.fulfilled.match(result)) {
      const payload = result.payload as { success: boolean; resetUrl?: string; otp?: string };
      if (payload.success) {
        setEmail(data.email);
        setSuccess('OTP sent to your email! Please check your inbox.');
        setResendTimer(60);
        setCanResend(false);
        setTimeout(() => {
          setStep(2);
          setSuccess('');
        }, 2000);
      } else {
        setError('Failed to send OTP');
      }
    } else {
      setError((result.payload as string) || 'Failed to send OTP');
    }

    setLoading(false);
  };

  const onOTPSubmit = async (data: ResetPasswordFormData): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccess('');

    const result = await dispatch(resetPasswordWithOTP({ email, otp: data.otp, password: data.password }));

    if (resetPasswordWithOTP.fulfilled.match(result)) {
      const payload = result.payload as { success: boolean };
      if (payload.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError('Password reset failed');
      }
    } else {
      setError((result.payload as string) || 'Password reset failed');
    }

    setLoading(false);
  };

  const onResendOTP = async (): Promise<void> => {
    if (!canResend) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await dispatch(forgotPassword(email));

    if (forgotPassword.fulfilled.match(result)) {
      const payload = result.payload as { success: boolean; resetUrl?: string; otp?: string };
      if (payload.success) {
        setSuccess('New OTP sent to your email!');
        setResendTimer(60);
        setCanResend(false);
      } else {
        setError('Failed to resend OTP');
      }
    } else {
      setError((result.payload as string) || 'Failed to resend OTP');
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>{step === 1 ? 'Enter your email to receive an OTP' : 'Enter OTP and your new password'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {step === 1 && (
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                {...emailForm.register('email')}
                className={emailForm.formState.errors.email ? 'error' : ''}
              />
              {emailForm.formState.errors.email && (
                <div className="error-message">{emailForm.formState.errors.email.message}</div>
              )}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)}>
            <div className="form-group">
              <label htmlFor="otp">OTP Code</label>
              <input
                type="text"
                id="otp"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                {...otpForm.register('otp')}
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

            <div className="form-group">
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                New Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter new password"
                {...otpForm.register('password')}
                className={otpForm.formState.errors.password ? 'error' : ''}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '16px',
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
              />
              {otpForm.formState.errors.password && (
                <div className="error-message">{otpForm.formState.errors.password.message}</div>
              )}
            </div>

            <div className="form-group">
              <label
                htmlFor="confirmPassword"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  color: '#333',
                }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                {...otpForm.register('confirmPassword')}
                className={otpForm.formState.errors.confirmPassword ? 'error' : ''}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '6px',
                  fontSize: '16px',
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
              />
              {otpForm.formState.errors.confirmPassword && (
                <div className="error-message">{otpForm.formState.errors.confirmPassword.message}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.2s ease',
                marginTop: '20px',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="text-center mt-2">
          <Link to="/login" className="link">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

