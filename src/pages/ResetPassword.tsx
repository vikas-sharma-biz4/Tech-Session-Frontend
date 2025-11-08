import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from '../store/hooks';
import { resetPassword } from '../store/slices/authSlice';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const schema: yup.ObjectSchema<ResetPasswordFormData> = yup.object({
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
});

const ResetPassword: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: ResetPasswordFormData): Promise<void> => {
    if (!token) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await dispatch(resetPassword({ token, password: data.password }));

    if (resetPassword.fulfilled.match(result)) {
      const payload = result.payload as { success: boolean };
      if (payload.success) {
        setSuccess('Password reset successfully! You can now sign in.');
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

  if (!token) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              {...register('password')}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <div className="error-message">{errors.password.message}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <div className="error-message">{errors.confirmPassword.message}</div>}
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-2">
          <Link to="/login" className="link">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

