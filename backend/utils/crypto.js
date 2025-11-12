const crypto = require('crypto');

/**
 * Crypto Utility for Token Encryption/Decryption
 * Uses AES-256-GCM for authenticated encryption
 */
class CryptoUtil {
  constructor() {
    // Encryption key from environment (must be 32 bytes for AES-256)
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      this.encryptionEnabled = false;
      return;
    }

    // Derive 32-byte key from env variable (in case it's not exactly 32 bytes)
    this.encryptionKey = crypto.createHash('sha256').update(encryptionKey).digest();
    this.algorithm = 'aes-256-gcm';
    this.encryptionEnabled = true;
  }

  /**
   * Encrypt a token using AES-256-GCM
   * @param {string} plaintext - Token to encrypt
   * @returns {string} Encrypted token in format: iv:authTag:ciphertext (base64)
   */
  encrypt(plaintext) {
    if (!this.encryptionEnabled || !plaintext) {
      return plaintext; // Graceful degradation if encryption not configured
    }

    try {
      // Generate random IV (12 bytes for GCM)
      const iv = crypto.randomBytes(12);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt
      let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
      ciphertext += cipher.final('base64');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return format: iv:authTag:ciphertext (all base64)
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext}`;
    } catch (error) {
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt a token using AES-256-GCM
   * @param {string} encryptedToken - Encrypted token in format: iv:authTag:ciphertext
   * @returns {string} Decrypted plaintext token
   */
  decrypt(encryptedToken) {
    if (!this.encryptionEnabled || !encryptedToken) {
      return encryptedToken; // Graceful degradation
    }

    try {
      // Split encrypted token into components
      const parts = encryptedToken.split(':');

      if (parts.length !== 3) {
        // If token doesn't match format, assume it's unencrypted (for migration)

        return encryptedToken;
      }

      const [ivBase64, authTagBase64, ciphertext] = parts;

      // Convert from base64
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Hash a value using SHA256
   * @param {string} value - Value to hash
   * @returns {string} SHA256 hash (hex)
   */
  hash(value) {
    if (!value) return null;
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Verify a hash matches a value
   * @param {string} value - Original value
   * @param {string} hash - Hash to compare
   * @returns {boolean} True if hash matches
   */
  verifyHash(value, hash) {
    if (!value || !hash) return false;
    const computedHash = this.hash(value);
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
  }

  /**
   * Generate a random secure token
   * @param {number} bytes - Number of random bytes (default: 32)
   * @returns {string} Random token (hex)
   */
  generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
  }
}

// Export singleton instance
module.exports = new CryptoUtil();
