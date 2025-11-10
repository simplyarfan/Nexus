import axios from 'axios';
import Cookies from 'js-cookie';

// Get API base URL (expected format: https://domain.com)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/cv-intelligence`,
  timeout: 600000, // 10 minutes for file processing (increased for multiple CVs)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests with better error handling
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    console.log('🔍 [CV-API] Token from cookies:', token ? 'present' : 'missing');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔍 [CV-API] Authorization header set successfully');
    } else {
      console.log('⚠️ [CV-API] No authentication token found');
    }

    // Add request tracking
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(7);
    console.log('🔍 [CV-API] Request:', config.method?.toUpperCase(), config.url);

    return config;
  },
  (error) => {
    console.error('❌ [CV-API] Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Handle response errors with improved messaging
api.interceptors.response.use(
  (response) => {
    console.log('✅ [CV-API] Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ [CV-API] Response error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    // Provide user-friendly error messages
    if (error.response?.status === 401) {
      console.error('❌ [CV-API] Authentication failed - redirecting to login');
    } else if (error.response?.status === 403) {
      console.error('❌ [CV-API] Access forbidden');
    } else if (error.response?.status >= 500) {
      console.error('❌ [CV-API] Server error - please try again later');
    }

    return Promise.reject(error);
  },
);

export const cvIntelligenceAPI = {
  // Create a new batch with enhanced validation
  createBatch: async (batchName) => {
    try {
      console.log('🎯 [CV-API] Creating CV batch:', batchName);

      // Validate input
      if (!batchName || typeof batchName !== 'string' || !batchName.trim()) {
        throw new Error('Batch name is required and must be a non-empty string');
      }

      const response = await api.post('/', { name: batchName.trim() });
      console.log('✅ [CV-API] Batch created successfully:', response.data.data?.batchId);
      return response;
    } catch (error) {
      console.error('❌ [CV-API] Create batch error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Process files for a batch with enhanced validation and progress tracking
  processFiles: async (batchId, jdFile, cvFiles, onProgress = null) => {
    try {
      console.log('📄 [CV-API] Processing files for batch:', batchId);
      console.log('📋 [CV-API] JD File:', jdFile?.name);
      console.log(
        '📄 [CV-API] CV Files:',
        cvFiles?.map((f) => f.name),
      );

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
            console.log('📈 [CV-API] Upload progress:', percentCompleted + '%');
            onProgress(percentCompleted);
          }
        },
      });

      console.log('✅ [CV-API] Files processed successfully');
      return response;
    } catch (error) {
      console.error('❌ [CV-API] Process files error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get all batches for the user
  getBatches: async () => {
    try {
      console.log('📊 Fetching user batches...');
      const response = await api.get('/batches');
      return response;
    } catch (error) {
      console.error('Get batches error:', error);
      throw error;
    }
  },

  // Get batch details (batch info + candidates)
  getBatchDetails: async (batchId) => {
    try {
      console.log('📋 Fetching batch details for:', batchId);
      const response = await api.get(`/batch/${batchId}`);
      return response;
    } catch (error) {
      console.error('Get batch details error:', error);
      throw error;
    }
  },

  // Get candidates for a specific batch
  getCandidates: async (batchId) => {
    try {
      console.log('👥 Fetching candidates for batch:', batchId);
      const response = await api.get(`/batch/${batchId}/candidates`);
      return response;
    } catch (error) {
      console.error('Get candidates error:', error);
      throw error;
    }
  },

  // Delete a batch
  deleteBatch: async (batchId) => {
    console.log('🗑️ [CV-API] Deleting batch:', batchId);

    try {
      const response = await api.delete(`/batch/${batchId}`);
      console.log('✅ [CV-API] Batch deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CV-API] Delete batch error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Schedule interview for a candidate
  scheduleInterview: async (candidateId, interviewData) => {
    console.log('📅 [CV-API] Scheduling interview for candidate:', candidateId);

    try {
      const response = await api.post(
        `/candidate/${candidateId}/schedule-interview`,
        interviewData,
      );
      console.log('✅ [CV-API] Interview scheduled successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CV-API] Schedule interview error:', error.response?.data || error.message);
      throw error;
    }
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
