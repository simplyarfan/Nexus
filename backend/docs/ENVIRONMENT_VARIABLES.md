# Environment Variables Documentation

## Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [Variable Details](#variable-details)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [Security Best Practices](#security-best-practices)

## Required Variables

These variables **must** be set for the application to function:

| Variable         | Description                            | Example                                               | Required |
| ---------------- | -------------------------------------- | ----------------------------------------------------- | -------- |
| `DATABASE_URL`   | PostgreSQL connection string           | `postgresql://user:pass@host:5432/db?sslmode=require` | ✅ Yes   |
| `JWT_SECRET`     | Secret key for JWT tokens              | `<256-bit-random-string>`                             | ✅ Yes   |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 encryption | `<64-character-hex-string>`                           | ✅ Yes   |
| `SESSION_SECRET` | Secret for session management          | `<256-bit-random-string>`                             | ✅ Yes   |
| `NODE_ENV`       | Environment mode                       | `development`, `production`, `test`                   | ✅ Yes   |

## Optional Variables

These variables enhance functionality but have defaults:

### Authentication & Security

| Variable                   | Description                              | Default              | Example                   |
| -------------------------- | ---------------------------------------- | -------------------- | ------------------------- |
| `JWT_REFRESH_SECRET`       | Secret for refresh tokens                | Same as `JWT_SECRET` | `<256-bit-random-string>` |
| `MAX_LOGIN_ATTEMPTS`       | Max failed login attempts before lockout | `5`                  | `5`                       |
| `ACCOUNT_LOCKOUT_DURATION` | Lockout duration in minutes              | `15`                 | `15`                      |

### Server Configuration

| Variable          | Description                  | Default                 | Example                                           |
| ----------------- | ---------------------------- | ----------------------- | ------------------------------------------------- |
| `PORT`            | Server port number           | `3001`                  | `3001`                                            |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` | `https://app.example.com,https://www.example.com` |

### Email Configuration

| Variable     | Description                 | Default | Example             |
| ------------ | --------------------------- | ------- | ------------------- |
| `EMAIL_HOST` | SMTP server hostname        | -       | `smtp.sendgrid.net` |
| `EMAIL_PORT` | SMTP server port            | `587`   | `587`               |
| `EMAIL_USER` | SMTP username/API key       | -       | `apikey`            |
| `EMAIL_PASS` | SMTP password/API key value | -       | `SG.xxx`            |

### Redis Configuration

| Variable    | Description             | Default         | Example                         |
| ----------- | ----------------------- | --------------- | ------------------------------- |
| `REDIS_URL` | Redis connection string | Memory fallback | `redis://:<password>@host:port` |

### Rate Limiting

| Variable            | Description                  | Default | Example |
| ------------------- | ---------------------------- | ------- | ------- |
| `RATE_LIMIT_WINDOW` | Rate limit window in minutes | `15`    | `15`    |
| `RATE_LIMIT_MAX`    | Max requests per window      | `100`   | `100`   |

### Monitoring & Observability

| Variable     | Description               | Default | Example                             |
| ------------ | ------------------------- | ------- | ----------------------------------- |
| `SENTRY_DSN` | Sentry error tracking DSN | -       | `https://<key>@sentry.io/<project>` |

### Performance Thresholds

| Variable                      | Description                        | Default | Example |
| ----------------------------- | ---------------------------------- | ------- | ------- |
| `SLOW_REQUEST_THRESHOLD`      | Slow request threshold (ms)        | `1000`  | `1000`  |
| `VERY_SLOW_REQUEST_THRESHOLD` | Very slow request threshold (ms)   | `3000`  | `3000`  |
| `SLOW_QUERY_THRESHOLD`        | Slow database query threshold (ms) | `100`   | `100`   |
| `VERY_SLOW_QUERY_THRESHOLD`   | Very slow query threshold (ms)     | `500`   | `500`   |

## Variable Details

### DATABASE_URL

**Format:**

```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

**Requirements:**

- Must be a valid PostgreSQL connection string
- SSL mode should be `require` in production
- Database must exist before starting the application

**Providers:**

- Neon: Managed PostgreSQL with connection pooling
- Railway: Managed PostgreSQL with automated backups
- Heroku Postgres: Fully managed PostgreSQL
- AWS RDS: Enterprise PostgreSQL hosting
- DigitalOcean: Managed PostgreSQL databases

**Example:**

```bash
# Neon
DATABASE_URL="postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Railway
DATABASE_URL="postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway"

