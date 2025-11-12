const crypto = require('../../../utils/crypto');

describe('Crypto Utility', () => {
  const testData = 'sensitive-data-12345';

  describe('encrypt/decrypt', () => {
    test('should encrypt and decrypt data correctly', () => {
      const encrypted = crypto.encrypt(testData);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(testData);

      const decrypted = crypto.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    test('should handle null/undefined input', () => {
      expect(crypto.encrypt(null)).toBeNull();
      expect(crypto.encrypt(undefined)).toBeUndefined();
      expect(crypto.decrypt(null)).toBeNull();
    });

    test('should produce different ciphertext for same plaintext', () => {
      const encrypted1 = crypto.encrypt(testData);
      const encrypted2 = crypto.encrypt(testData);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('hash', () => {
    test('should hash data consistently', () => {
      const hash1 = crypto.hash(testData);
      const hash2 = crypto.hash(testData);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    test('should produce different hashes for different data', () => {
      const hash1 = crypto.hash('data1');
      const hash2 = crypto.hash('data2');
      expect(hash1).not.toBe(hash2);
    });

    test('should handle null input', () => {
      expect(crypto.hash(null)).toBeNull();
    });
  });
});
