const jwt = require('jsonwebtoken');

/**
 * Generate a test JWT token
 */
function generateTestToken(payload = { id: 1, email: 'test@example.com', role: 'user' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Generate a test admin token
 */
function generateAdminToken(payload = { id: 1, email: 'admin@example.com', role: 'admin' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Generate a test superadmin token
 */
function generateSuperAdminToken(
  payload = {
    id: 1,
    email: 'superadmin@example.com',
    role: 'superadmin',
  },
) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

/**
 * Mock database client for testing
 */
class MockDatabaseClient {
  constructor() {
    this.queries = [];
  }

  async query(sql, params = []) {
    this.queries.push({ sql, params });
    return { rows: [], rowCount: 0 };
  }

  reset() {
    this.queries = [];
  }

  getLastQuery() {
    return this.queries[this.queries.length - 1];
  }
}

/**
 * Mock file buffer for testing
 */
function createMockFileBuffer(size = 1024) {
  return Buffer.alloc(size);
}

/**
 * Create mock CV file
 */
function createMockCVFile(filename = 'test-cv.pdf') {
  return {
    fieldname: 'cvFiles',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: createMockFileBuffer(),
    size: 1024,
  };
}

/**
 * Create mock JD file
 */
function createMockJDFile(filename = 'test-jd.pdf') {
  return {
    fieldname: 'jdFile',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'application/pdf',
    buffer: createMockFileBuffer(),
    size: 512,
  };
}

module.exports = {
  generateTestToken,
  generateAdminToken,
  generateSuperAdminToken,
  MockDatabaseClient,
  createMockFileBuffer,
  createMockCVFile,
  createMockJDFile,
};
