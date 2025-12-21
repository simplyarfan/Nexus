/**
 * Analytics API
 * Handles analytics and reporting endpoints
 */

import { api } from './api';

export const analyticsAPI = {
  // Get overview statistics
  getOverview: async (timeRange = '7d') => {
    const response = await api.get('/analytics/overview', {
      params: { timeRange },
    });
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/users', { params });
    return response.data;
  },

  // Get ticket analytics
  getTicketAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/tickets', { params });
    return response.data;
  },

  // Get CV Intelligence analytics
  getCVAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/cv-intelligence', { params });
    return response.data;
  },

  // Get interview analytics
  getInterviewAnalytics: async (params = {}) => {
    const response = await api.get('/analytics/interviews', { params });
    return response.data;
  },

  // Get system health metrics
  getSystemHealth: async () => {
    const response = await api.get('/analytics/system/health');
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (timeRange = '24h') => {
    const response = await api.get('/analytics/system/performance', {
      params: { timeRange },
    });
    return response.data;
  },

  // Export analytics report
  exportReport: async (reportType, params = {}) => {
    const response = await api.post(
      '/analytics/export',
      { reportType, ...params },
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },

  // Get custom report
  getCustomReport: async (reportConfig) => {
    const response = await api.post('/analytics/custom-report', reportConfig);
    return response.data;
  },
};

export default analyticsAPI;
