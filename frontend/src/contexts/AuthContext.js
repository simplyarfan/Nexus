import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { tokenManager } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Get the API base URL (expected format: https://domain.com)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // Development logging helper
  const isDev = process.env.NODE_ENV === 'development';
  const log = (message, data) => {
    if (isDev) console.log(message, data);
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = tokenManager.getAccessToken();

    if (!token) {
      return null;
    }

    // Don't check expiration here - let the interceptor handle it
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Memoize checkAuthStatus to prevent recreation on every render
  const checkAuthStatus = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      log('🔐 Token exists, verifying with server...');

      const headers = getAuthHeaders();
      if (!headers) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/check`, {
        method: 'GET',
        headers: headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
          log('✅ User verified:', data.user);
        } else {
          // Invalid token, clear it
          tokenManager.clearTokens();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // Token invalid, clear it
        tokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
      log('✅ Auth check successful');
    } catch (error) {
      if (isDev) console.error('❌ Auth check failed:', error);
      tokenManager.clearTokens();
    } finally {
      setLoading(false);
    }
  }, [API_BASE, isDev]); // Dependencies for useCallback

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const register = useCallback(
    async (userData) => {
      try {
        setLoading(true);
        log('📝 Starting registration...', { email: userData.email });

        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(userData),
        });

        log('📝 Registration response status:', response.status);
        const data = await response.json();
        log('📝 Registration response data:', data);

        // CRITICAL: Check response.ok first - don't trust data.success if HTTP status failed
        if (!response.ok) {
          // Backend returned an error (4xx or 5xx)
          const errorMessage = data.message || data.error || 'Registration failed';
          console.error('❌ [REGISTER] Backend error:', errorMessage);
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        // Only trust data.success if response.ok is true
        if (data.success) {
          // Check if email verification is required
          if (data.requiresVerification) {
            toast.success(data.message || 'Registration successful! Please verify your email.');
            return {
              success: true,
              requiresVerification: true,
              userId: data.userId,
              message: data.message,
            };
          }

          // Store tokens and auto-login (handle both response formats)
          const accessToken = data.data?.accessToken || data.token || data.accessToken;
          const refreshToken = data.data?.refreshToken || data.refreshToken;
          const userData = data.data?.user || data.user;

          if (accessToken && userData) {
            tokenManager.setTokens(accessToken, refreshToken);
            setUser(userData);
            setIsAuthenticated(true);
            toast.success(data.message || 'Registration successful! You are now logged in.');
            return {
              success: true,
              message: data.message,
              user: userData,
              autoLogin: true,
            };
          } else {
            toast.success(data.message || 'Registration successful!');
          }

          return {
            success: true,
            message: data.message,
          };
        }

        // Fallback: data.success was false or missing
        throw new Error(data.message || 'Registration failed');
      } catch (err) {
        console.error('❌ Registration error:', err);
        const errorMessage = err.message || 'Registration failed';
        // Don't show duplicate toast - already shown above
        if (!err.message || err.message === 'Registration failed') {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE],
  );

  const login = useCallback(
    async (credentials) => {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        // Handle unverified user (403 status)
        if (response.status === 403 && data.requiresVerification) {
          // DON'T show toast here - login page will handle redirect
          return {
            success: false,
            requiresVerification: true,
            userId: data.userId,
            message: data.message,
          };
        }

        if (!response.ok) {
          throw new Error(data.message || 'Login failed');
        }

        // Check if email verification is required (before checking success)
        if (data.requiresVerification) {
          // DON'T show toast here - login page will handle redirect
          return {
            success: false,
            requiresVerification: true,
            userId: data.userId,
            message: data.message,
          };
        }

        if (data.success) {
          // Check if 2FA is required
          if (data.requires2FA) {
            return {
              success: true,
              requires2FA: true,
              userId: data.userId,
              message: data.message,
            };
          }

          // Store tokens from backend (backend sends token and refreshToken at top level)
          const accessToken = data.token || data.accessToken;
          const refreshToken = data.refreshToken;
          if (accessToken) {
            tokenManager.setTokens(accessToken, refreshToken);
          }

          // Update state with user data
          const userData = data.user;
          if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            toast.success('Login successful!');
            return { success: true, user: userData };
          }
        }

        throw new Error(data.message || 'Authentication failed');
      } catch (error) {
        console.error('❌ Login error:', error);

        // Check if this is a verification error (don't show error toast, just return result)
        if (error.response?.data?.requiresVerification) {
          return {
            success: false,
            requiresVerification: true,
            userId: error.response.data.userId,
            message: error.response.data.message,
          };
        }

        const errorMessage = error.message || 'Login failed';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE],
  );

  const verifyEmail = useCallback(
    async (token) => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Email verified successfully!');
          return { success: true };
        } else {
          throw new Error(data.message || 'Email verification failed');
        }
      } catch (error) {
        console.error('❌ Email verification error:', error);
        const errorMessage = error.message || 'Email verification failed';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [API_BASE],
  );

  const resendVerification = useCallback(
    async (email) => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/resend-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Verification email sent!');
          return { success: true };
        } else {
          throw new Error(data.message || 'Failed to resend verification email');
        }
      } catch (error) {
        console.error('❌ Resend verification error:', error);
        const errorMessage = error.message || 'Failed to resend verification email';
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [API_BASE],
  );

  const logout = useCallback(
    async (logoutAll = false) => {
      try {
        const token = tokenManager.getAccessToken();
        const endpoint = logoutAll ? '/auth/logout-all' : '/auth/logout';

        await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        toast.success(logoutAll ? 'Logged out from all devices' : 'Logged out successfully');
      } catch (error) {
        console.error('❌ Logout error:', error);
      } finally {
        // Clear tokens and state regardless of API call success
        tokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    },
    [API_BASE],
  );

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      verifyEmail,
      resendVerification,
      checkAuthStatus,
      updateUser,
      getAuthHeaders,
    }),
    [
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout,
      verifyEmail,
      resendVerification,
      checkAuthStatus,
      updateUser,
      getAuthHeaders,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
