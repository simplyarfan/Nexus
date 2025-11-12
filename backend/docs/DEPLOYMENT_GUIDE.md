# Deployment Guide - Enterprise AI Hub Backend

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Platforms](#deployment-platforms)
5. [Post-Deployment](#post-deployment)
6. [Monitoring Setup](#monitoring-setup)
7. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] Code coverage meets threshold (70%+)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] Security audit passed (`npm audit`)

### Configuration

- [ ] All environment variables documented
- [ ] Secrets rotated for production
- [ ] Database connection string updated
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] Sentry DSN configured

### Security

- [ ] JWT secrets are strong (256-bit minimum)
- [ ] Encryption keys are 64 characters
- [ ] Database uses SSL/TLS
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] CSRF protection enabled

### Performance

- [ ] Database indexes created
- [ ] Redis configured for caching
- [ ] Compression enabled
- [ ] Static assets optimized

## Environment Setup

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Authentication
JWT_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>
SESSION_SECRET=<generate-with-openssl-rand-base64-32>

# Server
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://your-frontend.com,https://www.your-frontend.com

# Email (if using)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=<your-sendgrid-api-key>

# Redis (optional but recommended)
REDIS_URL=redis://:<password>@host:port

# Monitoring
SENTRY_DSN=https://<key>@sentry.io/<project>

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=15

# Performance Thresholds
SLOW_REQUEST_THRESHOLD=1000
VERY_SLOW_REQUEST_THRESHOLD=3000
SLOW_QUERY_THRESHOLD=100
VERY_SLOW_QUERY_THRESHOLD=500
```

### Generate Secure Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Encryption Key (must be 64 hex characters)
openssl rand -hex 32

# Session Secret
openssl rand -base64 32
```

## Database Setup

### 1. Create Production Database

#### Using Neon (Recommended)

1. Go to https://neon.tech
2. Create a new project
3. Note the connection string
4. Enable connection pooling
5. Set up automated backups

#### Using Railway

1. Go to https://railway.app
2. Create a new PostgreSQL database
3. Copy the DATABASE_URL
4. Enable automatic backups

### 2. Run Migrations

```bash
# Install Prisma CLI
npm install -D prisma

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

### 3. Seed Database (Optional)

```bash
npm run seed-db
```

### 4. Create Database Indexes

```sql
-- User table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Session table indexes
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Interview table indexes
CREATE INDEX idx_interviews_scheduled_by ON interviews(scheduled_by);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interviews_datetime ON interviews(interview_date_time);
```

## Deployment Platforms

### Vercel Deployment

#### 1. Install Vercel CLI

```bash
npm i -g vercel
```

#### 2. Configure vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 3. Deploy

```bash
vercel --prod
```

#### 4. Configure Environment Variables

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ENCRYPTION_KEY
# ... add all other variables
```

### Railway Deployment

#### 1. Install Railway CLI

```bash
npm i -g @railway/cli
```

#### 2. Login and Initialize

```bash
railway login
railway init
```

#### 3. Add Environment Variables

```bash
railway variables set DATABASE_URL=<value>
railway variables set JWT_SECRET=<value>
# ... add all other variables
```

#### 4. Deploy

```bash
railway up
```

### Heroku Deployment

#### 1. Create Heroku App

```bash
heroku create your-app-name
```

#### 2. Add PostgreSQL

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### 3. Add Redis (Optional)

```bash
heroku addons:create heroku-redis:hobby-dev
```

#### 4. Set Environment Variables

```bash
heroku config:set JWT_SECRET=<value>
heroku config:set ENCRYPTION_KEY=<value>
# ... set all other variables
```

#### 5. Deploy

```bash
git push heroku main
```

### Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      # ... other env vars
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 3. Build and Run

```bash
docker-compose up -d
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check health endpoint
curl https://your-api.com/api/health

# Check API documentation
curl https://your-api.com/api-docs

# Test authentication
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Monitor Logs

```bash
# Vercel
vercel logs --follow

# Railway
railway logs

# Heroku
heroku logs --tail

# Docker
docker-compose logs -f
```

### 3. Set Up SSL/TLS

- Vercel: Automatic
- Railway: Automatic
- Heroku: Automatic
- Custom server: Use Let's Encrypt or Cloudflare

### 4. Configure DNS

- Point your domain to the deployment platform
- Add CNAME or A record
- Wait for DNS propagation (up to 48 hours)

## Monitoring Setup

### 1. Sentry Configuration

1. Create account at https://sentry.io
2. Create new project
3. Copy DSN
4. Add to environment variables
5. Verify error tracking works

### 2. Uptime Monitoring

- Use UptimeRobot, Pingdom, or StatusCake
- Monitor `/api/health` endpoint
- Set up alerts for downtime

### 3. Performance Monitoring

- Monitor response times
- Track slow queries
- Set up Sentry performance monitoring

## Rollback Procedures

### Vercel

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Railway

```bash
# List deployments
railway status

# Rollback
railway rollback <deployment-id>
```

### Heroku

```bash
# List releases
heroku releases

# Rollback to previous release
heroku rollback v<version>
```

### Docker

```bash
# Pull previous image
docker pull your-registry/your-app:previous-tag

# Restart with previous image
docker-compose down
docker-compose up -d
```

## Scaling Recommendations

### Horizontal Scaling

- Use Redis for session storage
- Implement database connection pooling
- Use load balancer (Nginx, AWS ALB)
- Deploy to multiple regions

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable database read replicas
- Use CDN for static assets

### Database Scaling

- Enable connection pooling
- Add read replicas for heavy read workloads
- Implement query caching with Redis
- Partition large tables

## Backup Strategy

### Database Backups

- Daily automated backups (provider-specific)
- Weekly full backups stored off-site
- Monthly backup retention
- Test restore procedures quarterly

### Application Backups

- Version control (Git)
- Docker images stored in registry
- Environment variable backups (encrypted)

## Security Hardening

### Production Checklist

- [ ] All secrets rotated
- [ ] HTTPS enforced
- [ ] Database SSL enabled
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Input validation enabled
- [ ] SQL injection prevention active
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Dependencies updated
- [ ] Audit logs enabled

## Support and Troubleshooting

### Common Issues

#### High Memory Usage

- Check for memory leaks
- Increase server resources
- Implement caching
- Optimize database queries

#### Slow Response Times

- Check slow query logs
- Review database indexes
- Enable compression
- Use Redis caching

#### Database Connection Errors

- Verify connection string
- Check connection pool settings
- Ensure database is accessible
- Verify SSL/TLS settings

#### Authentication Failures

- Verify JWT secrets match
- Check token expiration
- Verify CORS settings
- Check rate limiting

### Getting Help

- Check logs first
- Review Sentry errors
- Consult API documentation
- Contact support team
