# Changelog

All notable changes to the Nexus (Enterprise AI Hub) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Professional development workflow setup
- Git workflow documentation (GitHub Flow)
- GitHub Projects templates and guides
- User journey maps for key features
- Notion workspace templates
- ESLint and Prettier configuration
- GitHub Actions CI/CD workflows
- Pull request and issue templates

### Changed

- None

### Fixed

- None

### Security

- None

---

## [2.0.0] - 2024-XX-XX

### Added

- **CV Intelligence (HR-01 Blueprint)**
  - Batch resume processing
  - PDF parsing and analysis
  - Candidate scoring and ranking
  - Filter by skills, experience, education
  - Export functionality

- **Interview Coordinator (HR-02 Blueprint)**
  - Interview scheduling system
  - Google Calendar integration
  - Outlook email integration
  - Automatic meeting link generation
  - ICS calendar file attachments
  - Email reminders and notifications

- **Authentication System**
  - JWT-based authentication with refresh tokens
  - Email verification on registration
  - Two-factor authentication (2FA) via email
  - Password reset functionality
  - Account lockout after failed attempts
  - Session management

- **Support Ticket System**
  - Create and manage support tickets
  - Comment threads
  - Admin ticket management
  - Status tracking (open, in-progress, resolved, closed)
  - Notifications on updates

- **Admin Dashboard**
  - User management (CRUD operations)
  - Analytics and reporting
  - System health monitoring
  - User activity tracking

- **OAuth Integration**
  - Google Calendar OAuth flow
  - Microsoft Outlook OAuth flow
  - Calendar synchronization
  - Email sending via connected accounts

### Changed

- Migrated to Next.js 14 for frontend
- Updated to Express.js 4.18.2 for backend
- Switched to PostgreSQL (Neon serverless)
- Improved security with Helmet.js
- Enhanced rate limiting on all endpoints

### Fixed

- Various security improvements
- Performance optimizations
- Bug fixes in authentication flow

### Security

- Added HTTPS enforcement in production
- Implemented rate limiting on all endpoints
- Added security headers via Helmet
- Secure password hashing with bcrypt
- JWT token security improvements

---

## [1.0.1] - 2024-XX-XX

### Fixed

- Minor bug fixes
- Documentation updates

---

## [1.0.0] - 2024-XX-XX

### Added

- Initial release
- Basic authentication system
- User management
- Admin dashboard

---

## Version Guide

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** version (X.0.0) - Incompatible API changes, breaking changes
- **MINOR** version (0.X.0) - New features, backward-compatible
- **PATCH** version (0.0.X) - Bug fixes, backward-compatible

### Change Categories

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements/fixes

---

## How to Update This File

When making changes:

1. **Add to [Unreleased] section** as you work
2. **When releasing a version**:
   - Change `[Unreleased]` to `[X.Y.Z] - YYYY-MM-DD`
   - Create new `[Unreleased]` section above it
   - Update version in package.json files
   - Create git tag: `git tag -a vX.Y.Z -m "Release version X.Y.Z"`
   - Push tags: `git push --tags`

### Example Entry Format:

```markdown
### Added

- New feature X (#123) @username
- API endpoint for Y (backend/routes/y.js:45)

### Fixed

- Fixed bug Z (#456) @username
- Resolved issue with email sending

### Security

- Patched SQL injection vulnerability (#789)
```

---

## Links

- [GitHub Repository](https://github.com/YOUR-USERNAME/nexus)
- [Documentation](./docs/)
- [Production Site](https://your-frontend.netlify.app)
- [API Documentation](https://your-backend-api.vercel.app/api)

---

## Notes

- Breaking changes should be clearly marked with `BREAKING CHANGE:`
- Always reference GitHub issue numbers (#123)
- Include file paths for major changes (backend/controllers/Auth.js:45)
- Date format: YYYY-MM-DD
