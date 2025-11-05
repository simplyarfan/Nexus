const crypto = require('crypto');

/**
 * Two-Factor Authentication Utility
 * Handles OTP generation, verification, and expiry management
 */
class TwoFactorAuth {
  /**
   * Generate a 6-digit OTP
   * @returns {string} 6-digit OTP code
   */
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get OTP expiry time (10 minutes from now)
   * @returns {Date} Expiry timestamp
   */
  static getExpiryTime() {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Verify OTP code
   * @param {string} inputCode - Code entered by user
   * @param {string} storedCode - Code stored in database
   * @param {Date} expiryTime - Code expiry timestamp
   * @returns {Object} Verification result with valid flag and reason
   */
  static verifyOTP(inputCode, storedCode, expiryTime) {
    if (!storedCode || !expiryTime) {
      return { valid: false, reason: 'NO_CODE' };
    }

    const now = new Date();
    const expiry = new Date(expiryTime);

    if (now > expiry) {
      return { valid: false, reason: 'EXPIRED' };
    }

    if (inputCode !== storedCode) {
      return { valid: false, reason: 'INVALID' };
    }

    return { valid: true };
  }

  /**
   * Generate a secret for authenticator apps (future enhancement)
   * @param {string} email - User email
   * @returns {string} Base32 encoded secret
   */
  static generateSecret(email) {
    const secret = crypto.randomBytes(20).toString('hex');
    return secret;
  }
}

/**
 * Generate a 2FA/verification code with hash and expiry
 * @returns {Object} { code, hashedCode, expiresAt }
 */
function generate2FACode() {
  const code = TwoFactorAuth.generateOTP();
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = TwoFactorAuth.getExpiryTime();

  return { code, hashedCode, expiresAt };
}

/**
 * Verify a 2FA/verification code
 * @param {string} inputCode - Code entered by user
 * @param {string} storedHashedCode - Hashed code from database
 * @param {Date} expiryTime - Code expiry timestamp
 * @returns {Object} Verification result
 */
function verify2FACode(inputCode, storedHashedCode, expiryTime) {
  if (!storedHashedCode || !expiryTime) {
    return { valid: false, reason: 'NO_CODE' };
  }

  const now = new Date();
  const expiry = new Date(expiryTime);

  if (now > expiry) {
    return { valid: false, reason: 'EXPIRED' };
  }

  // Hash the input code and compare with stored hash
  const inputHash = crypto.createHash('sha256').update(inputCode).digest('hex');

  if (inputHash !== storedHashedCode) {
    return { valid: false, reason: 'INVALID' };
  }

  return { valid: true };
}

module.exports = TwoFactorAuth;
module.exports.generate2FACode = generate2FACode;
module.exports.verify2FACode = verify2FACode;
