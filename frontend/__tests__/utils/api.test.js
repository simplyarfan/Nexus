import { tokenManager } from '../../src/utils/api';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode';

jest.mock('js-cookie');
jest.mock('jwt-decode');
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn(),
        handlers: [],
      },
      response: {
        use: jest.fn(),
        handlers: [],
      },
    },
  })),
}));

describe('Token Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete global.window;
  });

  describe('getAccessToken', () => {
    test('should retrieve access token from cookies', () => {
      Cookies.get.mockReturnValue('mock_access_token');

      const token = tokenManager.getAccessToken();

      expect(Cookies.get).toHaveBeenCalledWith('accessToken');
      expect(token).toBe('mock_access_token');
    });

    test('should return undefined if no token exists', () => {
      Cookies.get.mockReturnValue(undefined);

      const token = tokenManager.getAccessToken();

      expect(token).toBeUndefined();
    });
  });

  describe('getRefreshToken', () => {
    test('should retrieve refresh token from cookies', () => {
      Cookies.get.mockReturnValue('mock_refresh_token');

      const token = tokenManager.getRefreshToken();

      expect(Cookies.get).toHaveBeenCalledWith('refreshToken');
      expect(token).toBe('mock_refresh_token');
    });
  });

  describe('setTokens', () => {
    beforeEach(() => {
      // Mock window object for testing environment detection
      global.window = {
        location: {
          hostname: '127.0.0.1',
        },
      };
    });

    test('should store tokens in cookies for development environment', () => {
      tokenManager.setTokens('new_access_token', 'new_refresh_token');

      // Should remove old tokens
      expect(Cookies.remove).toHaveBeenCalledWith('accessToken', { path: '/' });
      expect(Cookies.remove).toHaveBeenCalledWith('refreshToken', { path: '/' });
      expect(Cookies.remove).toHaveBeenCalledWith('accessToken');
      expect(Cookies.remove).toHaveBeenCalledWith('refreshToken');

      // Should set new tokens
      expect(Cookies.set).toHaveBeenCalledWith('accessToken', 'new_access_token', {
        expires: 1,
        path: '/',
        secure: false,
        sameSite: 'lax',
      });

      expect(Cookies.set).toHaveBeenCalledWith('refreshToken', 'new_refresh_token', {
        expires: 30,
        path: '/',
        secure: false,
        sameSite: 'lax',
      });
    });

    test('should use secure cookies for production environment', () => {
      global.window.location.hostname = 'app.production.com';

      tokenManager.setTokens('new_access_token', 'new_refresh_token');

      expect(Cookies.set).toHaveBeenCalledWith('accessToken', 'new_access_token', {
        expires: 1,
        path: '/',
        secure: true,
        sameSite: 'none',
      });

      expect(Cookies.set).toHaveBeenCalledWith('refreshToken', 'new_refresh_token', {
        expires: 30,
        path: '/',
        secure: true,
        sameSite: 'none',
      });
    });

    test('should handle undefined window', () => {
      delete global.window;

      expect(() => {
        tokenManager.setTokens('access_token', 'refresh_token');
      }).not.toThrow();
    });
  });

  describe('clearTokens', () => {
    test('should remove both tokens from cookies', () => {
      tokenManager.clearTokens();

      expect(Cookies.remove).toHaveBeenCalledWith('accessToken', { path: '/' });
      expect(Cookies.remove).toHaveBeenCalledWith('refreshToken', { path: '/' });
    });
  });

  describe('isTokenExpired', () => {
    beforeEach(() => {
      // Mock current time
      jest.spyOn(Date, 'now').mockReturnValue(1000000);
    });

    afterEach(() => {
      Date.now.mockRestore();
    });

    test('should return true for null token', () => {
      const result = tokenManager.isTokenExpired(null);

      expect(result).toBe(true);
    });

    test('should return true for undefined token', () => {
      const result = tokenManager.isTokenExpired(undefined);

      expect(result).toBe(true);
    });

    test('should return true for expired token', () => {
      const expiredToken = 'expired_token';
      jwtDecode.mockReturnValue({
        exp: Math.floor((Date.now() - 60000) / 1000), // 1 minute ago
      });

      const result = tokenManager.isTokenExpired(expiredToken);

      expect(jwtDecode).toHaveBeenCalledWith(expiredToken);
      expect(result).toBe(true);
    });

    test('should return false for valid token', () => {
      const validToken = 'valid_token';
      jwtDecode.mockReturnValue({
        exp: Math.floor((Date.now() + 60000) / 1000), // 1 minute from now
      });

      const result = tokenManager.isTokenExpired(validToken);

      expect(result).toBe(false);
    });

    test('should return true for token expiring within 30 seconds (buffer)', () => {
      const almostExpiredToken = 'almost_expired_token';
      jwtDecode.mockReturnValue({
        exp: Math.floor((Date.now() + 20000) / 1000), // 20 seconds from now (less than 30s buffer)
      });

      const result = tokenManager.isTokenExpired(almostExpiredToken);

      expect(result).toBe(true); // Should be considered expired due to buffer
    });

    test('should handle decoding errors gracefully', () => {
      const invalidToken = 'invalid_token';
      jwtDecode.mockImplementation(() => {
        throw new Error('Invalid token format');
      });

      const result = tokenManager.isTokenExpired(invalidToken);

      expect(result).toBe(true);
    });
  });
});
