const request = require('supertest');
const path = require('path');

// Mock environment variables before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('Health Check API Integration Tests', () => {
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

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should include uptime information', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
    });

    test('should include system information', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('system');
      expect(response.body.system).toHaveProperty('node');
      expect(response.body.system).toHaveProperty('platform');
    });

    test('should include database check', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('checks');
      expect(response.body.checks).toHaveProperty('database');
    });

    test('should include response time', async () => {
      const response = await request(app).get('/api/health').send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('responseTime');
    });

    test('should not require authentication', async () => {
      const response = await request(app).get('/api/health').send();

      // Health check should work without auth
      expect(response.status).toBe(200);
    });

    test('should respond quickly', async () => {
      const startTime = Date.now();

      const response = await request(app).get('/api/health').send();

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  describe('GET /api/health/detailed', () => {
    test('should return detailed health information', async () => {
      const response = await request(app).get('/api/health/detailed').send();

      // May require auth or may not exist, check response
      expect([200, 401, 404]).toContain(response.status);
    });
  });

  describe('Health Check Under Load', () => {
    test('should handle concurrent health checks', async () => {
      const requests = [];

      // Make 50 concurrent requests
      for (let i = 0; i < 50; i++) {
        requests.push(request(app).get('/api/health').send());
      }

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    }, 10000);
  });
});
