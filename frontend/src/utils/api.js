import axios from 'axios';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';

export const tokenManager = {
  getAccessToken: () => {
    return Cookies.get('accessToken');
  },

  getRefreshToken: () => {
    return Cookies.get('refreshToken');
  },

  setTokens: (accessToken, refreshToken) => {
    // Determine if running in production based on environment variable or hostname
    const isProduction =
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'production' &&
      window.location.hostname !== '127.0.0.1';

    // IMPORTANT: Clear ALL old tokens first to prevent stale cookie issues
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });

    // Also try to remove with different paths in case there are duplicates
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');

    // Now set fresh tokens
    Cookies.set('accessToken', accessToken, {
      expires: 1, // 1 day for access token
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });

    Cookies.set('refreshToken', refreshToken, {
      expires: 30, // 30 days for refresh token
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    });
  },

  clearTokens: () => {
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      // Add 30 second buffer to refresh before actual expiration
      return decoded.exp * 1000 < Date.now() + 30000;
    } catch (error) {
      return true;
    }
  },
};

// Get API base URL from environment variable
// IMPORTANT: Always use NEXT_PUBLIC_API_URL environment variable
// For local development, set: NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
// For production, set: NEXT_PUBLIC_API_URL=https://your-production-api.com
const getApiBaseUrl = () => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL environment variable is required');
  }
  return process.env.NEXT_PUBLIC_API_URL;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Add request interceptor to automatically include auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor for automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check for specific error messages indicating token issues
    const errorMessage = error.response?.data?.message || '';
    const isInvalidToken =
      errorMessage.includes('invalid') ||
      errorMessage.includes('expired') ||
      errorMessage.includes('signature') ||
      errorMessage.includes('Session expired');

    // If 401 error and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If it's an invalid token error, don't try to refresh, just redirect
      if (isInvalidToken) {
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?reason=session_expired';
        }
        return Promise.reject(error);
      }

      try {
        const refreshToken = tokenManager.getRefreshToken();

        if (!refreshToken) {
          // No refresh token available, redirect to login
          tokenManager.clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(error);
        }

        // Try to refresh the token
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
          refreshToken,
        });

        // Store new tokens
        tokenManager.setTokens(data.accessToken, data.refreshToken);

        // Update the failed request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login?reason=token_refresh_failed';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { api };
export default api;
