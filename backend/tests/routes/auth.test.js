const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const { generateTestToken, generateAdminToken } = require('../helpers/testUtils');

// Mock database
jest.mock('../../models/database', () => ({
  connect: jest.fn().mockResolvedValue(true),
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
  isConnected: true,
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com', role: 'user' }),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const database = require('../../models/database');
      database.get.mockResolvedValueOnce(null); // No existing user
      database.run.mockResolvedValueOnce({ lastID: 1 });

      const response = await request(app).post('/api/auth/register').send({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject registration with existing email', async () => {
      const database = require('../../models/database');
      database.get.mockResolvedValueOnce({ id: 1, email: 'existing@example.com' });

      const response = await request(app).post('/api/auth/register').send({
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject weak passwords', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const database = require('../../models/database');
      const bcrypt = require('bcryptjs');

      database.get.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        is_active: true,
        failed_login_attempts: 0,
      });

      bcrypt.compare.mockResolvedValueOnce(true);

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'correct_password',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should reject invalid credentials', async () => {
      const database = require('../../models/database');
      const bcrypt = require('bcryptjs');

      database.get.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        is_active: true,
      });

      bcrypt.compare.mockResolvedValueOnce(false);

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrong_password',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject login for inactive users', async () => {
      const database = require('../../models/database');

      database.get.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        role: 'user',
        is_active: false,
      });

      const response = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password',
      });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/auth/check', () => {
    it('should return user data with valid token', async () => {
      const database = require('../../models/database');
      const token = generateTestToken({ id: 1, email: 'test@example.com' });

      database.get.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
      });

      const response = await request(app)
        .get('/api/auth/check')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', 'test@example.com');
    });

    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/auth/check');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const database = require('../../models/database');
      const jwt = require('jsonwebtoken');

      jwt.verify.mockReturnValueOnce({ id: 1, email: 'test@example.com', type: 'refresh' });

      database.get.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        role: 'user',
        is_active: true,
      });

      const response = await request(app).post('/api/auth/refresh').send({
        refreshToken: 'valid_refresh_token',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const jwt = require('jsonwebtoken');

      jwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app).post('/api/auth/refresh').send({
        refreshToken: 'invalid_token',
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
