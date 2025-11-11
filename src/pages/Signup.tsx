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
  role: yup
    .string()
    .oneOf(['buyer', 'seller', 'admin'], 'Invalid role selected')
    .required('Please select your role'),
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
  const nameInputRef = useRef<HTMLInputElement | null>(null);

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
      signup({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role || 'buyer',
      })
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
      const user = result.payload as { role?: 'buyer' | 'seller' | 'admin' } | undefined;
      const userRole = user?.role || 'buyer';

      // Redirect based on role
      if (userRole === 'seller' || userRole === 'admin') {
        navigate('/dashboard'); // Seller dashboard
      } else {
        navigate('/dashboard'); // For now, same dashboard
      }
    }
  };

  const onResendOTP = async (): Promise<void> => {
    if (!canResend || !email) return;

    const result = await dispatch(
      signup({
        name: signupForm.getValues('name'),
        email,
        password: signupForm.getValues('password'),
        role: signupForm.getValues('role') || 'buyer',
      })
    );

    if (signup.fulfilled.match(result)) {
      setSuccess('New OTP sent to your email!');
      setResendTimer(60);
      setCanResend(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">
            {step === 1 ? 'Sign up for a new account' : 'Verify your email address'}
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-600 p-3 bg-green-50 border border-green-200 rounded-md">
            {success}
          </div>
        )}

        {step === 1 && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignup}
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

            <form
              onSubmit={signupForm.handleSubmit(onSignupSubmit)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading) {
                  e.currentTarget.requestSubmit();
                }
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...(() => {
                    const { ref, ...rest } = signupForm.register('name', {
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
                        nameInputRef.current = e;
                      },
                    };
                  })()}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    signupForm.formState.errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                  maxLength={50}
                />
                {signupForm.formState.errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    signupForm.formState.errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  maxLength={255}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
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
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      signupForm.formState.errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter password (8-16 characters)"
                    maxLength={16}
                    onPaste={preventPasswordPaste}
                    onContextMenu={preventPasswordContextMenu}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
                <PasswordStrengthIndicator password={signupForm.watch('password') || ''} />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  I want to <span className="text-red-500">*</span>
                </label>
                <select
                  id="role"
                  {...signupForm.register('role')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    signupForm.formState.errors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select your role</option>
                  <option value="buyer">Buy Books (Buyer)</option>
                  <option value="seller">Sell Books (Seller)</option>
                </select>
                {signupForm.formState.errors.role && (
                  <p className="mt-1 text-sm text-red-600">
                    {signupForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
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
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      signupForm.formState.errors.confirmPassword
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                    maxLength={16}
                    onPaste={preventPasswordPaste}
                    onContextMenu={preventPasswordContextMenu}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                {signupForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
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
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  otpForm.formState.errors.otp ? 'border-red-500' : 'border-gray-300'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              {otpForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-600">{otpForm.formState.errors.otp.message}</p>
              )}

              <div className="text-right mt-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={onResendOTP}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <span className="text-sm text-gray-500 italic">Resend OTP in {resendTimer}s</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        )}

        <div className="text-center">
          <span className="text-sm text-gray-600">Already have an account? </span>
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
