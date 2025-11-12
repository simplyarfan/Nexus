/**
 * Support API
 * Handles support ticket and comment endpoints
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
  baseURL: `${API_BASE_URL}/api/tickets`,
  timeout: 30000, // 30 seconds for support operations
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

export const supportAPI = {
  // Get all tickets for current user
  getMyTickets: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response;
  },

  // Get all tickets (admin only)
  getAllTickets: async (params = {}) => {
    const response = await api.get('/tickets/all', { params });
    return response;
  },

  // Get ticket by ID
  getTicket: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response;
  },

  // Create new ticket
  createTicket: async (ticketData) => {
    const response = await api.post('/tickets', ticketData);
    return response;
  },

  // Update ticket
  updateTicket: async (id, updates) => {
    const response = await api.patch(`/tickets/${id}`, updates);
    return response;
  },

  // Update ticket status
  updateTicketStatus: async (id, status) => {
    const response = await api.patch(`/tickets/${id}/status`, { status });
    return response;
  },

  // Delete ticket
  deleteTicket: async (id) => {
    const response = await api.delete(`/tickets/${id}`);
    return response;
  },

  // Get comments for a ticket
  getTicketComments: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}/comments`);
    return response;
  },

  // Add comment to ticket
  addComment: async (ticketId, comment, isInternal = false) => {
    const response = await api.post(`/tickets/${ticketId}/comments`, {
      comment,
      is_internal: isInternal,
    });
    return response;
  },

  // Update comment
  updateComment: async (ticketId, commentId, comment) => {
    const response = await api.patch(`/tickets/${ticketId}/comments/${commentId}`, { comment });
    return response;
  },

  // Delete comment
  deleteComment: async (ticketId, commentId) => {
    const response = await api.delete(`/tickets/${ticketId}/comments/${commentId}`);
    return response;
  },

  // Assign ticket (admin only)
  assignTicket: async (ticketId, userId) => {
    const response = await api.post(`/tickets/${ticketId}/assign`, { userId });
    return response;
  },

  // Get ticket statistics (admin only)
  getTicketStats: async () => {
    const response = await api.get('/tickets/stats');
    return response;
  },
};

export default supportAPI;
