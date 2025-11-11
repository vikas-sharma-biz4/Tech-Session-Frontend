import React, { useState } from 'react';
import { UserRole } from '../types';
import api from '../services/api';

interface RoleSelectionModalProps {
  onRoleSelected: (role: UserRole) => void;
  loading?: boolean;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  onRoleSelected,
  loading: externalLoading,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.put<{ message: string; user: { role: UserRole } }>('/user/role', {
        role: selectedRole,
      });
      onRoleSelected(response.data.user.role);
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Failed to update role. Please try again.');
      setLoading(false);
    }
  };

  const isLoading = loading || externalLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
              <svg
                className="w-9 h-9 text-white"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Book Marketplace!</h2>
          <p className="text-gray-600">Please select your role to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('buyer')}
            disabled={isLoading}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
              selectedRole === 'buyer'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === 'buyer' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}
              >
                {selectedRole === 'buyer' && <div className="w-2 h-2 rounded-full bg-white"></div>}
              </div>
              <div>
                <div className="font-semibold text-gray-900">Buy Books (Buyer)</div>
                <div className="text-sm text-gray-600">Browse and purchase books from sellers</div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('seller')}
            disabled={isLoading}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
              selectedRole === 'seller'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedRole === 'seller' ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                }`}
              >
                {selectedRole === 'seller' && <div className="w-2 h-2 rounded-full bg-white"></div>}
              </div>
              <div>
                <div className="font-semibold text-gray-900">Sell Books (Seller)</div>
                <div className="text-sm text-gray-600">List and manage your book inventory</div>
              </div>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedRole || isLoading}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Setting up your account...' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
