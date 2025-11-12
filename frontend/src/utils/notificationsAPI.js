/**
 * Notifications API
 * Handles user notification endpoints
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
  baseURL: `${API_BASE_URL}/api/notifications`,
  timeout: 30000, // 30 seconds for notification operations
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

export const notificationsAPI = {
  // Get all notifications for current user
  getNotifications: async (params = {}) => {
    const response = await api.get('/', { params });
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/unread/count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.patch(`/${id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.patch('/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/${id}`);
    return response.data;
  },

  // Delete all notifications
  deleteAllNotifications: async () => {
    const response = await api.delete('/all');
    return response.data;
  },

  // Get notification preferences
  getPreferences: async () => {
    const response = await api.get('/preferences');
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/preferences', preferences);
    return response.data;
  },
};

export default notificationsAPI;