# Local development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
```

### JWT_SECRET

**Purpose:** Signs and verifies JWT access tokens for authentication.

**Requirements:**

- Minimum 256 bits (32 bytes) of entropy
- Should be cryptographically secure random data
- Must be kept secret and never committed to version control
- Different value for production and development

**Generate:**

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example:**

```bash
JWT_SECRET="Zx8dP3mQ1nR5kL7jT2vW9bN4cF6hG0yA"
```

### ENCRYPTION_KEY

**Purpose:** AES-256-GCM encryption for OAuth tokens and sensitive data.

**Requirements:**

- Must be exactly 64 hexadecimal characters (32 bytes)
- Cryptographically secure random generation
- Never change this in production (existing encrypted data becomes unreadable)
- Back up this key securely

**Generate:**

```bash
# Using OpenSSL
openssl rand -hex 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example:**

```bash
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

### SESSION_SECRET

**Purpose:** Signs session cookies and CSRF tokens.

**Requirements:**

- Minimum 256 bits (32 bytes) of entropy
- Cryptographically secure random data
- Rotate periodically (every 90 days recommended)

**Generate:**

```bash
openssl rand -base64 32
```

**Example:**

```bash
SESSION_SECRET="8aK3nR7pL2mQ5jT9vW1bN6cF4hG0yZ"
```

### ALLOWED_ORIGINS

**Purpose:** Configures CORS to allow frontend applications to access the API.

**Requirements:**

- Comma-separated list of allowed origins
- Must include protocol (http:// or https://)
- No trailing slashes
- Must match exact frontend URLs

**Example:**

```bash
# Single origin
ALLOWED_ORIGINS="https://app.example.com"

# Multiple origins
ALLOWED_ORIGINS="https://app.example.com,https://www.example.com,https://admin.example.com"

# Development
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

### REDIS_URL

**Purpose:** Redis connection for distributed caching and rate limiting.

**Requirements:**

- Valid Redis connection string
- Include password if Redis requires authentication
- Application falls back to in-memory caching if not provided

**Format:**

```
redis://[:<password>]@[host]:[port]
```

**Providers:**

- Upstash: Serverless Redis with generous free tier
- Redis Cloud: Managed Redis by Redis Labs
- AWS ElastiCache: Enterprise Redis hosting
- Heroku Redis: Add-on for Heroku apps

**Example:**

```bash
# Without password
REDIS_URL="redis://localhost:6379"

# With password
REDIS_URL="redis://:mypassword@localhost:6379"

# Upstash
REDIS_URL="rediss://:password@us1-example-12345.upstash.io:6379"
```

### SENTRY_DSN

**Purpose:** Error tracking and performance monitoring with Sentry.

**Requirements:**

- Create Sentry project at https://sentry.io
- Copy DSN from project settings
- Optional but highly recommended for production

**Format:**

```
https://[key]@[organization].ingest.sentry.io/[project-id]
```

**Example:**

```bash
SENTRY_DSN="https://abc123def456@o123456.ingest.sentry.io/789012"
```

### EMAIL Configuration

**Purpose:** Send transactional emails (verification, password reset, notifications).

**Providers:**

#### SendGrid (Recommended)

```bash
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASS="SG.xxx" # Your SendGrid API key
```

#### AWS SES

```bash
EMAIL_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_PORT="587"
EMAIL_USER="<AWS-SES-SMTP-Username>"
EMAIL_PASS="<AWS-SES-SMTP-Password>"
```

#### Gmail (Development Only)

```bash
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="<app-specific-password>"
```

## Environment-Specific Configuration

### Development (.env.local)

```bash
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp_dev"
JWT_SECRET="dev-secret-change-in-production"
ENCRYPTION_KEY="dev0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab"
SESSION_SECRET="dev-session-secret"
ALLOWED_ORIGINS="http://localhost:3000"
REDIS_URL="redis://localhost:6379"
```

