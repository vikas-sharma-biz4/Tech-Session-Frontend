import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login } from '../store/slices/authSlice';
import { selectLoading, selectError, selectIsAuthenticated } from '../store/selectors';
import { LoginFormData } from '../types';
import {
  sanitizeInput,
  preventPasswordPaste,
  preventPasswordContextMenu,
} from '../utils/validation';

const schema = yup.object({
  email: yup
    .string()
    .email('Invalid email format')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email must contain @ and domain')
    .max(255, 'Email must be at most 255 characters')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .test(
      'no-leading-space',
      'Password cannot start with a space',
      (value) => !value || !value.startsWith(' ')
    ),
});

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [accountLocked, setAccountLocked] = useState<boolean>(false);
  const [lockTime, setLockTime] = useState<number | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  // Auto-focus on email field when component mounts
  useEffect(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleLogin = (): void => {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    const result = await dispatch(login({ email: data.email, password: data.password }));

    if (login.fulfilled.match(result)) {
      setRemainingAttempts(null);
      setAccountLocked(false);
      setLockTime(null);
      navigate('/dashboard');
    } else if (login.rejected.match(result)) {
      const payload = result.payload as
        | { message?: string; remainingAttempts?: number; remainingTime?: number }
        | string;

      if (typeof payload === 'object' && payload !== null) {
        if (payload.remainingAttempts !== undefined) {
          setRemainingAttempts(payload.remainingAttempts);
        }
        if (payload.remainingTime !== undefined) {
          setAccountLocked(true);
          setLockTime(payload.remainingTime);
        }
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {oauthError && (
          <div className="error-message">Google authentication failed. Please try again.</div>
        )}

        <button type="button" onClick={handleGoogleLogin} className="btn-google" disabled={loading}>
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

        {accountLocked && lockTime && (
          <div
            className="error-message"
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#fee',
              borderRadius: '6px',
            }}
          >
            Account temporarily locked. Please try again after {lockTime} seconds.
          </div>
        )}

        {remainingAttempts !== null && remainingAttempts > 0 && !accountLocked && (
          <div
            className="error-message"
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
              color: '#856404',
            }}
          >
            {remainingAttempts} login attempt{remainingAttempts !== 1 ? 's' : ''} remaining.
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading && !accountLocked) {
              e.currentTarget.requestSubmit();
            }
          }}
        >
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              ref={emailInputRef}
              {...register('email', {
                onChange: (e) => {
                  const sanitized = sanitizeInput(e.target.value);
                  if (sanitized !== e.target.value) {
                    e.target.value = sanitized;
                  }
                },
              })}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
              maxLength={255}
              disabled={accountLocked}
            />
            {errors.email && <div className="error-message">{errors.email.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                {...register('password', {
                  onChange: (e) => {
                    if (e.target.value.startsWith(' ')) {
                      e.target.value = e.target.value.trimStart();
                    }
                  },
                })}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
                onPaste={preventPasswordPaste}
                onContextMenu={preventPasswordContextMenu}
                disabled={accountLocked}
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
                disabled={accountLocked}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <div className="error-message">{errors.password.message}</div>}
          </div>

          <button type="submit" className="btn" disabled={loading || accountLocked}>
            {loading ? 'Signing In...' : accountLocked ? 'Account Locked' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-2">
          <Link to="/forgot-password" className="link">
            Forgot your password?
          </Link>
        </div>

        <div className="text-center mt-2">
          <span>Don't have an account? </span>
          <Link to="/signup" className="link">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
