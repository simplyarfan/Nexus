# Production Deployment Checklist

## Pre-Deployment

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] Code coverage ≥70% (`npm run test:coverage`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run format:check`)
- [ ] No console.log statements in production code
- [ ] All TODOs resolved or documented

### Security

- [ ] All secrets generated with cryptographically secure methods
- [ ] JWT_SECRET is 256+ bits
- [ ] ENCRYPTION_KEY is exactly 64 hex characters
- [ ] All secrets different from development/staging
- [ ] No secrets committed to version control
- [ ] `.env.example` updated with all variables
- [ ] Security audit passed (`npm audit`)
- [ ] No high/critical vulnerabilities
- [ ] Dependencies updated to latest stable versions
- [ ] HTTPS enforced
- [ ] CORS configured with exact origins (no wildcards)
- [ ] CSP headers properly configured
- [ ] Rate limiting enabled and tested
- [ ] CSRF protection active
- [ ] Input validation comprehensive
- [ ] SQL injection prevention verified
- [ ] XSS protection tested

### Database

- [ ] Production database created
- [ ] SSL/TLS enabled
- [ ] Connection pooling configured
- [ ] Indexes created for frequently queried fields
- [ ] Migrations tested
- [ ] Backup strategy implemented
- [ ] Backup restoration tested
- [ ] Connection string uses `?sslmode=require`

### Environment Variables

- [ ] All required variables set
- [ ] DATABASE_URL configured
- [ ] JWT_SECRET set
- [ ] JWT_REFRESH_SECRET set
- [ ] ENCRYPTION_KEY set
- [ ] SESSION_SECRET set
- [ ] ALLOWED_ORIGINS configured
- [ ] SENTRY_DSN configured (if using Sentry)
- [ ] EMAIL credentials configured (if using email)
- [ ] REDIS_URL configured (if using Redis)
- [ ] NODE_ENV=production

### Monitoring

- [ ] Sentry project created and DSN added
- [ ] Error alerts configured
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring set up (UptimeRobot, Pingdom)
- [ ] Health check endpoint tested
- [ ] Log aggregation configured
- [ ] Metrics dashboard created

### Performance

- [ ] Database queries optimized
- [ ] Slow query logging enabled
- [ ] Response compression enabled
- [ ] Redis caching configured (if available)
- [ ] File uploads optimized
- [ ] Request timeouts set
- [ ] Connection pooling enabled

## Deployment

### Platform Setup

- [ ] Deployment platform selected (Vercel, Railway, Heroku, etc.)
- [ ] Platform CLI installed
- [ ] Project initialized
- [ ] Environment variables uploaded
- [ ] Build command configured
- [ ] Start command configured

### DNS & SSL

- [ ] Custom domain configured
- [ ] DNS records updated (A or CNAME)
- [ ] SSL certificate provisioned
- [ ] HTTPS redirect enabled
- [ ] DNS propagation verified

### Build & Deploy

- [ ] Build successful locally
- [ ] Deploy to staging first
- [ ] Staging tests passed
- [ ] Deploy to production
- [ ] Production build successful
- [ ] Application starts without errors

## Post-Deployment

### Verification

- [ ] Health check endpoint returns 200 (`/api/health`)
- [ ] API documentation accessible (`/api-docs`)
- [ ] Authentication working (login/register)
- [ ] Protected routes require authentication
- [ ] CORS working from frontend
- [ ] Rate limiting working (test with multiple requests)
- [ ] Error tracking reporting to Sentry
- [ ] Performance monitoring active

### Functional Testing

- [ ] User registration works
- [ ] Email verification works (if enabled)
- [ ] Login works
- [ ] Logout works
- [ ] Token refresh works
- [ ] Password reset works
- [ ] Profile updates work
- [ ] Key features tested (interview scheduling, etc.)
- [ ] File uploads work (if applicable)
- [ ] Email sending works (if applicable)

### Performance Testing

- [ ] Response times acceptable (<1s for most requests)
- [ ] Database queries optimized (<100ms for most queries)
- [ ] No memory leaks observed
- [ ] CPU usage normal
- [ ] Load testing passed (`npm run load:test`)

### Security Testing

- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] CSRF protection working
- [ ] Rate limiting blocks excessive requests
- [ ] CORS blocks unauthorized origins
- [ ] Invalid tokens rejected
- [ ] Expired tokens rejected
- [ ] Account lockout works after failed attempts

### Monitoring

- [ ] Error tracking confirmed (trigger test error)
- [ ] Performance monitoring confirmed
- [ ] Slow query alerts working
- [ ] Uptime monitoring active
- [ ] Alert notifications working

## Post-Launch (First 24 Hours)

### Hour 1

- [ ] Monitor logs for errors
- [ ] Check error rate in Sentry
- [ ] Verify uptime monitoring
- [ ] Test critical user flows
- [ ] Monitor response times

### Hour 6

- [ ] Review error logs
- [ ] Check database performance
- [ ] Verify backup completed
- [ ] Monitor resource usage
- [ ] Check for any security alerts

### Hour 24

- [ ] Analyze first day metrics
- [ ] Review all errors and warnings
- [ ] Check database size/growth
- [ ] Verify all automated tasks ran
- [ ] Document any issues encountered

## Ongoing Maintenance

### Daily

- [ ] Check error rates
- [ ] Review critical errors
- [ ] Monitor uptime
- [ ] Check backup completion

### Weekly

- [ ] Review all errors
- [ ] Check for security advisories
- [ ] Review performance metrics
- [ ] Check dependency updates

### Monthly

- [ ] Update dependencies
- [ ] Review and optimize slow queries
- [ ] Rotate secrets (if due)
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Review rate limit effectiveness

### Quarterly

- [ ] Security audit
- [ ] Penetration testing
- [ ] Disaster recovery test
- [ ] Compliance review
- [ ] Team security training
- [ ] Update documentation

## Rollback Plan

### If Issues Occur

1. [ ] Identify the issue quickly
2. [ ] Assess severity and impact
3. [ ] Check if hotfix is possible
4. [ ] If not, initiate rollback
5. [ ] Rollback to previous deployment
6. [ ] Verify rollback successful
7. [ ] Notify stakeholders
8. [ ] Document incident
9. [ ] Fix issue in development
10. [ ] Re-deploy with fix

### Rollback Commands

**Vercel:**

```bash
vercel ls
vercel rollback <deployment-url>
```

**Railway:**

```bash
railway status
railway rollback <deployment-id>
```

**Heroku:**

```bash
heroku releases
heroku rollback v<version>
```

## Emergency Contacts

- **Platform Support:** [Platform support contact]
- **Database Support:** [Database provider support]
- **Team Lead:** [Contact info]
- **DevOps:** [Contact info]
- **Security Team:** [Contact info]

## Success Criteria

✅ Deployment is considered successful when:

- All health checks passing
- No critical errors in logs
- Authentication working
- Key features functional
- Performance metrics acceptable
- Security measures verified
- Monitoring active
- No customer complaints
- Error rate <1%
- Response time <1s p95

## Documentation

- [ ] Deployment date/time recorded
- [ ] Deployment notes documented
- [ ] Any issues encountered documented
- [ ] Performance baseline recorded
- [ ] Team notified of deployment
- [ ] Customer communication sent (if needed)

## Sign-Off

- [ ] Developer sign-off
- [ ] QA sign-off (if applicable)
- [ ] Tech lead sign-off
- [ ] Product owner sign-off (if applicable)

---

**Deployed by:** **\*\***\_\_\_**\*\***
**Date:** **\*\***\_\_\_**\*\***
**Time:** **\*\***\_\_\_**\*\***
**Version/Commit:** **\*\***\_\_\_**\*\***
**Platform:** **\*\***\_\_\_**\*\***
**Notes:** **\*\***\_\_\_**\*\***
