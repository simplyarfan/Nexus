/**
 * Optimized File Upload Middleware
 * Provides file validation, size limits, and streaming for efficient uploads
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  cv: 10 * 1024 * 1024, // 10MB for CVs
  image: 5 * 1024 * 1024, // 5MB for images
  document: 20 * 1024 * 1024, // 20MB for documents
  default: 10 * 1024 * 1024, // 10MB default
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  cv: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

/**
 * Generate unique filename
 */
const generateFilename = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension).replace(/[^a-zA-Z0-9]/g, '_');

  return `${basename}_${timestamp}_${randomString}${extension}`;
};

/**
 * File filter factory
 */
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  };
};

/**
 * Memory storage for cloud uploads (Vercel, etc.)
 */
const memoryStorage = multer.memoryStorage();

/**
 * Disk storage for local development
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, generateFilename(file.originalname));
  },
});

/**
 * Create upload middleware
 */
const createUploadMiddleware = (options = {}) => {
  const {
    fileType = 'default',
    maxFiles = 1,
    storage = process.env.VERCEL ? 'memory' : 'disk',
  } = options;

  const config = {
    storage: storage === 'memory' ? memoryStorage : diskStorage,
    limits: {
      fileSize: FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.default,
      files: maxFiles,
    },
    fileFilter: createFileFilter(ALLOWED_MIME_TYPES[fileType] || ALLOWED_MIME_TYPES.document),
  };

  return multer(config);
};

/**
 * CV upload middleware
 */
const cvUpload = createUploadMiddleware({ fileType: 'cv', maxFiles: 1 });

/**
 * Image upload middleware
 */
const imageUpload = createUploadMiddleware({ fileType: 'image', maxFiles: 5 });

/**
 * Document upload middleware
 */
const documentUpload = createUploadMiddleware({ fileType: 'document', maxFiles: 10 });

/**
 * Error handler for multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large',
        error: err.message,
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files',
        error: err.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed',
    });
  }

  next();
};

module.exports = {
  createUploadMiddleware,
  cvUpload,
  imageUpload,
  documentUpload,
  handleUploadError,
  generateFilename,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES,
};
