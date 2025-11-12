/**
 * Interview Coordinator API
 * Handles all interview scheduling and management endpoints
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
  baseURL: `${API_BASE_URL}/api/interview-coordinator`,
  timeout: 60000, // 1 minute for interview operations
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

export const interviewCoordinatorAPI = {
  // Get all interviews for the current user
  getInterviews: async () => {
    const response = await api.get('/interviews');
    return response.data;
  },

  // Get interview by ID
  getInterview: async (id) => {
    const response = await api.get(`/interviews/${id}`);
    return response.data;
  },

  // Request availability from candidate (Stage 1)
  requestAvailability: async (data) => {
    const formData = new FormData();

    // Add form fields
    Object.keys(data).forEach((key) => {
      if (key === 'cvFile' && data[key]) {
        formData.append('cvFile', data[key]);
      } else if (data[key]) {
        formData.append(key, data[key]);
      }
    });

    const response = await api.post('/request-availability', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Schedule interview (Stage 2)
  scheduleInterview: async (id, data) => {
    const formData = new FormData();

    // Add form fields
    Object.keys(data).forEach((key) => {
      if (key === 'cvFile' && data[key]) {
        formData.append('cvFile', data[key]);
      } else if (data[key]) {
        formData.append(key, data[key]);
      }
    });

    const response = await api.post(`/${id}/schedule`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update interview status
  updateInterviewStatus: async (id, status) => {
    const response = await api.patch(`/interviews/${id}/status`, { status });
    return response.data;
  },

  // Cancel interview
  cancelInterview: async (id, reason) => {
    const response = await api.post(`/interviews/${id}/cancel`, { reason });
    return response.data;
  },

  // Reschedule interview
  rescheduleInterview: async (id, newDateTime) => {
    const response = await api.post(`/interviews/${id}/reschedule`, { newDateTime });
    return response.data;
  },

  // Delete interview
  deleteInterview: async (id) => {
    const response = await api.delete(`/interviews/${id}`);
    return response.data;
  },
};

export default interviewCoordinatorAPI;
