import { api } from './api';

export const onboardingAPI = {
  // ============ EMPLOYEES ============

  // Create employee from candidate (Recruitment triggers this)
  createEmployee: async (data) => {
    const response = await api.post('/onboarding/employees', data);
    return response.data;
  },

  // Get all employees with filters
  getEmployees: async (params = {}) => {
    const response = await api.get('/onboarding/employees', { params });
    return response.data;
  },

  // Get single employee with full details
  getEmployee: async (employeeId) => {
    const response = await api.get(`/onboarding/employees/${employeeId}`);
    return response.data;
  },

  // Update employee information
  updateEmployee: async (employeeId, data) => {
    const response = await api.patch(`/onboarding/employees/${employeeId}`, data);
    return response.data;
  },

  // Update employee status
  updateEmployeeStatus: async (employeeId, status) => {
    const response = await api.patch(`/onboarding/employees/${employeeId}/status`, { status });
    return response.data;
  },

  // Delete employee (also resets candidate's hired status)
  deleteEmployee: async (employeeId) => {
    const response = await api.delete(`/onboarding/employees/${employeeId}`);
    return response.data;
  },

  // ============ ONBOARDING ============

  // Get onboarding record for employee
  getOnboarding: async (employeeId) => {
    const response = await api.get(`/onboarding/${employeeId}`);
    return response.data;
  },

  // Update checklist item
  updateChecklistItem: async (onboardingId, { category, itemId, completed }) => {
    const response = await api.patch(`/onboarding/${onboardingId}/checklist`, {
      category,
      itemId,
      completed,
    });
    return response.data;
  },

  // Assign HR staff or buddy
  assignOnboarding: async (onboardingId, { assignedTo, buddyId }) => {
    const response = await api.patch(`/onboarding/${onboardingId}/assign`, {
      assignedTo,
      buddyId,
    });
    return response.data;
  },

  // Update onboarding notes
  updateNotes: async (onboardingId, notes) => {
    const response = await api.patch(`/onboarding/${onboardingId}/notes`, { notes });
    return response.data;
  },

  // ============ EMAILS ============

  // Send welcome email
  sendWelcomeEmail: async (employeeId) => {
    const response = await api.post(`/onboarding/${employeeId}/emails/welcome`);
    return response.data;
  },

  // Send document request email
  sendDocumentRequestEmail: async (employeeId) => {
    const response = await api.post(`/onboarding/${employeeId}/emails/documents`);
    return response.data;
  },

  // Send first day info email
  sendFirstDayInfoEmail: async (employeeId) => {
    const response = await api.post(`/onboarding/${employeeId}/emails/first-day`);
    return response.data;
  },

  // ============ STATS & UTILITIES ============

  // Get onboarding statistics
  getStats: async () => {
    const response = await api.get('/onboarding/stats/overview');
    return response.data;
  },

  // Get HR users for assignment dropdowns
  getHRUsers: async () => {
    const response = await api.get('/onboarding/hr-users/list');
    return response.data;
  },

  // Test Google Sheets connection
  testGoogleSheets: async () => {
    const response = await api.get('/onboarding/google-sheets/test');
    return response.data;
  },

  // Get Google Sheets data for debugging
  getGoogleSheetsData: async (limit = 10) => {
    const response = await api.get('/onboarding/google-sheets/data', { params: { limit } });
    return response.data;
  },
};
