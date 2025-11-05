# Git Workflow Guide - GitHub Flow

## Overview

This project uses **GitHub Flow** - a simple, branch-based workflow that supports teams and projects where deployments are made regularly.

## Branching Strategy

```
main (production-ready code)
├── feature/user-analytics-dashboard
├── feature/email-notifications
├── fix/login-redirect-bug
└── hotfix/critical-security-patch
```

### Branch Types

| Prefix      | Purpose                      | Example                 | Lifespan                  |
| ----------- | ---------------------------- | ----------------------- | ------------------------- |
| `feature/`  | New features or enhancements | `feature/add-2fa`       | Short (1-7 days)          |
| `fix/`      | Bug fixes                    | `fix/login-error`       | Very short (hours-2 days) |
| `hotfix/`   | Critical production fixes    | `hotfix/security-patch` | Immediate (hours)         |
| `docs/`     | Documentation only           | `docs/update-readme`    | Very short                |
| `refactor/` | Code refactoring             | `refactor/auth-service` | Short (2-5 days)          |
| `test/`     | Adding tests                 | `test/auth-controller`  | Short                     |
| `chore/`    | Maintenance tasks            | `chore/update-deps`     | Short                     |

---

## Workflow Steps

### 1. Create a Branch

Always branch from `main`:

```bash
# Make sure you're on main and it's up to date
git checkout main
git pull origin main

# Create and switch to new branch
git checkout -b feature/your-feature-name

# Examples:
git checkout -b feature/add-analytics-export
git checkout -b fix/email-verification-bug
git checkout -b hotfix/database-connection
```

### 2. Make Changes & Commit

Follow **Conventional Commits** format:

```bash
# Make your changes
# Then stage and commit

git add .
git commit -m "feat: add analytics export functionality"

# More examples:
git commit -m "fix: resolve email verification timeout"
git commit -m "docs: update API documentation for analytics"
git commit -m "refactor: optimize database queries in auth service"
git commit -m "test: add unit tests for support controller"
git commit -m "chore: update dependencies to latest versions"
```

### 3. Push Branch to GitHub

```bash
git push origin feature/your-feature-name

# If it's your first push on this branch:
git push -u origin feature/your-feature-name
```

### 4. Create Pull Request

