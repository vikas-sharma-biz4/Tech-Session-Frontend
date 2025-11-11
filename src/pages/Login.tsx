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
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

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
      // Get user from result to check role
      const user = result.payload as { role?: 'buyer' | 'seller' | 'admin' } | undefined;
      const userRole = user?.role || 'buyer';

      // Redirect based on role
      if (userRole === 'seller' || userRole === 'admin') {
        navigate('/dashboard'); // Seller dashboard
      } else {
        // For buyers, redirect to buyer dashboard (next-frontend)
        // Since this is the seller frontend, we'll redirect to dashboard
        // In a real scenario, you might redirect to a different URL
        navigate('/dashboard');
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        {oauthError && (
          <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-md">
            Google authentication failed. Please try again.
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">OR</span>
          </div>
        </div>

        {accountLocked && lockTime && (
          <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-md">
            Account temporarily locked. Please try again after {lockTime} seconds.
          </div>
        )}

        {remainingAttempts !== null && remainingAttempts > 0 && !accountLocked && (
          <div className="text-sm p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
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
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...(() => {
                const { ref, ...rest } = register('email', {
                  onChange: (e) => {
                    const sanitized = sanitizeInput(e.target.value);
                    if (sanitized !== e.target.value) {
                      e.target.value = sanitized;
                    }
                  },
                });
                return {
                  ...rest,
                  ref: (e: HTMLInputElement | null) => {
                    ref(e);
                    emailInputRef.current = e;
                  },
                };
              })()}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              maxLength={255}
              disabled={accountLocked}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
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
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                onPaste={preventPasswordPaste}
                onContextMenu={preventPasswordContextMenu}
                disabled={accountLocked}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
                disabled={accountLocked}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={loading || accountLocked}
          >
            {loading ? 'Signing In...' : accountLocked ? 'Account Locked' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="text-center">
          <span className="text-sm text-gray-600">Don't have an account? </span>
          <Link to="/signup" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
