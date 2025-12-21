import { api } from './api';

export const usersAPI = {
  // Get all users with filters
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Create user (superadmin only)
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.patch(`/users/${userId}`, userData);
    return response.data;
  },

  // Change user password (superadmin only)
  changePassword: async (userId, newPassword) => {
    const response = await api.patch(`/users/${userId}/password`, { new_password: newPassword });
    return response.data;
  },

  // Delete user (superadmin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
};
