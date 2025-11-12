/**
 * Standardized Error Messages and App Constants
 */

export const ERROR_MESSAGES = {
  // Network Errors
  NETWORK_ERROR: 'Unable to connect to server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  SERVER_ERROR: 'An unexpected server error occurred. Please try again later.',

  // Authentication Errors
  AUTH_REQUIRED: 'Please log in to continue.',
  AUTH_EXPIRED: 'Your session has expired. Please log in again.',
  AUTH_INVALID: 'Invalid credentials. Please try again.',
  AUTH_LOCKED: 'Account temporarily locked due to failed login attempts.',

  // Validation Errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 8 characters long.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_FORMAT: 'Invalid format. Please check your input.',

  // Permission Errors
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions. Please contact an administrator.',

  // Resource Errors
  NOT_FOUND: 'The requested resource was not found.',
  ALREADY_EXISTS: 'This resource already exists.',

  // File Upload Errors
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid file.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',

  // 2FA Errors
  INVALID_2FA_CODE: 'Invalid verification code. Please try again.',
  EXPIRED_2FA_CODE: 'Verification code has expired. Please request a new one.',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please try again later.',

  // Generic Error
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};

export const SUCCESS_MESSAGES = {
  // Authentication
  LOGIN_SUCCESS: 'Welcome back!',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
  REGISTER_SUCCESS: 'Account created successfully!',
  PASSWORD_CHANGED: 'Password changed successfully.',
  PASSWORD_RESET: 'Password reset email sent. Please check your inbox.',

  // 2FA
  CODE_SENT: 'Verification code sent to your email.',
  CODE_VERIFIED: 'Verification successful!',
  TWO_FA_ENABLED: 'Two-factor authentication enabled.',
  TWO_FA_DISABLED: 'Two-factor authentication disabled.',

  // Profile
  PROFILE_UPDATED: 'Profile updated successfully.',
  EMAIL_VERIFIED: 'Email verified successfully.',

  // Outlook
  OUTLOOK_CONNECTED: 'Outlook connected successfully!',
  OUTLOOK_DISCONNECTED: 'Outlook disconnected.',

  // CRUD Operations
  CREATED_SUCCESS: 'Created successfully.',
  UPDATED_SUCCESS: 'Updated successfully.',
  DELETED_SUCCESS: 'Deleted successfully.',

  // Generic
  OPERATION_SUCCESS: 'Operation completed successfully.',
};

export const INFO_MESSAGES = {
  LOADING: 'Loading...',
  SAVING: 'Saving...',
  PROCESSING: 'Processing...',
  UPLOADING: 'Uploading...',
  SENDING: 'Sending...',
  VERIFYING: 'Verifying...',
  PLEASE_WAIT: 'Please wait...',
};

export const APP_CONFIG = {
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Enterprise AI Hub',
  COMPANY_DOMAIN: process.env.NEXT_PUBLIC_COMPANY_DOMAIN,
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  OTP_LENGTH: 6,
  OTP_EXPIRY: 10 * 60 * 1000, // 10 minutes
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_2FA: '/auth/verify-2fa',
  PROFILE: '/profile',
  DASHBOARD: '/dashboard',
  ADMIN: '/admin',
  SUPERADMIN: '/superadmin',
  SUPPORT: '/support',
  CV_INTELLIGENCE: '/cv-intelligence',
  INTERVIEW_COORDINATOR: '/interview-coordinator',
};

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^.{8,}$/,
  PHONE: /^\+?[\d\s-()]+$/,
  URL: /^https?:\/\/.+/,
  ALPHA_NUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
};

export default {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  INFO_MESSAGES,
  APP_CONFIG,
  ROUTES,
  REGEX,
};
