/**
 * Response Optimizer Utility
 * Sanitizes API responses, removes sensitive data, and reduces payload sizes
 */

class ResponseOptimizer {
  /**
   * Select specific fields from an object
   * @param {Object} obj - Source object
   * @param {Array<string>} fields - Fields to include
   * @returns {Object} Object with only selected fields
   */
  static selectFields(obj, fields) {
    if (!obj) {
      return null;
    }
    if (!fields || fields.length === 0) {
      return obj;
    }

    return fields.reduce((acc, field) => {
      if (obj[field] !== undefined) {
        acc[field] = obj[field];
      }
      return acc;
    }, {});
  }

  /**
   * Sanitize user object - remove sensitive fields
   * @param {Object} user - User object from database
   * @param {Array<string>} includeFields - Optional: specific fields to include
   * @returns {Object} Sanitized user object
   */
  static sanitizeUser(user, includeFields = []) {
    if (!user) {
      return null;
    }

    const safe = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department,
      job_title: user.job_title,
      is_active: user.is_active,
      created_at: user.created_at,
      last_login: user.last_login,
      // Add Outlook connection status without exposing tokens
      outlook_connected: !!(user.outlook_access_token || user.outlook_email),
      outlook_email: user.outlook_email || null,
    };

    // Never include these sensitive fields
    const blacklist = [
      'password_hash',
      'reset_token',
      'reset_token_expiry',
      'verification_token',
      'verification_expiry',
      'outlook_access_token',
      'outlook_refresh_token',
      'account_locked_until',
      'failed_login_attempts',
    ];

    // Remove any blacklisted fields that might have leaked through
    blacklist.forEach((field) => delete safe[field]);

    return includeFields.length > 0 ? this.selectFields(safe, includeFields) : safe;
  }

  /**
   * Sanitize ticket object
   * @param {Object} ticket - Ticket object from database
   * @returns {Object} Sanitized ticket object
   */
  static sanitizeTicket(ticket) {
    if (!ticket) {
      return null;
    }

    return {
      id: ticket.id,
      user_id: ticket.user_id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      assigned_to: ticket.assigned_to,
      resolution: ticket.resolution,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      resolved_at: ticket.resolved_at,
      // Include user info if present
      first_name: ticket.first_name,
      last_name: ticket.last_name,
      email: ticket.email,
      assigned_first_name: ticket.assigned_first_name,
      assigned_last_name: ticket.assigned_last_name,
      comment_count: ticket.comment_count,
    };
  }

  /**
   * Sanitize comment object
   * @param {Object} comment - Comment object from database
   * @returns {Object} Sanitized comment object
   */
  static sanitizeComment(comment) {
    if (!comment) {
      return null;
    }

    return {
      id: comment.id,
      ticket_id: comment.ticket_id,
      user_id: comment.user_id,
      comment: comment.comment,
      is_internal: comment.is_internal,
      created_at: comment.created_at,
      first_name: comment.first_name,
      last_name: comment.last_name,
      role: comment.role,
    };
  }

  /**
   * Sanitize array of objects
   * @param {Array} items - Array of objects
   * @param {Function} sanitizer - Sanitizer function to apply
   * @returns {Array} Sanitized array
   */
  static sanitizeArray(items, sanitizer) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => sanitizer(item)).filter((item) => item !== null);
  }

  /**
   * Create standardized success response
   * @param {Object} data - Response data
   * @param {string} message - Optional success message
   * @param {Object} meta - Optional metadata (pagination, etc.)
   * @returns {Object} Standardized response object
   */
  static success(data, message = null, meta = null) {
    const response = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }
    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  /**
   * Create standardized error response
   * @param {string} message - Error message
   * @param {Array} errors - Optional validation errors
   * @param {number} code - Optional error code
   * @returns {Object} Standardized error response object
   */
  static error(message, errors = null, code = null) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }
    if (code) {
      response.code = code;
    }

    return response;
  }

  /**
   * Remove null/undefined values from object
   * @param {Object} obj - Source object
   * @returns {Object} Clean object
   */
  static removeEmpty(obj) {
    if (!obj) {
      return obj;
    }

    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  /**
   * Paginate response helper
   * @param {Array} items - Items array
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items count
   * @returns {Object} Paginated response with meta
   */
  static paginate(items, page, limit, total) {
    return {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    };
  }
}

module.exports = ResponseOptimizer;
