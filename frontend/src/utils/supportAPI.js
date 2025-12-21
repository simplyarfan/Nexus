/**
 * Support API
 * Handles support ticket and comment endpoints
 */

import { api } from './api';

export const supportAPI = {
  // Get all tickets for current user (also returns ALL tickets for admin/superadmin - backend handles this)
  getMyTickets: async (params = {}) => {
    const response = await api.get('/tickets', { params });
    return response;
  },

  // Get all tickets (admin only) - same as getMyTickets, backend automatically returns all tickets for admins
  getAllTickets: async (params = {}) => {
    const response = await api.get('/tickets', { params });
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

  // Get ticket details with comments
  getTicketDetails: async (ticketId) => {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data;
  },

  // Resolve ticket
  resolveTicket: async (ticketId, resolution) => {
    const response = await api.patch(`/tickets/${ticketId}/resolve`, { resolution });
    return response;
  },
};

export default supportAPI;