### Staging (.env.staging)

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:pass@staging-db.example.com:5432/myapp_staging?sslmode=require"
JWT_SECRET="<staging-secret>"
ENCRYPTION_KEY="<staging-encryption-key>"
SESSION_SECRET="<staging-session-secret>"
ALLOWED_ORIGINS="https://staging.example.com"
REDIS_URL="redis://:password@staging-redis.example.com:6379"
SENTRY_DSN="<staging-sentry-dsn>"
```

### Production (.env.production)

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:pass@prod-db.example.com:5432/myapp_prod?sslmode=require"
JWT_SECRET="<production-secret>"
ENCRYPTION_KEY="<production-encryption-key>"
SESSION_SECRET="<production-session-secret>"
ALLOWED_ORIGINS="https://app.example.com,https://www.example.com"
REDIS_URL="rediss://:password@prod-redis.example.com:6380"
SENTRY_DSN="<production-sentry-dsn>"

# Email
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT="587"
EMAIL_USER="apikey"
EMAIL_PASS="<sendgrid-api-key>"

# Rate Limiting (stricter in production)
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=30

# Performance Monitoring
SLOW_REQUEST_THRESHOLD=1000
VERY_SLOW_REQUEST_THRESHOLD=3000
SLOW_QUERY_THRESHOLD=100
VERY_SLOW_QUERY_THRESHOLD=500
```

## Security Best Practices

### 1. Secret Generation

**Always use cryptographically secure random generation:**

```bash
# Good
openssl rand -base64 32

# Bad - never use weak secrets
JWT_SECRET="password123"
JWT_SECRET="secret"
```

### 2. Secret Rotation

Rotate secrets regularly:

- JWT secrets: Every 90 days
- Session secrets: Every 30-90 days
- Encryption keys: Only when compromised (requires data re-encryption)

### 3. Secret Storage

**Never:**

- Commit secrets to version control
- Share secrets via email or Slack
- Store secrets in code comments
- Use the same secrets across environments

**Always:**

- Use environment variables
- Store in secure secret management (AWS Secrets Manager, HashiCorp Vault)
- Encrypt secrets at rest
- Use deployment platform's secret management

### 4. Access Control

- Limit who can access production secrets
- Use IAM roles and principle of least privilege
- Audit secret access logs
- Revoke access immediately when team members leave

### 5. Secret Validation

Add validation in your application:

```javascript
// config/validate.js
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'ENCRYPTION_KEY', 'SESSION_SECRET'];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate encryption key length
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 64 hexadecimal characters');
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}

module.exports = { validateEnv };
```

### 6. Development vs Production

Use different secrets for each environment:

```bash
# Development
JWT_SECRET="dev-secret-not-secure-ok-for-local-testing"

# Production
JWT_SECRET="<cryptographically-secure-random-string>"
```

### 7. Backup Encrypted Secrets

- Store encrypted backups of production secrets
- Use multiple backup locations
- Test secret restoration regularly
- Document secret recovery procedures

## Troubleshooting

### Missing Environment Variables

**Error:** `Missing required environment variables`

**Solution:**

1. Check `.env` file exists
2. Verify all required variables are set
3. Restart application after changes
4. Check for typos in variable names

### Invalid Database URL

**Error:** `Connection refused` or `Invalid connection string`

**Solution:**

1. Verify DATABASE_URL format
2. Check database is running
3. Verify credentials are correct
4. Ensure SSL mode is set correctly
5. Check network connectivity

### JWT Verification Failed

**Error:** `Invalid token` or `jwt malformed`

**Solution:**

1. Verify JWT_SECRET matches across deployments
2. Check token hasn't expired
3. Ensure secret wasn't changed recently
4. Clear existing tokens and re-authenticate

### Encryption/Decryption Errors

**Error:** `Decryption failed` or `Invalid IV length`

**Solution:**

1. Verify ENCRYPTION_KEY is exactly 64 hex characters
2. Check key wasn't changed (would make existing data unreadable)
3. Ensure data was encrypted with same key
4. Verify key format (hex vs base64)

### CORS Errors

**Error:** `Access-Control-Allow-Origin` error

**Solution:**

1. Verify ALLOWED_ORIGINS includes frontend URL
2. Check for trailing slashes (shouldn't have them)
3. Ensure protocol matches (http vs https)
4. Clear browser cache
5. Check CORS middleware configuration

## Additional Resources

- [12-Factor App: Config](https://12factor.net/config)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)
