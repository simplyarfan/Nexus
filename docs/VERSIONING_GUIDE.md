# Versioning Guide

## Overview

This project follows **Semantic Versioning** (SemVer) for version numbers and **Keep a Changelog** format for documenting changes.

---

## Semantic Versioning (SemVer)

### Format: `MAJOR.MINOR.PATCH` (e.g., `2.1.3`)

### Version Components

| Component | When to Increment                                 | Example       |
| --------- | ------------------------------------------------- | ------------- |
| **MAJOR** | Breaking changes that are not backward-compatible | 1.x.x → 2.0.0 |
| **MINOR** | New features that are backward-compatible         | 2.0.x → 2.1.0 |
| **PATCH** | Bug fixes that are backward-compatible            | 2.1.0 → 2.1.1 |

### Examples

#### MAJOR Version (Breaking Changes)

```
1.5.2 → 2.0.0
```

**When:**

- API endpoint renamed or removed
- Database schema changes requiring migration
- Authentication system overhaul
- Functionality removed

**Example:**

```
BREAKING CHANGE: Changed authentication response format.
Previously returned { token: "..." }, now returns { access_token: "...", refresh_token: "..." }
```

#### MINOR Version (New Features)

```
2.0.4 → 2.1.0
```

**When:**

- New API endpoint added
- New feature launched (e.g., Interview Scheduler)
- Enhancement to existing feature
- New optional parameter added

**Example:**

```
feat: Add email notification system
- Users can now receive email reminders
- Added /api/notifications endpoints
- Backward compatible with existing functionality
```

#### PATCH Version (Bug Fixes)

```
2.1.0 → 2.1.1
```

**When:**

- Bug fixed
- Performance improvement
- Documentation update
- Security patch (non-breaking)

**Example:**

```
fix: Resolve login timeout issue on Safari
- Fixed password field handling
- No API changes
```

---

## Changelog Format

### Follow Keep a Changelog

Location: `CHANGELOG.md` in root directory

### Structure

```markdown
# Changelog

## [Unreleased]

### Added

- New features in development

### Changed

- Changes to existing features

### Fixed

- Bug fixes

### Security

- Security improvements

---

## [2.1.0] - 2025-02-15

### Added

- Email notification system (#45)
- Interview reminders (#46)

### Fixed

- Login bug on Safari (#67)
```

### Categories

| Category       | Description                       | Example                            |
| -------------- | --------------------------------- | ---------------------------------- |
| **Added**      | New features                      | New API endpoint, new UI component |
| **Changed**    | Changes in existing functionality | Updated algorithm, refactored code |
| **Deprecated** | Soon-to-be removed features       | Old API endpoint deprecated        |
| **Removed**    | Removed features                  | Deleted unused code                |
| **Fixed**      | Bug fixes                         | Fixed login error                  |
| **Security**   | Security fixes                    | Patched vulnerability              |

---

## Release Workflow

### 1. During Development

Add changes to `[Unreleased]` section as you work:

```markdown
## [Unreleased]

### Added

- Email notification preferences (#48)

### Fixed

- CV upload error handling (#52)
```

### 2. Decide Version Number

Ask yourself:

- **Breaking changes?** → MAJOR version
- **New features?** → MINOR version
- **Bug fixes only?** → PATCH version

### 3. Update Files

#### Backend package.json

```bash
cd backend
npm version patch  # or minor, or major
```

#### Frontend package.json

```bash
cd frontend
npm version patch  # or minor, or major
```

### 4. Update CHANGELOG.md

```markdown
## [2.1.1] - 2025-02-15

### Added

- Email notification preferences (#48)

### Fixed

- CV upload error handling (#52)

---

## [2.1.0] - 2025-02-01

...
```

### 5. Commit Version Bump

```bash
git add .
git commit -m "chore: bump version to 2.1.1"
```

### 6. Create Git Tag

```bash
git tag -a v2.1.1 -m "Release version 2.1.1 - Bug fixes and improvements"
```

### 7. Push with Tags

```bash
git push origin main
git push origin --tags
```

### 8. Create GitHub Release

1. Go to GitHub → Releases → "Create a new release"
2. Select tag: `v2.1.1`
3. Release title: `v2.1.1 - Bug Fixes and Improvements`
4. Description: Copy from CHANGELOG.md
5. Publish release

---

## Full Example: Release v2.2.0

### Step 1: Development Complete

