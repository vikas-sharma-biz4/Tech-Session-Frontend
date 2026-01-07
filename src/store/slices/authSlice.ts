import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { fastApi } from '../../services/api';
import { User } from '../../types';
import secureStorage from '../../utils/secureStorage';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue, getState }) => {
    // Prevent duplicate concurrent calls
    const state = getState() as { auth: { loading: boolean; user: User | null } };
    if (state.auth.loading) {
      // Already checking, return existing user or null
      return state.auth.user;
    }

    try {
      const token = await secureStorage.getItem('token');
      if (!token) {
        return null;
      }

      if (fastApi.defaults.headers.common) {
        fastApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      // FastAPI endpoint: GET /api/auth/me
      const response = await fastApi.get<User>('/api/auth/me');
      return response.data;
    } catch (error) {
      await secureStorage.removeItem('token');
      if (fastApi.defaults.headers.common) {
        delete fastApi.defaults.headers.common['Authorization'];
      }
      return rejectWithValue('Token verification failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // FastAPI uses OAuth2PasswordRequestForm (form data) with username/password
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fastApi.post<{ access_token: string; token_type: string }>(
        '/api/auth/login',
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const token = response.data.access_token;

      // Get user info using the token
      if (fastApi.defaults.headers.common) {
        fastApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      const userResponse = await fastApi.get<User>('/api/auth/me');
      const user = userResponse.data;

      await secureStorage.setItem('token', token);
      if (fastApi.defaults.headers.common) {
        fastApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return user;
    } catch (error) {
      const axiosError = error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            remainingAttempts?: number;
            remainingTime?: number;
          };
        };
      };

      if (axiosError.response?.status === 423) {
        return rejectWithValue({
          message: axiosError.response?.data?.message || 'Account temporarily locked',
          remainingTime: axiosError.response?.data?.remainingTime,
        });
      }

      if (axiosError.response?.status === 401) {
        return rejectWithValue({
          message: axiosError.response?.data?.message || 'Invalid credentials',
          remainingAttempts: axiosError.response?.data?.remainingAttempts,
        });
      }

      return rejectWithValue(axiosError.response?.data?.message || 'Login failed');
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (
    {
      name,
      email,
      password,
      role,
    }: { name: string; email: string; password: string; role?: 'buyer' | 'seller' | 'admin' },
    { rejectWithValue }
  ) => {
    try {
      // FastAPI endpoint: POST /api/auth/signup
      const response = await fastApi.post<User>('/api/auth/signup', {
        name,
        email,
        password,
        role: role || 'buyer',
      });

      const user = response.data;

      // Auto-login after signup
      const loginFormData = new URLSearchParams();
      loginFormData.append('username', email);
      loginFormData.append('password', password);

      const loginResponse = await fastApi.post<{ access_token: string; token_type: string }>(
        '/api/auth/login',
        loginFormData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const token = loginResponse.data.access_token;
      await secureStorage.setItem('token', token);
      if (fastApi.defaults.headers.common) {
        fastApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return { success: true, email, user };
    } catch (error) {
      const axiosError = error as { response?: { data?: { detail?: string; message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.detail || axiosError.response?.data?.message || 'Signup failed'
      );
    }
  }
);

export const verifySignupOTP = createAsyncThunk(
  'auth/verifySignupOTP',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<{ token: string; user: User }>('/auth/verify-signup-otp', {
        email,
        otp,
      });
      const { token, user } = response.data;

      await secureStorage.setItem('token', token);
      if (fastApi.defaults.headers.common) {
        fastApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      return user;
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post<{ message: string; success?: boolean }>(
        '/auth/forgot-password',
        { email }
      );
      const data = response.data;
      if (data.success !== false) {
        return { success: true };
      }
      return rejectWithValue(data.message || 'Failed to send OTP');
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Failed to send reset email');
    }
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      await api.post('/auth/verify-otp', { email, otp });
      return { success: true };
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const resetPasswordWithOTP = createAsyncThunk(
  'auth/resetPasswordWithOTP',
  async (
    { email, otp, password }: { email: string; otp: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      await api.post('/auth/reset-password-otp', { email, otp, password });
      return { success: true };
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Password reset failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }: { token: string; password: string }, { rejectWithValue }) => {
    try {
      await api.post('/auth/reset-password', { token, password });
      return { success: true };
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      return rejectWithValue(axiosError.response?.data?.message || 'Password reset failed');
    }
  }
);

export const handleOAuthCallback = createAsyncThunk(
  'auth/handleOAuthCallback',
  async ({ token, user }: { token: string; user: User }, { rejectWithValue }) => {
    try {
      await secureStorage.setItem('token', token);
      if (fastApi.defaults.headers.common) {
        fastApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      return user;
    } catch (error) {
      return rejectWithValue('OAuth authentication failed');
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'auth/updateUserRole',
  async (role: 'buyer' | 'seller' | 'admin', { rejectWithValue }) => {
    try {
      // FastAPI endpoint: PUT /api/user/role with body { role: "buyer" }
      const response = await fastApi.put<User>('/api/user/role', { role });
      return response.data;
    } catch (error) {
      const axiosError = error as { response?: { data?: { detail?: string; message?: string } } };
      return rejectWithValue(
        axiosError.response?.data?.detail ||
          axiosError.response?.data?.message ||
          'Failed to update role'
      );
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      secureStorage.removeItem('token').catch((err) => {
        console.error('Failed to remove token:', err);
      });
      if (fastApi.defaults.headers.common) {
        delete fastApi.defaults.headers.common['Authorization'];
      }
      if (api.defaults.headers.common) {
        delete api.defaults.headers.common['Authorization'];
      }
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(verifySignupOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifySignupOTP.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifySignupOTP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(handleOAuthCallback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(handleOAuthCallback.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(handleOAuthCallback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
