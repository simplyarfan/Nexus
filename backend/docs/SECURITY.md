# Security Best Practices Guide

## Table of Contents

1. [Overview](#overview)
2. [Implemented Security Measures](#implemented-security-measures)
3. [Authentication & Authorization](#authentication--authorization)
4. [Data Protection](#data-protection)
5. [Network Security](#network-security)
6. [Input Validation](#input-validation)
7. [Dependency Management](#dependency-management)
8. [Monitoring & Incident Response](#monitoring--incident-response)
9. [Compliance](#compliance)
10. [Security Audit Checklist](#security-audit-checklist)

## Overview

This document outlines the security measures implemented in the Enterprise AI Hub backend and best practices for maintaining security in production.

### Security Principles

- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Minimum necessary access rights
- **Fail Securely**: Errors handled without exposing sensitive information
- **Secure by Default**: Security measures enabled out-of-the-box
- **Regular Updates**: Dependencies and security patches kept current

## Implemented Security Measures

### ✅ Authentication & Authorization

- [x] JWT-based authentication with refresh tokens
- [x] Refresh token rotation on use
- [x] Token blacklisting via session deletion
- [x] Account lockout after failed login attempts (5 attempts, 15-min lockout)
- [x] 2FA verification support
- [x] Email verification for new accounts
- [x] Password strength requirements (min 8 chars, complexity)
- [x] Secure password reset with time-limited tokens

### ✅ Data Protection

- [x] AES-256-GCM encryption for sensitive data (OAuth tokens)
- [x] SHA256 hashing for session tokens
- [x] Bcrypt password hashing (10 rounds)
- [x] SQL injection prevention (prepared statements)
- [x] XSS prevention (HTML sanitization at 3 levels)
- [x] Input validation and sanitization

### ✅ Network Security

- [x] CORS configuration with exact origin matching
- [x] CSRF protection (double-submit cookie pattern)
- [x] Security headers (CSP, X-Frame-Options, etc.)
- [x] Rate limiting (Redis-backed, distributed)
- [x] Request timeouts (10s general, 30s for Graph API)
- [x] Compression for bandwidth optimization

### ✅ Monitoring & Logging

- [x] Sentry error tracking and alerting
- [x] Performance monitoring (slow request/query detection)
- [x] Request/response logging with Winston
- [x] Database query performance monitoring
- [x] Audit trails for critical operations

## Authentication & Authorization

### JWT Implementation

**Access Token:**

- Short-lived (15 minutes)
- Contains user ID, email, role
- Signed with JWT_SECRET
- Verified on every protected route

**Refresh Token:**

- Long-lived (7 days)
- Stored hashed in database
- Single-use (rotated on refresh)
- Can be revoked (session deletion)

```javascript
// Secure token generation
const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
```

### Token Storage

**Server-Side:**

```javascript
// Hash tokens before database storage
const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
await database.run('INSERT INTO user_sessions (session_token, ...) VALUES ($1, ...)', [
  hashedToken,
]);
```

**Client-Side Best Practices:**

- Store access token in memory or short-lived httpOnly cookie
- Never store in localStorage (XSS vulnerable)
- Include in Authorization header: `Bearer <token>`

### Password Security

**Requirements:**

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Hashing:**

```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash(password, 10); // 10 rounds
```

**Password Reset:**

1. Generate cryptographically secure token
2. Hash and store with expiration (1 hour)
3. Send reset link via email
4. Verify token and expiration
5. Allow password change
6. Invalidate all existing sessions

### Account Lockout

**Configuration:**

```javascript
MAX_LOGIN_ATTEMPTS = 5; // Failed attempts before lockout
ACCOUNT_LOCKOUT_DURATION = 15; // Minutes
```

**Implementation:**

- Tracks failed attempts per email
- Locks account after threshold
- Automatic unlock after duration
- Admin override capability

### Two-Factor Authentication

**Flow:**

1. User enables 2FA
2. Generate TOTP secret
3. User scans QR code
4. Verify code
5. Store secret encrypted
6. Require code on login

## Data Protection

### Encryption at Rest

**Sensitive Data Encryption:**

```javascript
// AES-256-GCM encryption
const crypto = require('./utils/crypto');

// Encrypt OAuth tokens
const encryptedToken = crypto.encrypt(oauthToken);

// Decrypt when needed
const decryptedToken = crypto.decrypt(encryptedToken);
```

**What to Encrypt:**

- OAuth access tokens
- OAuth refresh tokens
- API keys
- Personal identifiable information (PII)
- Payment information

**What to Hash:**

- Passwords (bcrypt)
- Session tokens (SHA256)
- Email verification tokens
- Password reset tokens

### Encryption in Transit

**Requirements:**

- HTTPS enforced in production
- TLS 1.2 or higher
- Strong cipher suites
- Database connections use SSL

**Configuration:**

```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Data Sanitization

**HTML Sanitization Levels:**

1. **Strict** (sanitizeStrict):

```javascript
// Removes ALL HTML tags
const clean = sanitizeStrict(userInput);
// Use for: Plain text fields, emails, names
```

2. **Basic** (sanitizeBasic):

```javascript
// Allows safe formatting tags
const clean = sanitizeBasic(userInput);
// Use for: Comments, descriptions, basic text formatting
// Allows: <p>, <strong>, <em>, <ul>, <ol>, <li>
```

3. **Rich** (sanitizeRich):

```javascript
// Allows rich formatting
const clean = sanitizeRich(userInput);
// Use for: Rich text editors, articles, formatted content
// Allows: headers, lists, code blocks, links
```

## Network Security

### Content Security Policy (CSP)

**Implemented Headers:**

```javascript
{
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],  // No unsafe-inline or unsafe-eval
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  }
}
```

### CORS Configuration

**Secure Implementation:**

```javascript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');

    // Exact match only - no wildcards
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};
```

**Important:**

- Never use wildcard (\*) in production
- Always use exact origin matching
- Include protocol in allowed origins
- No trailing slashes

### Rate Limiting

**Implementation Levels:**

1. **Authentication Endpoints** (Strict):

```javascript
// 5 requests per 15 minutes
authLimiter: {
  windowMs: 15 * 60 * 1000,
  max: 5,
}
```

2. **General API** (Moderate):

```javascript
// 100 requests per 15 minutes
generalLimiter: {
  windowMs: 15 * 60 * 1000,
  max: 100,
}
```

3. **Password Reset** (Very Strict):

```javascript
// 3 requests per hour
passwordResetLimiter: {
  windowMs: 60 * 60 * 1000,
  max: 3,
}
```

**Redis-Backed (Recommended):**

- Distributed rate limiting across instances
- Persistent state across restarts
- Better performance at scale

**Memory Fallback:**

- Works without Redis
- Per-instance limits
- Resets on server restart

### CSRF Protection

**Implementation:**

```javascript
// Double-submit cookie pattern
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  if (!csrfToken || !/^[a-f0-9]{64}$/.test(csrfToken)) {
    return res.status(403).json({ success: false, message: 'CSRF token missing' });
  }

  next();
};
```

**Client Integration:**

1. Server sends CSRF token in response header
2. Client stores token
3. Client includes token in X-CSRF-Token header for state-changing requests
4. Server validates token

## Input Validation

### Validation Strategy

**Always Validate:**

- Email format
- Password strength
- Phone numbers
- URLs
- Date/time formats
- File uploads (type, size)
- JSON structure

**Validation Libraries:**

- express-validator for route validation
- Custom validators for business logic

### Examples

**Email Validation:**

```javascript
const { body } = require('express-validator');

body('email').isEmail().normalizeEmail().withMessage('Valid email required');
```

**Password Validation:**

```javascript
body('password')
  .isLength({ min: 8 })
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage(
    'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  );
```

**SQL Injection Prevention:**

```javascript
// ALWAYS use prepared statements
const result = await database.get(
  'SELECT * FROM users WHERE email = $1',
  [email], // Parameterized query
);

// NEVER concatenate user input
// BAD: `SELECT * FROM users WHERE email = '${email}'`
```

### File Upload Security

**Validation:**

```javascript
const multer = require('multer');

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1, // Single file
  },
  fileFilter,
});
```

## Dependency Management

### Regular Updates

**Weekly:**

- Check for security advisories
- Review `npm audit` output
- Update patch versions

**Monthly:**

- Update minor versions
- Review changelog for breaking changes
- Test thoroughly before deployment

**Commands:**

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (patch/minor only)
npm audit fix

# Force fix (may include breaking changes)
npm audit fix --force

# Check outdated packages
npm outdated

# Update specific package
npm update <package-name>
```

### Vulnerability Scanning

**Automated CI/CD:**

```yaml
- name: Security Audit
  run: npm audit --audit-level=moderate
```

**Tools:**

- npm audit (built-in)
- Snyk (comprehensive)
- Dependabot (GitHub)
- WhiteSource Bolt

### Package Vetting

**Before Installing:**

- Check package popularity (weekly downloads)
- Review maintenance status (last update)
- Check for known vulnerabilities
- Review package permissions
- Verify package authenticity

**Red Flags:**

- No recent updates (6+ months)
- Low download count with high version number
- Suspicious package name (typosquatting)
- Requests unnecessary permissions

## Monitoring & Incident Response

### Error Tracking

**Sentry Configuration:**

```javascript
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.authorization;
    }
    return event;
  },
});
```

**What to Track:**

- Authentication failures
- Authorization violations
- Rate limit exceedances
- Validation errors
- Database errors
- External API failures

### Performance Monitoring

**Thresholds:**

```javascript
SLOW_REQUEST_THRESHOLD=1000ms        // Log warning
VERY_SLOW_REQUEST_THRESHOLD=3000ms   // Send alert
SLOW_QUERY_THRESHOLD=100ms           // Log warning
VERY_SLOW_QUERY_THRESHOLD=500ms      // Send alert
```

### Logging Best Practices

**Do Log:**

- Authentication attempts (success/failure)
- Authorization decisions
- Data access (who, what, when)
- Configuration changes
- Security events
- Performance metrics

**Don't Log:**

- Passwords (ever)
- Session tokens
- API keys
- Credit card numbers
- Personal health information
- Social security numbers

**Log Format:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "event": "user_login",
  "userId": 123,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "success": true
}
```

### Incident Response Plan

**1. Detection:**

- Monitor Sentry alerts
- Review error rates
- Check performance metrics
- User reports

**2. Assessment:**

- Severity classification
- Impact analysis
- Root cause identification

**3. Containment:**

- Isolate affected systems
- Block malicious actors
- Deploy emergency patches

**4. Recovery:**

- Restore from backups if needed
- Verify data integrity
- Resume normal operations

**5. Post-Incident:**

- Document incident details
- Conduct post-mortem
- Implement preventive measures
- Update security procedures

## Compliance

### GDPR Compliance

**User Rights:**

- Right to access personal data
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to object to processing

**Implementation:**

- Data retention policies
- User data export functionality
- Account deletion with data purge
- Consent tracking
- Privacy policy

### Data Retention

**Policy:**

```
- Active user data: Retained indefinitely
- Inactive accounts (2+ years): Mark for review
- Deleted accounts: 30-day soft delete, then purge
- Logs: 90 days retention
- Backups: 30 days retention
- Audit logs: 1 year retention
```

## Security Audit Checklist

### Pre-Production

- [ ] All secrets rotated and secured
- [ ] HTTPS enforced
- [ ] Database SSL enabled
- [ ] CORS properly configured
- [ ] CSP headers set correctly
- [ ] Rate limiting active
- [ ] Input validation comprehensive
- [ ] SQL injection prevention verified
- [ ] XSS protection tested
- [ ] CSRF protection enabled
- [ ] Authentication tested
- [ ] Authorization rules verified
- [ ] Error handling doesn't expose sensitive info
- [ ] Logging configured properly
- [ ] Monitoring and alerting active
- [ ] Backups configured and tested
- [ ] Incident response plan documented
- [ ] Dependencies updated
- [ ] Security audit passed

### Monthly Review

- [ ] Review access logs
- [ ] Check for suspicious activity
- [ ] Update dependencies
- [ ] Rotate secrets (if due)
- [ ] Review rate limit effectiveness
- [ ] Check error rates
- [ ] Verify backup integrity
- [ ] Test incident response procedures

### Quarterly Review

- [ ] Penetration testing
- [ ] Security audit
- [ ] Compliance review
- [ ] Policy updates
- [ ] Team security training
- [ ] Disaster recovery test

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [CWE Top 25 Most Dangerous Software Weaknesses](https://cwe.mitre.org/top25/)
