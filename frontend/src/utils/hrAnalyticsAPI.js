/**
 * Recruitment Analytics API
 * Handles recruitment user interview statistics and tracking
 */

import { api } from './api';

export const hrAnalyticsAPI = {
  /**
   * Get all recruitment users with interview statistics
   * @param {string} dateRange - Filter by date range: '7d', '30d', '90d', 'all'
   */
  getHRUserStats: async (dateRange = 'all') => {
    const response = await api.get('/hr-analytics/users', {
      params: { dateRange },
    });
    return response.data;
  },

  /**
   * Get selection/rejection outcome data for charts
   * @param {string} dateRange - Filter by date range: '7d', '30d', '90d', 'all'
   */
  getOutcomeStats: async (dateRange = 'all') => {
    const response = await api.get('/hr-analytics/outcomes', {
      params: { dateRange },
    });
    return response.data;
  },

  /**
   * Get all interviews with interviewer details
   * @param {object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.dateRange - Filter by date range
   * @param {number} params.userId - Filter by specific user
   */
  getAllInterviews: async (params = {}) => {
    const response = await api.get('/hr-analytics/interviews', { params });
    return response.data;
  },

  /**
   * Get candidates interviewed by specific recruiter
   * @param {number} userId - HR user ID
   * @param {object} params - Query parameters
   */
  getCandidatesByInterviewer: async (userId, params = {}) => {
    const response = await api.get(`/hr-analytics/users/${userId}/candidates`, { params });
    return response.data;
  },
};

export default hrAnalyticsAPI;
