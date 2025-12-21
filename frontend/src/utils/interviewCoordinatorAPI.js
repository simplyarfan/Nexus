/**
 * Interview Coordinator API
 * Handles all interview scheduling and management endpoints
 */

import { api } from './api';

export const interviewCoordinatorAPI = {
  // Get all interviews for the current user
  getInterviews: async () => {
    const response = await api.get('/interview-coordinator/interviews');
    return response.data;
  },

  // Get interview by ID
  getInterview: async (id) => {
    const response = await api.get(`/interview-coordinator/interviews/${id}`);
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

    const response = await api.post('/interview-coordinator/request-availability', formData, {
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

    const response = await api.post(`/interview-coordinator/${id}/schedule`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update interview status
  updateInterviewStatus: async (id, status) => {
    const response = await api.patch(`/interview-coordinator/interviews/${id}/status`, { status });
    return response.data;
  },

  // Cancel interview
  cancelInterview: async (id, reason) => {
    const response = await api.post(`/interview-coordinator/interviews/${id}/cancel`, { reason });
    return response.data;
  },

  // Reschedule interview
  rescheduleInterview: async (id, newDateTime) => {
    const response = await api.post(`/interview-coordinator/interviews/${id}/reschedule`, { newDateTime });
    return response.data;
  },

  // Delete interview
  deleteInterview: async (id) => {
    const response = await api.delete(`/interview-coordinator/interviews/${id}`);
    return response.data;
  },
};

export default interviewCoordinatorAPI;
