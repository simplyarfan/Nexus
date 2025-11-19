/**
 * Centralized Axios Configuration
 * Provides axios instance with default timeout and error handling
 */

const axios = require('axios');

// Create axios instance with default config
const axiosInstance = axios.create({
  timeout: 60000, // 60 seconds timeout for most requests (increased from 10s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (for logging, auth, etc.)
axiosInstance.interceptors.request.use(
  (config) => {
    // Add request timestamp for monitoring
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor (for logging, error handling)
axiosInstance.interceptors.response.use(
  (response) => {
    // Calculate request duration
    if (response.config.metadata) {
      response.config.metadata.endTime = Date.now();
      response.config.metadata.duration =
        response.config.metadata.endTime - response.config.metadata.startTime;
    }
    return response;
  },
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - server took too long to respond';
    }

    // Handle network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      error.message = 'Network error - could not reach server';
    }

    return Promise.reject(error);
  },
);

// Create instance for Microsoft Graph API (longer timeout for file uploads)
const graphAPIInstance = axios.create({
  timeout: 30000, // 30 seconds for Graph API (file uploads, calendar operations)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply same interceptors to Graph API instance
graphAPIInstance.interceptors.request.use(axiosInstance.interceptors.request.handlers[0].fulfilled);
graphAPIInstance.interceptors.response.use(
  axiosInstance.interceptors.response.handlers[0].fulfilled,
  axiosInstance.interceptors.response.handlers[0].rejected,
);

// Create dedicated instance for OpenAI API (very long timeout for AI processing)
const openAIInstance = axios.create({
  timeout: 300000, // 5 minutes for OpenAI API (multi-step CV processing can take 2-3 minutes)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply same interceptors to OpenAI instance
openAIInstance.interceptors.request.use(axiosInstance.interceptors.request.handlers[0].fulfilled);
openAIInstance.interceptors.response.use(
  axiosInstance.interceptors.response.handlers[0].fulfilled,
  axiosInstance.interceptors.response.handlers[0].rejected,
);

module.exports = {
  axios: axiosInstance,
  graphAPI: graphAPIInstance,
  openAI: openAIInstance,
  default: axiosInstance,
};
