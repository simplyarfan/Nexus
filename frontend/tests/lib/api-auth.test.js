import { authenticateRequest, hasRole, withAuth } from '../../src/lib/api-auth';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('API Auth Helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_secret_key';
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  describe('authenticateRequest', () => {
    test('should authenticate valid token successfully', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid_token_123',
        },
      };

      const mockDecoded = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        first_name: 'John',
        last_name: 'Doe',
      };

      jwt.verify.mockReturnValue(mockDecoded);

      const result = await authenticateRequest(req);

      expect(jwt.verify).toHaveBeenCalledWith('valid_token_123', 'test_secret_key');
      expect(result).toEqual({
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'user',
          first_name: 'John',
          last_name: 'Doe',
        },
      });
    });

    test('should reject request without authorization header', async () => {
      const req = {
        headers: {},
      };

      const result = await authenticateRequest(req);

      expect(result).toEqual({
        error: 'No token provided',
        status: 401,
      });
    });

    test('should reject request with malformed authorization header', async () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat token',
        },
      };

      const result = await authenticateRequest(req);

      expect(result).toEqual({
        error: 'No token provided',
        status: 401,
      });
    });

    test('should reject expired token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer expired_token',
        },
      };

      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      const result = await authenticateRequest(req);

      expect(result).toEqual({
        error: 'Token expired',
        status: 401,
      });
    });

    test('should reject invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid_token',
        },
      };

      const invalidError = new Error('Invalid token');
      invalidError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      const result = await authenticateRequest(req);

      expect(result).toEqual({
        error: 'Invalid token',
        status: 401,
      });
    });

    test('should reject token without user ID', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };

      jwt.verify.mockReturnValue({ email: 'test@example.com' }); // No ID

      const result = await authenticateRequest(req);

      expect(result).toEqual({
        error: 'Invalid token',
        status: 401,
      });
    });

    test('should handle unexpected errors gracefully', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid_token',
        },
      };

      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await authenticateRequest(req);

      expect(result).toEqual({
        error: 'Authentication failed',
        status: 500,
      });
    });
  });

  describe('hasRole', () => {
    test('should return true when user has required role', () => {
      const user = { role: 'admin' };
      const allowedRoles = ['admin', 'superadmin'];

      const result = hasRole(user, allowedRoles);

      expect(result).toBe(true);
    });

    test('should return false when user does not have required role', () => {
      const user = { role: 'user' };
      const allowedRoles = ['admin', 'superadmin'];

      const result = hasRole(user, allowedRoles);

      expect(result).toBe(false);
    });

    test('should handle single role check', () => {
      const user = { role: 'user' };
      const allowedRoles = ['user'];

      const result = hasRole(user, allowedRoles);

      expect(result).toBe(true);
    });

    test('should be case-sensitive', () => {
      const user = { role: 'Admin' };
      const allowedRoles = ['admin'];

      const result = hasRole(user, allowedRoles);

      expect(result).toBe(false);
    });
  });

  describe('withAuth', () => {
    let req, res, handler;

    beforeEach(() => {
      req = {
        headers: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      handler = jest.fn();
    });

    test('should call handler for authenticated request', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockDecoded = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
      };

      jwt.verify.mockReturnValue(mockDecoded);

      const wrappedHandler = withAuth(handler);
      await wrappedHandler(req, res);

      expect(req.user).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'user',
      });
      expect(handler).toHaveBeenCalledWith(req, res);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should reject unauthenticated request', async () => {
      req.headers.authorization = null;

      const wrappedHandler = withAuth(handler);
      await wrappedHandler(req, res);

      expect(handler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No token provided',
      });
    });

    test('should enforce role-based access control', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockDecoded = {
        id: 1,
        email: 'test@example.com',
        role: 'user', // User role
      };

      jwt.verify.mockReturnValue(mockDecoded);

      const wrappedHandler = withAuth(handler, { allowedRoles: ['admin', 'superadmin'] });
      await wrappedHandler(req, res);

      expect(handler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions',
      });
    });

    test('should allow request with correct role', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockDecoded = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin', // Admin role
      };

      jwt.verify.mockReturnValue(mockDecoded);

      const wrappedHandler = withAuth(handler, { allowedRoles: ['admin', 'superadmin'] });
      await wrappedHandler(req, res);

      expect(handler).toHaveBeenCalledWith(req, res);
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should work without role restrictions', async () => {
      req.headers.authorization = 'Bearer valid_token';

      const mockDecoded = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
      };

      jwt.verify.mockReturnValue(mockDecoded);

      const wrappedHandler = withAuth(handler); // No role restrictions
      await wrappedHandler(req, res);

      expect(handler).toHaveBeenCalledWith(req, res);
    });

    test('should handle token verification errors', async () => {
      req.headers.authorization = 'Bearer invalid_token';

      const invalidError = new Error('Invalid token');
      invalidError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      const wrappedHandler = withAuth(handler);
      await wrappedHandler(req, res);

      expect(handler).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
      });
    });
  });
});
