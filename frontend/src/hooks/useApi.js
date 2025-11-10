/**
 * useApi Hook
 * Generic API hook with loading, error, and data states
 */

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://thesimpleai.vercel.app';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  /**
   * Make an API request
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint (e.g., '/api/tickets')
   * @param {object} data - Request body data (optional)
   * @param {object} config - Additional axios config (optional)
   * @returns {Promise} Response data
   */
  const request = useCallback(
    async (method, endpoint, data = null, config = {}) => {
      setLoading(true);
      setError(null);

      try {
        const headers = {
          'Content-Type': 'application/json',
          ...config.headers,
        };

        // Add auth token if available
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await axios({
          method,
          url: `${API_URL}${endpoint}`,
          data,
          headers,
          ...config,
        });

        setLoading(false);
        return response.data;
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';

        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [token],
  );

  // Convenience methods
  const get = useCallback((endpoint, config) => request('GET', endpoint, null, config), [request]);

  const post = useCallback(
    (endpoint, data, config) => request('POST', endpoint, data, config),
    [request],
  );

  const put = useCallback(
    (endpoint, data, config) => request('PUT', endpoint, data, config),
    [request],
  );

  const del = useCallback(
    (endpoint, config) => request('DELETE', endpoint, null, config),
    [request],
  );

  return {
    loading,
    error,
    request,
    get,
    post,
    put,
    delete: del,
  };
}

export default useApi;
