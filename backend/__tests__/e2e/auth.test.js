const request = require('supertest');
const path = require('path');

// Mock environment variables before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('Authentication API Integration Tests', () => {
  let app;
  let server;

  beforeAll(() => {
    // Import app after environment variables are set
    const serverPath = path.join(__dirname, '../../server.js');
    delete require.cache[require.resolve(serverPath)];
    app = require(serverPath);
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('POST /api/auth/register', () => {
    test('should reject registration without required fields', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject registration with invalid email format', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'Test123!@#',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject weak passwords', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should reject login without credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject login with invalid email format', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'invalid-email',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 for non-existent user', async () => {
      const response = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'Test123!@#',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('should reject refresh without token', async () => {
      const response = await request(app).post('/api/auth/refresh-token').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Refresh token');
    });

    test('should reject invalid refresh token format', async () => {
      const response = await request(app).post('/api/auth/refresh-token').send({
        refreshToken: 'invalid-token',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('should reject logout without authentication', async () => {
      const response = await request(app).post('/api/auth/logout').send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    test('should reject without email', async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid email format', async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({
        email: 'invalid-email',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should handle non-existent email gracefully', async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({
        email: 'nonexistent@example.com',
      });

      // Should return 200 for security (don't reveal if email exists)
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/auth/verify-email', () => {
    test('should reject without token', async () => {
      const response = await request(app).get('/api/auth/verify-email');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/verify-email')
        .query({ token: 'invalid-token' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on login endpoint', async () => {
      const requests = [];

      // Make 10 rapid requests (limit is 5 per 15 minutes for auth endpoints)
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            password: 'Test123!@#',
          }),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter((r) => r.status === 429);

      // Should have at least some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in responses', async () => {
      const response = await request(app).get('/api/health').send();

      // Check for important security headers
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });
});
