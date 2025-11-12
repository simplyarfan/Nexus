import axios from 'axios';
import { tokenManager } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Create axios instance for users API
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/users`,
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await tokenManager.refreshAccessToken();
        const newToken = tokenManager.getAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export const usersAPI = {
  // Get all users with filters
  getUsers: async (params = {}) => {
    const response = await api.get('/', { params });
    return response.data;
  },

  // Get single user
  getUser: async (userId) => {
    const response = await api.get(`/${userId}`);
    return response.data;
  },

  // Create user (superadmin only)
  createUser: async (userData) => {
    const response = await api.post('/', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.patch(`/${userId}`, userData);
    return response.data;
  },

  // Change user password (superadmin only)
  changePassword: async (userId, newPassword) => {
    const response = await api.patch(`/${userId}/password`, { new_password: newPassword });
    return response.data;
  },

  // Delete user (superadmin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/${userId}`);
    return response.data;
  },
};
