/**
 * Profile API
 * Handles user profile and settings endpoints
 */

import axios from 'axios';
import { tokenManager } from './api';

// Get API base URL (expected format: https://domain.com)
// IMPORTANT: NEXT_PUBLIC_API_URL environment variable is REQUIRED
if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error('NEXT_PUBLIC_API_URL environment variable is not set');
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
  timeout: 30000, // 30 seconds for profile operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests using shared tokenManager
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request tracking
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(7);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Handle response errors with token refresh support
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

export const profileAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await api.post('/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete profile picture
  deleteProfilePicture: async () => {
    const response = await api.delete('/profile/picture');
    return response.data;
  },

  // Get user preferences
  getPreferences: async () => {
    const response = await api.get('/preferences');
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/preferences', preferences);
    return response.data;
  },

  // Toggle two-factor authentication
  toggleTwoFactor: async (enabled) => {
    const response = await api.put('/two-factor/toggle', { enabled });
    return response.data;
  },
};

export default profileAPI;