1. Go to GitHub repository
2. Click "Pull requests" → "New pull request"
3. Select your branch
4. Fill in PR template (we'll create this)
5. Add labels (feature, bug, documentation, etc.)
6. Request review (if working with others)
7. Link related issues

### 5. Code Review & Testing

- Review your own code first
- Run tests locally: `npm test`
- Check CI/CD pipeline passes
- Address any review comments
- Make additional commits if needed

### 6. Merge to Main

Once approved and tests pass:

1. **Squash and merge** (RECOMMENDED for solo dev) - Combines all commits into one
2. **Merge commit** - Keeps all commits
3. **Rebase and merge** - Linear history

For solo development: Use **Squash and merge**

### 7. Delete Branch

After merging, delete the branch:

```bash
git checkout main
git pull origin main
git branch -d feature/your-feature-name  # Delete local branch
```

GitHub will prompt to delete the remote branch after PR merge.

---

## Commit Message Convention

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description                     | Example                                |
| ---------- | ------------------------------- | -------------------------------------- |
| `feat`     | New feature                     | `feat: add email notifications`        |
| `fix`      | Bug fix                         | `fix: resolve login timeout`           |
| `docs`     | Documentation                   | `docs: update installation guide`      |
| `style`    | Formatting, missing semi-colons | `style: format code with prettier`     |
| `refactor` | Code restructuring              | `refactor: simplify auth logic`        |
| `test`     | Adding tests                    | `test: add CV upload tests`            |
| `chore`    | Maintenance                     | `chore: update npm packages`           |
| `perf`     | Performance improvement         | `perf: optimize database queries`      |
| `ci`       | CI/CD changes                   | `ci: add automated testing workflow`   |
| `build`    | Build system changes            | `build: update webpack config`         |
| `revert`   | Revert previous commit          | `revert: revert feat(auth): add OAuth` |

### Examples

```bash
# Simple commit
git commit -m "feat: add password reset functionality"

# With scope
git commit -m "fix(auth): resolve token expiry bug"

# With body (multi-line)
git commit -m "feat(analytics): add user behavior tracking

- Track page views
- Track API usage
- Add export functionality
- Create admin dashboard widget"

# Breaking change
git commit -m "feat(api): change authentication response format

BREAKING CHANGE: API now returns tokens in nested object instead of root level"
```

---

## Branch Protection Rules (GitHub Settings)

To enforce this workflow, set up branch protection on GitHub:

### Steps to Configure:

1. Go to your GitHub repository
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **Add rule**
4. Configure for `main` branch:

### Recommended Settings for Solo Dev:

#### Basic Protection

- ✅ **Require a pull request before merging**
  - ⬜ Require approvals: 0 (you're solo, but keeps discipline)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (optional)

#### Status Checks

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Select checks: `CI` (we'll set this up with GitHub Actions)

#### Additional Rules

- ✅ **Require conversation resolution before merging**
- ✅ **Require signed commits** (optional, for extra security)
- ✅ **Include administrators** (enforce rules on yourself too!)
- ⬜ **Allow force pushes** (DISABLED)
- ⬜ **Allow deletions** (DISABLED)

### Screenshot Guide

```
┌─────────────────────────────────────────┐
│ Branch protection rules for main        │
├─────────────────────────────────────────┤
│ ✅ Require pull request                 │
│    Required approvals: 0                │
│                                         │
│ ✅ Require status checks                │
│    ☑ CI                                 │
│    ☑ lint                               │
│                                         │
│ ✅ Require conversation resolution      │
│ ✅ Include administrators               │
│ ⬜ Allow force pushes                   │
│ ⬜ Allow deletions                      │
└─────────────────────────────────────────┘
```

---

## Hotfix Workflow (Emergency Production Fixes)

For critical bugs in production:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. Make the fix
# ... make changes ...
git commit -m "hotfix: patch SQL injection vulnerability"

# 3. Push and create PR immediately
git push -u origin hotfix/critical-security-fix

# 4. Fast-track review and merge
# 5. Deploy immediately

# 6. Clean up
git checkout main
git pull origin main
git branch -d hotfix/critical-security-fix
```

---

## Release Workflow

### Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH` (e.g., `2.1.3`)

- **MAJOR**: Breaking changes (e.g., `1.x.x` → `2.0.0`)
- **MINOR**: New features, backward-compatible (e.g., `2.0.x` → `2.1.0`)
- **PATCH**: Bug fixes, backward-compatible (e.g., `2.1.0` → `2.1.1`)

### Creating a Release

```bash
# 1. Update version in package.json files
cd backend && npm version patch  # or minor, or major
cd frontend && npm version patch

# 2. Update CHANGELOG.md
# ... document changes ...

# 3. Commit version bump
git add .
git commit -m "chore: bump version to 2.1.3"

# 4. Tag the release
git tag -a v2.1.3 -m "Release version 2.1.3"

# 5. Push with tags
git push origin main --tags

# 6. Create GitHub Release
# Go to GitHub → Releases → Create new release
# Select tag v2.1.3
# Add release notes from CHANGELOG
```

---

## Daily Workflow Example

### Morning:

```bash
git checkout main
git pull origin main
git checkout -b feature/add-email-templates
```

### During Development:

```bash
# Make changes
git add .
git commit -m "feat(notifications): add email template system"

# More changes
git add .
git commit -m "feat(notifications): add welcome email template"

# Push when ready
git push -u origin feature/add-email-templates
```

### End of Day (or when feature complete):

```bash
# Push final changes
git push origin feature/add-email-templates

# Go to GitHub and create Pull Request
# Review your own code
# Merge when tests pass
```

### After Merge:

```bash
git checkout main
git pull origin main
git branch -d feature/add-email-templates
```

---

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch with latest main
git checkout feature/your-feature
git fetch origin
git merge origin/main

# Resolve conflicts in your editor
# Then:
git add .
git commit -m "fix: resolve merge conflicts"
git push origin feature/your-feature
```

### Accidentally Committed to Main

```bash
# Don't panic! Create a branch from current state
git branch feature/accidental-changes

# Reset main to remote
git checkout main
git reset --hard origin/main

# Continue work on the new branch
git checkout feature/accidental-changes
```

### Need to Update Branch with Latest Main

```bash
# Option 1: Merge (creates merge commit)
git checkout feature/your-feature
git merge main

# Option 2: Rebase (cleaner history, RECOMMENDED)
git checkout feature/your-feature
git rebase main
# If conflicts, resolve and: git rebase --continue
git push --force-with-lease origin feature/your-feature
```

---

## Best Practices

1. ✅ **Always pull before creating a new branch**
2. ✅ **Keep branches short-lived** (1-7 days max)
3. ✅ **One feature per branch** (don't mix unrelated changes)
4. ✅ **Commit often** with meaningful messages
5. ✅ **Push daily** (backup + transparency)
6. ✅ **Review your own PR** before asking others
7. ✅ **Delete merged branches** (keep repo clean)
8. ✅ **Never commit secrets** (.env files, API keys)
9. ✅ **Test locally before pushing**
10. ✅ **Keep commits atomic** (one logical change per commit)

---

## Quick Reference

```bash
# Start new feature
git checkout main && git pull && git checkout -b feature/name

# Commit changes
git add . && git commit -m "feat: description"

# Push to GitHub
git push -u origin feature/name

# Update branch with main
git checkout feature/name && git rebase main

# After merge
git checkout main && git pull && git branch -d feature/name

# View all branches
git branch -a

# View commit history
git log --oneline --graph --all

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git reset --hard HEAD
```

---

## Resources

- [GitHub Flow Guide](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)
