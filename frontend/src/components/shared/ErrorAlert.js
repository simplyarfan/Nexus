import React from 'react';
import { AlertCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Reusable Error Alert Component
 * Displays consistent error messages across the application
 */

const ErrorAlert = ({
  type = 'error', // 'error', 'warning', 'info', 'success'
  title,
  message,
  details = null,
  onClose = null,
  className = '',
}) => {
  const types = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      titleColor: 'text-red-900',
      messageColor: 'text-red-800',
      closeColor: 'text-red-600 hover:text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      titleColor: 'text-yellow-900',
      messageColor: 'text-yellow-800',
      closeColor: 'text-yellow-600 hover:text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-600" />,
      titleColor: 'text-blue-900',
      messageColor: 'text-blue-800',
      closeColor: 'text-blue-600 hover:text-blue-800',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: <AlertCircle className="w-5 h-5 text-green-600" />,
      titleColor: 'text-green-900',
      messageColor: 'text-green-800',
      closeColor: 'text-green-600 hover:text-green-800',
    },
  };

  const style = types[type] || types.error;

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className={`text-sm font-semibold ${style.titleColor} mb-1`}>{title}</h3>}
          {message && <div className={`text-sm ${style.messageColor}`}>{message}</div>}
          {details && Array.isArray(details) && details.length > 0 && (
            <ul className={`mt-2 text-sm ${style.messageColor} list-disc list-inside space-y-1`}>
              {details.map((detail, index) => (
                <li key={index}>{detail.message || detail}</li>
              ))}
            </ul>
          )}
          {details && !Array.isArray(details) && (
            <div className={`mt-2 text-xs ${style.messageColor} opacity-75`}>{details}</div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ml-3 ${style.closeColor} transition-colors`}
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Error boundary fallback component
 */
export const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <ErrorAlert
          type="error"
          title="Something went wrong"
          message={error?.message || 'An unexpected error occurred'}
          details={process.env.NODE_ENV === 'development' ? error?.stack : null}
        />
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * API error parser
 * Converts API error responses to ErrorAlert props
 */
export const parseAPIError = (error) => {
  if (error.response) {
    // Server responded with error
    const data = error.response.data;
    return {
      type: 'error',
      title: data.error?.code || 'Request Failed',
      message: data.error?.message || data.message || 'An error occurred',
      details: data.error?.details || null,
    };
  } else if (error.request) {
    // Request made but no response
    return {
      type: 'error',
      title: 'Network Error',
      message: 'Unable to connect to server. Please check your internet connection.',
    };
  } else {
    // Something else happened
    return {
      type: 'error',
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
    };
  }
};

export default ErrorAlert;
