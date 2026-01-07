import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { handleOAuthCallback, updateUserRole } from '../store/slices/authSlice';
import { User, UserRole } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import RoleSelectionModal from '../components/RoleSelectionModal';

const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');
    const newUser = searchParams.get('newUser') === 'true';

    if (error) {
      navigate('/login?error=oauth_failed');
      return;
    }

    if (token && userParam) {
      try {
        const parsedUser: User = JSON.parse(decodeURIComponent(userParam));
        setUser(parsedUser);
        dispatch(handleOAuthCallback({ token, user: parsedUser })).then(() => {
          // If new user and role is 'buyer' (default), show role selection
          if (newUser && (!parsedUser.role || parsedUser.role === 'buyer')) {
            setShowRoleSelection(true);
          } else {
            // Redirect based on role
            const userRole = parsedUser.role || 'buyer';
            if (userRole === 'seller' || userRole === 'admin') {
              navigate('/dashboard');
            } else {
              // For buyers, redirect to buyer dashboard (next-frontend)
              window.location.href = 'http://localhost:3000/dashboard';
            }
          }
        });
      } catch (err) {
        navigate('/login?error=oauth_failed');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, dispatch, navigate]);

  const handleRoleSelected = async (role: UserRole) => {
    if (user) {
      try {
        await dispatch(updateUserRole(role)).unwrap();
        // Redirect based on selected role
        if (role === 'seller' || role === 'admin') {
          navigate('/dashboard');
        } else {
          // For buyers, redirect to buyer dashboard (next-frontend)
          window.location.href = 'http://localhost:3000/dashboard';
        }
      } catch (error) {
        console.error('Failed to update role:', error);
      }
    }
  };

  if (showRoleSelection) {
    return <RoleSelectionModal onRoleSelected={handleRoleSelected} />;
  }

  return <LoadingSpinner />;
};

export default OAuthCallback;
