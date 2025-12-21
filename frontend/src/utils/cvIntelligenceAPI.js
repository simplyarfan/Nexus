import { api } from './api';

export const cvIntelligenceAPI = {
  // Create a new batch with enhanced validation
  createBatch: async (batchName) => {
    // Validate input
    if (!batchName || typeof batchName !== 'string' || !batchName.trim()) {
      throw new Error('Batch name is required and must be a non-empty string');
    }

    const response = await api.post('/cv-intelligence', { name: batchName.trim() });

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

    const response = await api.post(`/cv-intelligence/batch/${batchId}/process`, formData, {
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
    const response = await api.get('/cv-intelligence/batches');
    return response;
  },

  // Get batch details (batch info + candidates)
  getBatchDetails: async (batchId) => {
    const response = await api.get(`/cv-intelligence/batch/${batchId}`);
    return response;
  },

  // Get candidates for a specific batch
  getCandidates: async (batchId) => {
    const response = await api.get(`/cv-intelligence/batch/${batchId}/candidates`);
    return response;
  },

  // Delete a batch
  deleteBatch: async (batchId) => {
    const response = await api.delete(`/cv-intelligence/batch/${batchId}`);

    return response.data;
  },

  // Schedule interview for a candidate
  scheduleInterview: async (candidateId, interviewData) => {
    const response = await api.post(`/cv-intelligence/candidate/${candidateId}/schedule-interview`, interviewData);

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
