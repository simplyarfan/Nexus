/**
 * Profile API
 * Handles user profile and settings endpoints
 */

import { api } from './api';

export const profileAPI = {
  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Update password
  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const response = await api.post('/auth/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete profile picture
  deleteProfilePicture: async () => {
    const response = await api.delete('/auth/profile/picture');
    return response.data;
  },

  // Get user preferences
  getPreferences: async () => {
    const response = await api.get('/auth/preferences');
    return response.data;
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const response = await api.put('/auth/preferences', preferences);
    return response.data;
  },

  // Toggle two-factor authentication
  toggleTwoFactor: async (enabled) => {
    const response = await api.put('/auth/two-factor/toggle', { enabled });
    return response.data;
  },
};

export default profileAPI;
