const {
  register,
  login,
  logout,
  verifyEmail,
  verify2FA,
  refreshToken,
  checkAuth,
  requestPasswordReset,
  resetPassword,
} = require('../../controllers/AuthController');
const database = require('../../models/database');
const emailService = require('../../services/email.service');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../../models/database');
jest.mock('../../services/email.service');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      user: null,
      ip: '127.0.0.1',
      get: jest.fn(() => 'Test User Agent'),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
        jobTitle: 'Developer',
      };
    });

    test('should register new user successfully', async () => {
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(null); // No existing user
      bcrypt.hash.mockResolvedValue('hashed_password');
      database.run.mockResolvedValue({
        rows: [
          { id: 1, email: 'test@example.com', first_name: 'John', last_name: 'Doe', role: 'user' },
        ],
      });
      emailService.send2FACode.mockResolvedValue();

      await register(req, res);

      expect(database.connect).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 12);
      expect(emailService.send2FACode).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          requiresVerification: true,
        }),
      );
    });

    test('should fail with missing required fields', async () => {
      req.body = { email: 'test@example.com' }; // Missing password, firstName, lastName

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        }),
      );
    });

    test('should handle existing verified user', async () => {
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue({ id: 1, is_verified: true });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already exists'),
        }),
      );
    });

    test('should resend verification for unverified user', async () => {
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue({ id: 1, is_verified: false });
      database.run.mockResolvedValue();
      emailService.send2FACode.mockResolvedValue();

      await register(req, res);

      expect(database.run).toHaveBeenCalled(); // Update verification token
      expect(emailService.send2FACode).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should handle email service failure', async () => {
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashed_password');
      database.run.mockResolvedValue({
        rows: [{ id: 1, email: 'test@example.com' }],
      });
      emailService.send2FACode.mockRejectedValue(new Error('Email service unavailable'));

      await register(req, res);

      expect(database.run).toHaveBeenCalledTimes(2); // Insert then delete
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        rememberMe: false,
      };
    });

    test('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_active: true,
        is_verified: true,
        failed_login_attempts: 0,
        two_factor_enabled: false,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock_jwt_token');
      database.run.mockResolvedValue();

      await login(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith('SecurePass123!', 'hashed_password');
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: 'mock_jwt_token',
          user: expect.objectContaining({
            email: 'test@example.com',
          }),
        }),
      );
    });

    test('should fail with invalid email', async () => {
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(null); // User not found

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid email or password',
        }),
      );
    });

    test('should fail with incorrect password', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        is_active: true,
        is_verified: true,
        failed_login_attempts: 0,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false); // Wrong password
      database.run.mockResolvedValue();

      await login(req, res);

      expect(database.run).toHaveBeenCalled(); // Increment failed attempts
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should require email verification', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        is_active: true,
        is_verified: false, // Not verified
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          requiresVerification: true,
        }),
      );
    });

    test('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        is_active: true,
        is_verified: true,
        failed_login_attempts: 4, // 4 previous failed attempts
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      database.run.mockResolvedValue();

      await login(req, res);

      expect(database.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          5, // 5 failed attempts
          expect.any(Date), // Lock until date
          1,
        ]),
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('locked'),
        }),
      );
    });

    test('should require 2FA when enabled', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        is_active: true,
        is_verified: true,
        two_factor_enabled: true,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      database.run.mockResolvedValue();
      emailService.send2FACode.mockResolvedValue();

      await login(req, res);

      expect(emailService.send2FACode).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          requires2FA: true,
        }),
      );
    });

    test('should fail with missing credentials', async () => {
      req.body = {}; // No email or password

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        }),
      );
    });
  });

  describe('logout', () => {
    test('should logout successfully', async () => {
      req.headers.authorization = 'Bearer mock_token';
      database.connect.mockResolvedValue();
      database.run.mockResolvedValue();

      await logout(req, res);

      expect(database.run).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Logout successful',
        }),
      );
    });

    test('should handle logout without token', async () => {
      req.headers.authorization = null;

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      req.body = {
        userId: 1,
        code: '123456',
      };
    });

    test('should verify email successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        verification_token: require('crypto').createHash('sha256').update('123456').digest('hex'),
        verification_expiry: new Date(Date.now() + 10 * 60 * 1000), // 10 min from now
        is_verified: false,
        failed_login_attempts: 0,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      database.run.mockResolvedValue();
      jwt.sign.mockReturnValue('mock_jwt_token');

      await verifyEmail(req, res);

      expect(database.run).toHaveBeenCalled(); // Mark as verified
      expect(jwt.sign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('verified'),
          token: 'mock_jwt_token',
        }),
      );
    });

    test('should fail with invalid code', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        verification_token: 'different_hash',
        verification_expiry: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false,
        failed_login_attempts: 0,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      database.run.mockResolvedValue();

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid'),
        }),
      );
    });

    test('should fail with expired code', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        verification_token: 'some_hash',
        verification_expiry: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago (expired)
        is_verified: false,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('expired'),
        }),
      );
    });

    test('should handle already verified user', async () => {
      const mockUser = {
        id: 1,
        is_verified: true,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('already verified'),
        }),
      );
    });

    test('should lock after max verification attempts', async () => {
      const mockUser = {
        id: 1,
        verification_token: 'wrong_hash',
        verification_expiry: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false,
        failed_login_attempts: 5, // Max attempts
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      database.run.mockResolvedValue();

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Too many'),
        }),
      );
    });
  });

  describe('checkAuth', () => {
    test('should return user data for authenticated user', async () => {
      req.user = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
      };

      const mockUser = {
        ...req.user,
        is_active: true,
        outlook_email: null,
        outlook_access_token: null,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);

      await checkAuth(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            email: 'test@example.com',
            name: 'John Doe',
          }),
        }),
      );
    });

    test('should fail for unauthenticated user', async () => {
      req.user = null;

      await checkAuth(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Not authenticated',
        }),
      );
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      req.body = {
        refreshToken: 'mock_refresh_token',
      };
    });

    test('should refresh tokens successfully', async () => {
      const mockSession = {
        id: 1,
        user_id: 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
      };

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get
        .mockResolvedValueOnce(mockSession) // First call for session
        .mockResolvedValueOnce(mockUser); // Second call for user
      jwt.sign.mockReturnValue('new_access_token');
      database.run.mockResolvedValue();

      await refreshToken(req, res);

      expect(jwt.verify).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(database.run).toHaveBeenCalled(); // Update session
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            accessToken: 'new_access_token',
          }),
        }),
      );
    });

    test('should fail with missing refresh token', async () => {
      req.body = {};

      await refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        }),
      );
    });

    test('should fail with expired session', async () => {
      const mockSession = {
        id: 1,
        user_id: 1,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago (expired)
      };

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockSession);
      database.run.mockResolvedValue();

      await refreshToken(req, res);

      expect(database.run).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        expect.anything(),
      );
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('expired'),
        }),
      );
    });

    test('should fail with revoked token', async () => {
      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(null); // No session found

      await refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('revoked'),
        }),
      );
    });
  });

  describe('requestPasswordReset', () => {
    beforeEach(() => {
      req.body = {
        email: 'test@example.com',
      };
    });

    test('should send password reset email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        is_active: true,
      };

      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);
      bcrypt.hash.mockResolvedValue('hashed_token');
      database.run.mockResolvedValue();
      emailService.sendPasswordReset.mockResolvedValue();

      await requestPasswordReset(req, res);

      expect(database.run).toHaveBeenCalled(); // Store reset token
      expect(emailService.sendPasswordReset).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        }),
      );
    });

    test('should not reveal if user does not exist (security)', async () => {
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(null); // User not found

      await requestPasswordReset(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true, // Still returns success to prevent email enumeration
          message: expect.stringContaining('If an account exists'),
        }),
      );
    });

    test('should fail with missing email', async () => {
      req.body = {};

      await requestPasswordReset(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        }),
      );
    });
  });

  describe('resetPassword', () => {
    beforeEach(() => {
      req.body = {
        token: 'reset_token_123',
        newPassword: 'NewSecurePass123!',
      };
    });

    test('should reset password with valid token', async () => {
      const mockUsers = [
        {
          id: 1,
          email: 'test@example.com',
          reset_token: 'hashed_token',
          reset_token_expiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      ];

      database.connect.mockResolvedValue();
      database.all.mockResolvedValue(mockUsers);
      bcrypt.compare.mockResolvedValue(true); // Token matches
      bcrypt.hash.mockResolvedValue('new_hashed_password');
      database.run.mockResolvedValue();

      await resetPassword(req, res);

      expect(database.run).toHaveBeenCalledTimes(2); // Update password and delete sessions
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('successful'),
        }),
      );
    });

    test('should fail with invalid token', async () => {
      database.connect.mockResolvedValue();
      database.all.mockResolvedValue([]);

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid or expired'),
        }),
      );
    });

    test('should fail with weak password', async () => {
      req.body.newPassword = 'weak';

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('at least 8 characters'),
        }),
      );
    });

    test('should fail with missing fields', async () => {
      req.body = { token: 'token123' }; // Missing newPassword

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        }),
      );
    });
  });
});
