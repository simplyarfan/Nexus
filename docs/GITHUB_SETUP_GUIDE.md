# GitHub Repository Setup Guide

## Step-by-Step Configuration for Professional Workflow

### 1. Branch Protection Rules

**Path:** `Settings` → `Branches` → `Add rule`

**For `main` branch:**

```yaml
Branch name pattern: main

Protection settings:
  ✅ Require a pull request before merging
     - Required approvals: 0 (or 1 for self-review discipline)
     - ✅ Dismiss stale pull request approvals

  ✅ Require status checks to pass before merging
     - ✅ Require branches to be up to date
     - Status checks: CI, lint (after we set up GitHub Actions)

  ✅ Require conversation resolution before merging
  ✅ Include administrators
  ⬜ Allow force pushes (DISABLED)
  ⬜ Allow deletions (DISABLED)
```

**Screenshot of where to go:**

1. GitHub.com → Your Repository
2. Click "Settings" tab (top right)
3. Click "Branches" in left sidebar
4. Click "Add rule" button
5. Follow the settings above

---

### 2. Enable GitHub Issues

**Path:** `Settings` → `General` → `Features`

- ✅ Issues
- ✅ Projects (for project boards)
- ✅ Wikis (optional)
- ✅ Discussions (optional for solo dev)

---

### 3. Set Default Branch

**Path:** `Settings` → `General` → `Default branch`

- Ensure `main` is the default branch
- Click "Switch to another branch" if needed

---

### 4. Configure Merge Button

**Path:** `Settings` → `General` → `Pull Requests`

```yaml
✅ Allow squash merging (RECOMMENDED for solo dev)
   Default commit message: Pull request title

⬜ Allow merge commits (optional)
⬜ Allow rebase merging (optional)

✅ Automatically delete head branches (RECOMMENDED)
   - Keeps repo clean after PR merge
```

---

### 5. Enable GitHub Actions

**Path:** `Settings` → `Actions` → `General`

```yaml
Actions permissions: ⦿ Allow all actions and reusable workflows (RECOMMENDED)

Workflow permissions: ⦿ Read and write permissions
  ✅ Allow GitHub Actions to create and approve pull requests
```

---

### 6. Set Up Repository Topics (for discoverability)

**Path:** Repository main page → About section (top right) → ⚙️

Add topics:

- `enterprise-ai`
- `express-js`
- `nextjs`
- `postgresql`
- `jwt-authentication`
- `saas-platform`
- `cv-intelligence`
- `interview-coordinator`

---

### 7. Configure Notifications (Personal Settings)

**Path:** Your Profile → `Settings` → `Notifications`

For solo dev:

- ✅ Email notifications for: Pull requests, Issues
- ✅ Web notifications
- Choose frequency: Real-time or Daily digest

---

### 8. Set Up Repository Secrets (for CI/CD)

**Path:** `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add secrets (we'll use these in GitHub Actions):

- `DATABASE_URL` (test database, NOT production)
- Any other test environment variables

**Note:** Never commit production secrets to GitHub!

---

## Verification Checklist

After setup, verify:

- [ ] Branch protection rules active on `main`
- [ ] Issues enabled
- [ ] Projects enabled
- [ ] Auto-delete head branches enabled
- [ ] GitHub Actions enabled
- [ ] Repository topics added
- [ ] Templates created (.github folder)

---

## Next Steps

1. Create your first branch: `git checkout -b feature/initial-setup`
2. Make a change, commit, and push
3. Create your first Pull Request
4. Practice the workflow!

---

## Useful GitHub URLs for Your Repo

Replace `USERNAME` and `REPO` with your details:

- Repository: `https://github.com/USERNAME/REPO`
- Settings: `https://github.com/USERNAME/REPO/settings`
- Branch Protection: `https://github.com/USERNAME/REPO/settings/branches`
- Actions: `https://github.com/USERNAME/REPO/actions`
- Projects: `https://github.com/USERNAME/REPO/projects`
- Issues: `https://github.com/USERNAME/REPO/issues`
- Pull Requests: `https://github.com/USERNAME/REPO/pulls`
