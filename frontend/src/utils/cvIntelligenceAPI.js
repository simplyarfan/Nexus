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
  baseURL: `${API_BASE_URL}/api/cv-intelligence`,
  timeout: 600000, // 10 minutes for file processing (increased for multiple CVs)
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

export const cvIntelligenceAPI = {
  // Create a new batch with enhanced validation
  createBatch: async (batchName) => {
    // Validate input
    if (!batchName || typeof batchName !== 'string' || !batchName.trim()) {
      throw new Error('Batch name is required and must be a non-empty string');
    }

    const response = await api.post('/', { name: batchName.trim() });

    return response;
  },

  // Process files for a batch with enhanced validation and progress tracking
  processFiles: async (batchId, jdFile, cvFiles, onProgress = null) => {
    // Enhanced validation
    if (!batchId || typeof batchId !== 'string') {
      throw new Error('Valid batch ID is required');
    }

    if (!jdFile || !(jdFile instanceof File)) {
      throw new Error('Job Description file is required and must be a valid file');
    }

    if (!cvFiles || !Array.isArray(cvFiles) || cvFiles.length === 0) {
      throw new Error('At least one CV file is required');
    }

    if (cvFiles.length > 10) {
      throw new Error('Maximum 10 CV files allowed');
    }

    // Validate file types and sizes
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(jdFile.type)) {
      throw new Error('Job Description must be PDF, TXT, DOC, or DOCX format');
    }

    if (jdFile.size > maxSize) {
      throw new Error('Job Description file is too large (max 10MB)');
    }

    for (let i = 0; i < cvFiles.length; i++) {
      const file = cvFiles[i];
      if (!(file instanceof File)) {
        throw new Error(`CV file ${i + 1} is not a valid file`);
      }
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`CV file "${file.name}" must be PDF, TXT, DOC, or DOCX format`);
      }
      if (file.size > maxSize) {
        throw new Error(`CV file "${file.name}" is too large (max 10MB)`);
      }
    }

    const formData = new FormData();

    // Add JD file
    formData.append('jdFile', jdFile);

    // Add CV files
    cvFiles.forEach((file) => {
      formData.append('cvFiles', file);
    });

    const response = await api.post(`/batch/${batchId}/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes (increased for multiple CVs with AI processing)
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);

          onProgress(percentCompleted);
        }
      },
    });

    return response;
  },

  // Get all batches for the user
  getBatches: async () => {
    const response = await api.get('/batches');
    return response;
  },

  // Get batch details (batch info + candidates)
  getBatchDetails: async (batchId) => {
    const response = await api.get(`/batch/${batchId}`);
    return response;
  },

  // Get candidates for a specific batch
  getCandidates: async (batchId) => {
    const response = await api.get(`/batch/${batchId}/candidates`);
    return response;
  },

  // Delete a batch
  deleteBatch: async (batchId) => {
    const response = await api.delete(`/batch/${batchId}`);

    return response.data;
  },

  // Schedule interview for a candidate
  scheduleInterview: async (candidateId, interviewData) => {
    const response = await api.post(`/candidate/${candidateId}/schedule-interview`, interviewData);

    return response.data;
  },

  // Utility function to validate files
  validateFiles: (jdFile, cvFiles) => {
    const errors = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    // Validate JD file
    if (!jdFile) {
      errors.push('Job Description file is required');
    } else {
      if (jdFile.size > maxFileSize) {
        errors.push('Job Description file is too large (max 10MB)');
      }
      if (!allowedTypes.includes(jdFile.type)) {
        errors.push('Job Description must be PDF, TXT, DOC, or DOCX');
      }
    }

    // Validate CV files
    if (!cvFiles || cvFiles.length === 0) {
      errors.push('At least one CV file is required');
    } else if (cvFiles.length > 10) {
      errors.push('Maximum 10 CV files allowed');
    } else {
      cvFiles.forEach((file, index) => {
        if (file.size > maxFileSize) {
          errors.push(`CV file ${index + 1} is too large (max 10MB)`);
        }
        if (!allowedTypes.includes(file.type)) {
          errors.push(`CV file ${index + 1} must be PDF, TXT, DOC, or DOCX`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file type icon
  getFileIcon: (fileType) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📄';
  },
};

export default cvIntelligenceAPI;
