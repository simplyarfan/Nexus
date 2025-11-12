const sanitizeHtml = require('sanitize-html');

/**
 * HTML Sanitization Utility
 * Protects against XSS attacks by sanitizing user input
 */

/**
 * Strict sanitization - allows NO HTML tags
 * Use for: names, email subjects, titles, etc.
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized string with no HTML
 */
function sanitizeStrict(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }

  return sanitizeHtml(input, {
    allowedTags: [], // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    disallowedTagsMode: 'discard',
    textFilter: (text) => {
      // Remove any remaining HTML entities
      return text.replace(/[<>]/g, '');
    },
  }).trim();
}

/**
 * Basic sanitization - allows safe formatting tags only
 * Use for: messages, descriptions, notes, comments
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized HTML with safe formatting
 */
function sanitizeBasic(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }

  return sanitizeHtml(input, {
    // Allow only safe formatting tags
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'ul', 'ol', 'li'],
    allowedAttributes: {}, // No attributes on any tags
    disallowedTagsMode: 'discard',
    allowedSchemes: [], // No links
  }).trim();
}

/**
 * Rich sanitization - allows more HTML for rich text content
 * Use for: ticket descriptions, rich text editors
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized HTML with rich formatting
 */
function sanitizeRich(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }

  return sanitizeHtml(input, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'b',
      'i',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
    ],
    allowedAttributes: {
      // Only allow safe attributes
      p: ['style'],
      code: ['class'],
      pre: ['class'],
    },
    allowedStyles: {
      // Only allow safe CSS properties
      '*': {
        color: [/^#[0-9a-f]{3,6}$/i], // Hex colors only
        'text-align': [/^(left|right|center|justify)$/],
      },
    },
    allowedSchemes: [], // No links for security
    disallowedTagsMode: 'discard',
  }).trim();
}

/**
 * Sanitize an object's string properties recursively
 * @param {Object} obj - Object to sanitize
 * @param {Function} sanitizer - Sanitization function to use (default: sanitizeStrict)
 * @returns {Object} Sanitized object
 */
function sanitizeObject(obj, sanitizer = sanitizeStrict) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sanitizer));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizer(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value, sanitizer);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Middleware to sanitize request body
 * @param {Function} sanitizer - Sanitization function to use
 * @returns {Function} Express middleware
 */
function sanitizeMiddleware(sanitizer = sanitizeStrict) {
  return (req, res, next) => {
    if (req.body) {
      req.body = sanitizeObject(req.body, sanitizer);
    }
    next();
  };
}

/**
 * Sanitize specific fields in request body
 * @param {Array<string>} fields - Field names to sanitize
 * @param {Function} sanitizer - Sanitization function to use
 * @returns {Function} Express middleware
 */
function sanitizeFields(fields = [], sanitizer = sanitizeStrict) {
  return (req, res, next) => {
    if (req.body) {
      for (const field of fields) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizer(req.body[field]);
        }
      }
    }
    next();
  };
}

module.exports = {
  sanitizeStrict,
  sanitizeBasic,
  sanitizeRich,
  sanitizeObject,
  sanitizeMiddleware,
  sanitizeFields,
};
