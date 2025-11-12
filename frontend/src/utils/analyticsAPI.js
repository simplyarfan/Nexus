/**
 * Analytics API
 * Handles analytics and reporting endpoints
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
  baseURL: `${API_BASE_URL}/api/analytics`,
  timeout: 30000, // 30 seconds for analytics operations
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

export const analyticsAPI = {
  // Get overview statistics
  getOverview: async (timeRange = '7d') => {
    const response = await api.get('/overview', {
      params: { timeRange },
    });
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get ticket analytics
  getTicketAnalytics: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  // Get CV Intelligence analytics
  getCVAnalytics: async (params = {}) => {
    const response = await api.get('/cv-intelligence', { params });
    return response.data;
  },

  // Get interview analytics
  getInterviewAnalytics: async (params = {}) => {
    const response = await api.get('/interviews', { params });
    return response.data;
  },

  // Get system health metrics
  getSystemHealth: async () => {
    const response = await api.get('/system/health');
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (timeRange = '24h') => {
    const response = await api.get('/system/performance', {
      params: { timeRange },
    });
    return response.data;
  },

  // Export analytics report
  exportReport: async (reportType, params = {}) => {
    const response = await api.post(
      '/export',
      { reportType, ...params },
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },

  // Get custom report
  getCustomReport: async (reportConfig) => {
    const response = await api.post('/custom-report', reportConfig);
    return response.data;
  },
};

export default analyticsAPI;
