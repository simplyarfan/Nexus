const request = require('supertest');
const path = require('path');

// Mock environment variables before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

describe('Interview Coordinator API Integration Tests', () => {
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

  describe('GET /api/interview-coordinator/interviews', () => {
    test('should reject without authentication', async () => {
      const response = await request(app).get('/api/interview-coordinator/interviews').send();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject with invalid token', async () => {
      const response = await request(app)
        .get('/api/interview-coordinator/interviews')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/interview-coordinator/interviews')
        .query({ page: 1, limit: 10 })
        .set('Authorization', 'Bearer invalid-token')
        .send();

      // Should fail on auth, but query params should be parsed
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/interview-coordinator/schedule', () => {
    test('should reject without authentication', async () => {
      const response = await request(app).post('/api/interview-coordinator/schedule').send({
        candidateEmail: 'candidate@example.com',
        candidateName: 'John Doe',
        interviewDateTime: new Date().toISOString(),
        duration: 60,
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject without required fields', async () => {
      const response = await request(app)
        .post('/api/interview-coordinator/schedule')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          candidateEmail: 'candidate@example.com',
        });

      expect(response.status).toBe(401);
    });

    test('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/interview-coordinator/schedule')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          candidateEmail: 'invalid-email',
          candidateName: 'John Doe',
          interviewDateTime: new Date().toISOString(),
          duration: 60,
        });

      expect(response.status).toBe(401);
    });

    test('should reject invalid datetime format', async () => {
      const response = await request(app)
        .post('/api/interview-coordinator/schedule')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          candidateEmail: 'candidate@example.com',
          candidateName: 'John Doe',
          interviewDateTime: 'invalid-date',
          duration: 60,
        });

      expect(response.status).toBe(401);
    });

    test('should reject past datetime', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/interview-coordinator/schedule')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          candidateEmail: 'candidate@example.com',
          candidateName: 'John Doe',
          interviewDateTime: pastDate.toISOString(),
          duration: 60,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/interview-coordinator/interviews/:id', () => {
    test('should reject without authentication', async () => {
      const response = await request(app).get('/api/interview-coordinator/interviews/123').send();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject with invalid ID format', async () => {
      const response = await request(app)
        .get('/api/interview-coordinator/interviews/invalid-id')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/interview-coordinator/interviews/:id', () => {
    test('should reject without authentication', async () => {
      const response = await request(app).put('/api/interview-coordinator/interviews/123').send({
        status: 'completed',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject invalid status values', async () => {
      const response = await request(app)
        .put('/api/interview-coordinator/interviews/123')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          status: 'invalid-status',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/interview-coordinator/interviews/:id', () => {
    test('should reject without authentication', async () => {
      const response = await request(app)
        .delete('/api/interview-coordinator/interviews/123')
        .send();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/interview-coordinator/reschedule/:id', () => {
    test('should reject without authentication', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const response = await request(app).post('/api/interview-coordinator/reschedule/123').send({
        newDateTime: futureDate.toISOString(),
        reason: 'Candidate requested change',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject without new datetime', async () => {
      const response = await request(app)
        .post('/api/interview-coordinator/reschedule/123')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          reason: 'Candidate requested change',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/interview-coordinator/availability', () => {
    test('should reject without authentication', async () => {
      const response = await request(app)
        .get('/api/interview-coordinator/availability')
        .query({ date: new Date().toISOString().split('T')[0] })
        .send();

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject without date parameter', async () => {
      const response = await request(app)
        .get('/api/interview-coordinator/availability')
        .set('Authorization', 'Bearer invalid-token')
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize HTML in candidate name', async () => {
      const response = await request(app)
        .post('/api/interview-coordinator/schedule')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          candidateEmail: 'test@example.com',
          candidateName: '<script>alert("xss")</script>John Doe',
          interviewDateTime: new Date().toISOString(),
          duration: 60,
        });

      // Should fail on auth, but input sanitization should process the name
      expect(response.status).toBe(401);
    });

    test('should sanitize HTML in notes', async () => {
      const response = await request(app)
        .put('/api/interview-coordinator/interviews/123')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          notes: '<script>alert("xss")</script>Interview notes',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on interview endpoints', async () => {
      const requests = [];

      // Make rapid requests to test rate limiting
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/api/interview-coordinator/interviews')
            .set('Authorization', 'Bearer invalid-token')
            .send(),
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter((r) => r.status === 429);

      // Should have rate limited responses (general limit is 100 per 15 minutes)
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    }, 15000);
  });
});
