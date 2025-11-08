import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { handleOAuthCallback } from '../store/slices/authSlice';
import { User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=oauth_failed');
      return;
    }

    if (token && userParam) {
      try {
        const user: User = JSON.parse(decodeURIComponent(userParam));
        dispatch(handleOAuthCallback({ token, user })).then(() => {
          navigate('/dashboard');
        });
      } catch (err) {
        navigate('/login?error=oauth_failed');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, dispatch, navigate]);

  return <LoadingSpinner />;
};

export default OAuthCallback;

