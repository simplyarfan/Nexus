import axios from 'axios';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';

// Direct axios for health checks (used once)

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  let baseUrl;

  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_API_URL) {
    baseUrl = process.env.NEXT_PUBLIC_API_URL;
  } else if (typeof window === 'undefined') {
    // Server-side rendering fallback
    baseUrl = 'https://thesimpleai.vercel.app';
  } else {
    // Client-side fallback
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:5000';
    } else {
      // Production fallback
      baseUrl = 'https://thesimpleai.vercel.app';
    }
  }

  return baseUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Create optimized axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Add /api prefix since backend routes are mounted at /api/*
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Token management utility
export const tokenManager = {
  getAccessToken: () => {
    const token = Cookies.get('accessToken');
    return token;
  },
  getRefreshToken: () => {
    const token = Cookies.get('refreshToken');
    return token;
  },

  setTokens: (accessToken, refreshToken) => {
    const isProduction =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    const cookieOptions = {
      expires: 30, // Increased from 7 to 30 days
      path: '/',
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
    };

    Cookies.set('accessToken', accessToken, cookieOptions);
    Cookies.set('refreshToken', refreshToken, {
      ...cookieOptions,
      expires: 90, // Increased from 30 to 90 days
    });
  },

  clearTokens: () => {
    Cookies.remove('accessToken', { path: '/' });
    Cookies.remove('refreshToken', { path: '/' });
  },

  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },

  getUserFromToken: (token) => {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  },
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();

    if (token && !tokenManager.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(7);

    return config;
  },
  (error) => {
    console.error('🔍 [API] Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken && !tokenManager.isTokenExpired(refreshToken)) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {
            refreshToken,
          });

          if (response.data?.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            tokenManager.setTokens(accessToken, newRefreshToken || refreshToken);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } else {
            throw new Error('Token refresh response invalid');
          }
        } catch (refreshError) {
          console.error('❌ [AUTH] Token refresh failed:', refreshError.message);
          tokenManager.clearTokens();
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
            window.location.href = '/auth/login';
          }
        }
      } else {
        tokenManager.clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
          window.location.href = '/auth/login';
        }
      }
    }

    console.error(`❌ ${error.response?.status || 'Network'} Error:`, error.message);
    return Promise.reject(error);
  },
);

// API Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  checkAuth: () => api.get('/auth/check'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  updateProfile: (data) => api.put('/auth/profile', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),

  // 2FA methods
  enable2FA: () => api.post('/auth/enable-2fa').then((res) => res.data),
  disable2FA: (password) => api.post('/auth/disable-2fa', { password }).then((res) => res.data),

  // Admin/Superadmin user management
  getAllUsers: (params) => api.get('/auth/users', { params }),
  getUser: (userId) => api.get(`/auth/users/${userId}`),
  createUser: (userData) => api.post('/auth/users', userData),
  updateUser: (userId, userData) => api.put(`/auth/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
  getStats: () => api.get('/auth/stats'),

  // Google Calendar integration
  getGoogleAuthUrl: () => api.get('/auth/google/auth').then((res) => res.data),
  getGoogleStatus: () => api.get('/auth/google/status').then((res) => res.data),
  disconnectGoogle: () => api.post('/auth/google/disconnect').then((res) => res.data),
};

export const cvAPI = {
  createBatch: (data) => api.post('/cv-intelligence', data),
  getBatches: (params) => api.get('/cv-intelligence/batches', { params }),
  getBatchDetails: (batchId) => api.get(`/cv-intelligence/batch/${batchId}`),
  deleteBatch: (batchId) => api.delete(`/cv-intelligence/batch/${batchId}`),
  getCandidates: (batchId) => api.get(`/cv-intelligence/batch/${batchId}/candidates`),
  processBatch: (batchId, jdFile, cvFiles, onProgress = null) => {
    const formData = new FormData();

    // Add JD file
    if (jdFile) {
      formData.append('jdFile', jdFile);
    }

    // Add CV files
    if (cvFiles && cvFiles.length > 0) {
      cvFiles.forEach((file) => {
        formData.append('cvFiles', file);
      });
    }

    return api.post(`/cv-intelligence/batch/${batchId}/process`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5 minutes
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
  exportBatch: (batchId, format = 'json') =>
    api.get(`/cv-intelligence/batch/${batchId}/export`, {
      params: { format },
    }),
};

export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: (params) => api.get('/notifications/unread-count', { params }),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getDashboardAnalytics: () => api.get('/analytics/dashboard'), // Alias for consistency
  getDetailedAnalytics: () => api.get('/analytics/detailed'),
  getUserAnalytics: (params) => api.get('/analytics/users', { params }),
  getAgentAnalytics: (params) => api.get('/analytics/agents', { params }),
  getCVAnalytics: (params) => api.get('/analytics/cv-intelligence', { params }),
  getSystemAnalytics: (params) => api.get('/analytics/system', { params }),
  exportAnalytics: (params) => api.get('/analytics/export', { params }),
};

export const systemAPI = {
  getHealth: () => api.get('/system/health'),
  getMetrics: () => api.get('/system/metrics'),
  getServices: () => api.get('/system/services'),
};

export const adminAPI = {
  seedDatabase: () => api.post('/admin/seed-database'),
};

// Feature flag for new ticketing system (Prisma + Next.js API routes)
const useNewTicketingSystem = () => {
  return process.env.NEXT_PUBLIC_USE_NEW_TICKETING === 'true';
};

// Create a client-side axios instance for Next.js API routes
const nextApi = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to Next.js API requests
nextApi.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token && !tokenManager.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const supportAPI = {
  createTicket: (ticketData) => {
    if (useNewTicketingSystem()) {
      return nextApi.post('/api/tickets', ticketData);
    }
    return api.post('/support', ticketData);
  },

  getMyTickets: (params) => {
    if (useNewTicketingSystem()) {
      return nextApi.get('/api/tickets', { params });
    }
    return api.get('/support/my-tickets', {
      params,
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
  },

  getAllTickets: (params) => {
    if (useNewTicketingSystem()) {
      // For new system, all tickets are fetched the same way (auth/role handled server-side)
      return nextApi.get('/api/tickets', { params });
    }
    return api.get('/support/admin/all', {
      params,
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
  },

  getTicket: (ticketId) => {
    if (useNewTicketingSystem()) {
      return nextApi.get(`/api/tickets/${ticketId}`);
    }
    return api.get(`/support/${ticketId}`, {
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
  },

  addComment: (ticketId, comment, isInternal = false) => {
    if (useNewTicketingSystem()) {
      return nextApi.post(`/api/tickets/${ticketId}/comments`, {
        comment,
        is_internal: isInternal,
      });
    }
    return api.post(`/support/${ticketId}/comments`, {
      comment,
      is_internal: isInternal,
    });
  },

  updateTicket: (ticketId, updateData) => {
    if (useNewTicketingSystem()) {
      return nextApi.patch(`/api/tickets/${ticketId}`, updateData);
    }
    return api.put(`/support/${ticketId}`, updateData);
  },

  updateTicketStatus: (ticketId, status) => {
    if (useNewTicketingSystem()) {
      return nextApi.patch(`/api/tickets/${ticketId}`, { status });
    }
    return api.put(`/support/${ticketId}`, { status });
  },

  deleteTicket: (ticketId) => {
    if (useNewTicketingSystem()) {
      return nextApi.delete(`/api/tickets/${ticketId}`);
    }
    return api.delete(`/support/${ticketId}`);
  },

  getStats: (timeframe = '30d') => {
    // Stats endpoint not implemented in new system yet - always use old backend
    return api.get('/support/admin/stats', {
      params: { timeframe },
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
  },

  // Debug - Check database connection type (old system only)
  checkDatabaseConnection: () => api.get('/support/debug/connection'),
};

export const healthAPI = {
  check: () =>
    axios.get('https://thesimpleai.vercel.app/health', {
      headers: {
        'Content-Type': 'application/json',
      },
    }),
};

// Error handling utility
export const handleAPIError = (error) => {
  if (error.response) {
    return error.response.data?.message || `Server error: ${error.response.status}`;
  } else if (error.request) {
    return 'Unable to connect to server. Please check your internet connection.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};

// Export both named and default for compatibility
export { api };
export default api;
