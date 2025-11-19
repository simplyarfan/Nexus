const jwt = require('jsonwebtoken');
const database = require('../../../models/database');
const cryptoUtil = require('../../../utils/crypto');
const { authenticateToken } = require('../../../middleware/auth');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../../models/database');
jest.mock('../../../utils/crypto');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/test',
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();

    // Mock console methods to suppress logs during tests
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('authenticateToken', () => {
    test('should authenticate valid token with active session', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        is_active: true,
        department: 'Engineering',
        job_title: 'Developer',
      };

      const mockSession = {
        id: 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      };

      req.headers.authorization = 'Bearer valid_token_123';
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get
        .mockResolvedValueOnce(mockUser) // First call for user
        .mockResolvedValueOnce(mockSession); // Second call for session
      cryptoUtil.hash.mockReturnValue('hashed_token');

      await authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token_123', 'test_secret');
      expect(database.get).toHaveBeenCalledTimes(2);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject request without token', async () => {
      req.headers.authorization = null;

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('token required'),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid JWT token', async () => {
      req.headers.authorization = 'Bearer invalid_token';
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Invalid or expired'),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired JWT token', async () => {
      req.headers.authorization = 'Bearer expired_token';
      process.env.JWT_SECRET = 'test_secret';

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token for non-existent user', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockReturnValue({ userId: 999 });
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(null); // User not found

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'User not found',
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token for inactive user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        is_active: false, // User is not active
      };

      req.headers.authorization = 'Bearer valid_token_123';
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get.mockResolvedValue(mockUser);

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('deactivated'),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token without valid session in database', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        is_active: true,
      };

      req.headers.authorization = 'Bearer valid_token_123';
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get
        .mockResolvedValueOnce(mockUser) // User found
        .mockResolvedValueOnce(null); // Session not found
      cryptoUtil.hash.mockReturnValue('hashed_token');

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Session expired or invalid'),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject and clean up expired session', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        is_active: true,
      };

      const mockSession = {
        id: 1,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago (expired)
      };

      req.headers.authorization = 'Bearer valid_token_123';
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockSession);
      database.run.mockResolvedValue();
      cryptoUtil.hash.mockReturnValue('hashed_token');

      await authenticateToken(req, res, next);

      expect(database.run).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [1]);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('expired'),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle malformed authorization header', async () => {
      req.headers.authorization = 'InvalidFormat';

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle missing JWT_SECRET', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      delete process.env.JWT_SECRET;

      jwt.verify.mockImplementation(() => {
        throw new Error('JWT_SECRET environment variable is required');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle database connection errors', async () => {
      req.headers.authorization = 'Bearer valid_token_123';
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockRejectedValue(new Error('Database connection failed'));

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    test('should accept Authorization header with capital A', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        is_active: true,
      };

      const mockSession = {
        id: 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      req.headers.Authorization = 'Bearer valid_token_123'; // Capital A
      process.env.JWT_SECRET = 'test_secret';

      jwt.verify.mockReturnValue({ userId: 1 });
      database.connect.mockResolvedValue();
      database.get.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(mockSession);
      cryptoUtil.hash.mockReturnValue('hashed_token');

      await authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token_123', 'test_secret');
      expect(next).toHaveBeenCalled();
    });
  });
});
