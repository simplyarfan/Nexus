const { sanitizeStrict, sanitizeBasic, sanitizeRich } = require('../../../utils/sanitize');

describe('Sanitize Utility', () => {
  describe('sanitizeStrict', () => {
    test('should remove all HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello <b>World</b>';
      const result = sanitizeStrict(input);
      expect(result).toBe('Hello World');
    });

    test('should remove dangerous attributes', () => {
      const input = '<p onclick="alert()">Text</p>';
      const result = sanitizeStrict(input);
      expect(result).toBe('Text');
    });
  });

  describe('sanitizeBasic', () => {
    test('should allow safe formatting tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeBasic(input);
      expect(result).toContain('<strong>');
      expect(result).toContain('</strong>');
    });

    test('should remove script tags', () => {
      const input = '<p>Text</p><script>alert("xss")</script>';
      const result = sanitizeBasic(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>');
    });
  });

  describe('sanitizeRich', () => {
    test('should allow headings and formatting', () => {
      const input = '<h1>Title</h1><p>Content with <code>code</code></p>';
      const result = sanitizeRich(input);
      expect(result).toContain('<h1>');
      expect(result).toContain('<code>');
    });

    test('should remove dangerous elements', () => {
      const input = '<h1>Safe</h1><script>alert()</script><iframe src="evil"></iframe>';
      const result = sanitizeRich(input);
      expect(result).toContain('<h1>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<iframe>');
    });
  });
});