```markdown
## [Unreleased]

### Added

- Email notification system with customizable preferences
- Interview reminder emails (24h, 1h before)
- Admin notification dashboard

### Fixed

- Fixed email delivery issues on Gmail
- Resolved time zone bug in interview scheduler

### Security

- Updated nodemailer to patch security vulnerability
```

### Step 2: Determine Version

- New features (email notifications) → MINOR version
- Current version: `2.1.3`
- New version: `2.2.0`

### Step 3: Update Version

```bash
cd backend && npm version minor  # 1.0.1 → 1.1.0
cd frontend && npm version minor  # 2.0.0 → 2.1.0
```

### Step 4: Update CHANGELOG.md

```markdown
# Changelog

## [Unreleased]

### Added

- None

### Changed

- None

### Fixed

- None

---

## [2.2.0] - 2025-02-15

### Added

- Email notification system with customizable preferences (#45, #46)
- Interview reminder emails at 24h and 1h before scheduled time (#47)
- Admin notification dashboard for monitoring system emails (#49)

### Fixed

- Fixed email delivery issues when using Gmail SMTP (#67)
- Resolved time zone conversion bug in interview scheduler (#68)

### Security

- Updated nodemailer from 7.0.0 to 7.0.10 to patch CVE-2024-XXXX

---

## [2.1.3] - 2025-02-01

...
```

### Step 5: Commit and Tag

```bash
git add .
git commit -m "chore: release version 2.2.0

- Email notification system
- Interview reminders
- Bug fixes and security updates

See CHANGELOG.md for full details"

git tag -a v2.2.0 -m "Release version 2.2.0 - Email Notifications"

git push origin main --tags
```

### Step 6: GitHub Release

**Title:** `v2.2.0 - Email Notifications & Bug Fixes`

**Description:**

````markdown
## 🎉 What's New

### ✨ Features

- **Email Notification System** (#45, #46)
  - Customizable notification preferences
  - Interview reminders (24h and 1h before)
  - Admin dashboard for monitoring

### 🐛 Bug Fixes

- Fixed Gmail SMTP delivery issues (#67)
- Resolved interview scheduler time zone bug (#68)

### 🔒 Security

- Updated nodemailer to v7.0.10 (security patch)

## 📦 Installation

```bash
npm install
```
````

## 🔄 Upgrading from v2.1.x

No breaking changes. Simply pull and deploy.

## 📚 Documentation

- [Full Changelog](CHANGELOG.md)
- [Documentation](docs/)

````

---

## Version History Best Practices

### 1. Keep CHANGELOG.md Updated

Update `[Unreleased]` section with every PR:

```bash
git commit -m "feat: add email templates

Also updates CHANGELOG.md with new feature."
````

### 2. Reference Issues

Always link to GitHub issues:

```markdown
### Added

- Email notification system (#45)

### Fixed

- Login bug on Safari (#67)
```

### 3. Group Related Changes

```markdown
### Added

- Email notification system (#45)
  - Customizable preferences
  - Multiple templates
  - Admin dashboard
```

### 4. Highlight Breaking Changes

```markdown
### Changed

- **BREAKING:** Authentication API response format changed
  - Old: `{ token: "..." }`
  - New: `{ access_token: "...", refresh_token: "..." }`
  - Migration guide: docs/MIGRATION_v2.md
```

---

## Pre-release Versions

For beta/alpha releases:

### Format

```
2.0.0-alpha.1
2.0.0-beta.1
2.0.0-rc.1
```

### Create Pre-release

```bash
npm version prerelease --preid=beta  # 2.0.0 → 2.0.0-beta.0
```

### GitHub Release

Mark as "Pre-release" checkbox when creating release.

---

## Tools

### Automatic Changelog Generation

Use `standard-version` for automation:

```bash
npm install --save-dev standard-version

# Add to package.json
{
  "scripts": {
    "release": "standard-version"
  }
}

# Run
npm run release  # Auto-increments version, updates CHANGELOG
```

### Check Current Version

```bash
# Backend
cd backend && npm version

# Frontend
cd frontend && npm version

# Or check package.json
cat backend/package.json | grep version
```

---

## Quick Reference

```bash
# Patch release (bug fixes)
npm version patch  # 2.1.0 → 2.1.1

# Minor release (new features)
npm version minor  # 2.1.0 → 2.2.0

# Major release (breaking changes)
npm version major  # 2.1.0 → 3.0.0

# Tag and push
git push origin main --tags

# View tags
git tag -l

# Delete tag (if mistake)
git tag -d v2.1.1
git push origin :refs/tags/v2.1.1
```

---

## Resources

- [Semantic Versioning Spec](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
