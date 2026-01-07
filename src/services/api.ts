import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  AxiosRequestHeaders,
} from 'axios';
import secureStorage from '../utils/secureStorage';

// Support both Node.js backend and FastAPI backend
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const FASTAPI_BASE_URL = process.env.REACT_APP_FASTAPI_URL || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate instance for FastAPI if needed
export const fastApi: AxiosInstance = axios.create({
  baseURL: FASTAPI_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for both API instances
const requestInterceptor = async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getItem('token');
  if (token && config.headers) {
    (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response interceptor for both API instances
const responseInterceptor = {
  onFulfilled: (response: AxiosResponse) => response,
  onRejected: async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await secureStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
};

api.interceptors.request.use(requestInterceptor, (error: AxiosError) => {
  return Promise.reject(error);
});

api.interceptors.response.use(responseInterceptor.onFulfilled, responseInterceptor.onRejected);

// Apply same interceptors to FastAPI instance
fastApi.interceptors.request.use(requestInterceptor, (error: AxiosError) => {
  return Promise.reject(error);
});

fastApi.interceptors.response.use(responseInterceptor.onFulfilled, responseInterceptor.onRejected);

export default api;
