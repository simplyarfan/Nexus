/**
 * JWT Authentication Utilities
 * Used across serverless functions for token generation and verification
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT tokens (access + refresh)
 */
const generateTokens = (userId, email, role, rememberMe = false) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  const accessToken = jwt.sign(
    { userId, email, role, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const refreshTokenExpiry = rememberMe ? '90d' : '30d';

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    refreshSecret,
    { expiresIn: refreshTokenExpiry }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: rememberMe ? 90 : 30,
  };
};

/**
 * Verify JWT access token
 */
const verifyAccessToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify JWT refresh token
 */
const verifyRefreshToken = (token) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, refreshSecret);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
