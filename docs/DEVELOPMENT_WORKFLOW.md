# Development Workflow Guide

## Overview

This guide explains how to properly handle bugs, features, and improvements in the Nexus project.

---

## 1. Reporting Issues

### When to Create an Issue

✅ **DO create an issue for:**

- Bugs or errors you discover
- Features you want to add
- Performance problems
- Security vulnerabilities
- Documentation improvements
- UI/UX improvements

❌ **DON'T create an issue for:**

- Questions (use Discussions or ask directly)
- General feedback (use Discussions)
- Already reported issues (search first!)

### How to Create an Issue

1. **Go to GitHub Issues tab**
   - https://github.com/simplyarfan/Nexus/issues

2. **Search for existing issues first**
   - Use the search bar to check if someone already reported it
   - If found, add a comment with additional context

3. **Click "New issue"**
   - Choose template: Bug Report or Feature Request
   - Fill in all required fields
   - Add screenshots/logs if applicable
   - Set priority level

4. **Submit and track**
   - Issue will be assigned a number (e.g., #5)
   - You'll get notifications on updates
   - Can reference in commits: `Fix #5: Description`

---

## 2. Working on Issues

### Workflow Steps

```
Issue Created → Assigned → Branch Created → Work → PR → Review → Merge → Close Issue
```

### Step-by-Step Process

#### Step 1: Pick an Issue

- Browse open issues with labels: `bug`, `enhancement`, `good first issue`
- Comment "I'll work on this" to claim it
- Get assigned by maintainer

#### Step 2: Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/issue-5-fix-outlook-oauth
```

**Branch naming convention:**

- `feature/issue-{number}-{short-description}` - New features
- `fix/issue-{number}-{short-description}` - Bug fixes
- `docs/issue-{number}-{short-description}` - Documentation
- `refactor/issue-{number}-{short-description}` - Code improvements

#### Step 3: Make Changes

- Work on the issue
- Test locally
- Follow code style (ESLint + Prettier)
- Write clear commit messages

#### Step 4: Commit with Issue Reference

```bash
git add .
git commit -m "Fix: Resolve Outlook OAuth redirect issue

- Updated redirect URI in Azure configuration
- Added missing environment variables
- Tested with user consent flow

Fixes #5

🚀 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Key points:**

- Use `Fixes #5` or `Closes #5` to auto-close issue when merged
- Use `Relates to #5` if it doesn't fully close the issue

#### Step 5: Push and Create PR

```bash
git push origin feature/issue-5-fix-outlook-oauth
```

Then create PR on GitHub with:

- Clear title referencing issue: `Fix #5: Resolve Outlook OAuth redirect issue`
- Description explaining changes
- Link to issue: `Fixes #5`
- Screenshots/videos if UI changes

#### Step 6: Code Review

- Wait for CI checks to pass
- Address review comments if any
- Make additional commits if needed

#### Step 7: Merge

- Squash and merge (or regular merge)
- Delete feature branch after merge
- Issue automatically closes

---

## 3. Issue Labels

### Priority Labels

- 🔴 `priority: critical` - Breaks core functionality, needs immediate fix
- 🟡 `priority: high` - Important but not blocking
- 🟢 `priority: medium` - Nice to have, can wait
- ⚪ `priority: low` - Cosmetic or future consideration

### Type Labels

- 🐛 `bug` - Something isn't working
- ✨ `enhancement` - New feature or request
- 📚 `documentation` - Improvements to docs
- 🔧 `maintenance` - Code refactoring, dependencies
- 🎨 `UI/UX` - Design improvements
- 🚀 `performance` - Speed/optimization
- 🔒 `security` - Security-related

### Status Labels

- 🆕 `status: new` - Just created, needs triage
- 📋 `status: backlog` - Acknowledged, queued for future
- 🏗️ `status: in-progress` - Someone is working on it
- 👀 `status: review` - PR submitted, under review
- ✅ `status: done` - Completed and merged

### Effort Labels

- `effort: small` - < 1 hour
- `effort: medium` - 1-4 hours
- `effort: large` - 1+ days

---

## 4. Commit Message Guidelines

### Format

```
Type: Short summary (50 chars max)

- Bullet point 1
- Bullet point 2
- Bullet point 3

References #issue_number

🚀 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Types

- `Fix:` - Bug fix
- `Feat:` - New feature
- `Docs:` - Documentation changes
- `Style:` - Formatting, no code change
- `Refactor:` - Code restructuring
- `Test:` - Adding tests
- `Chore:` - Maintenance tasks

### Examples

**Good commit messages:**

```
✅ Fix: Resolve 404 error on CV batch detail page (#23)

- Added null check for batch data
- Improved error handling in API call
- Added loading state during fetch

Fixes #23
```

```
✅ Feat: Add email notification for interview reminders (#45)

- Implemented Outlook integration
- Created email templates
- Added reminder scheduling logic
- Tested with Gmail and Outlook

Closes #45
```

**Bad commit messages:**

```
❌ fixed stuff
❌ update
❌ changes
❌ wip
```

---

## 5. Pull Request Guidelines

### PR Title Format

```
Type #IssueNumber: Clear description
```

**Examples:**

- `Fix #23: Resolve 404 error on CV batch detail page`
- `Feat #45: Add email notifications for interview reminders`
- `Docs #67: Update Outlook OAuth setup guide`

### PR Description Template

```markdown
## Description

Brief summary of what this PR does.

## Related Issue

Fixes #23

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Tested locally
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds

## Screenshots (if applicable)

[Add screenshots/videos]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] No breaking changes
- [ ] Added tests (if applicable)
```

---

## 6. Code Review Process

### For PR Author

1. **Before requesting review:**
   - All CI checks must pass ✅
   - Code is tested locally
   - Self-reviewed for obvious issues
   - Documentation updated if needed

2. **During review:**
   - Respond to all comments
   - Make requested changes
   - Push additional commits
   - Mark conversations as resolved

3. **After approval:**
   - Squash commits if messy history
   - Merge PR
   - Delete feature branch

### For Reviewer

**What to check:**

- ✅ Code quality and readability
- ✅ Follows project conventions
- ✅ No security vulnerabilities
- ✅ Tests included (if applicable)
- ✅ Documentation updated
- ✅ No breaking changes without discussion
- ✅ Performance considerations

**Review etiquette:**

- Be constructive and respectful
- Explain **why** changes are needed
- Suggest alternatives
- Approve if minor issues remain
- Request changes if major issues

---

## 7. Working with Claude Code

### When to Ask Claude

✅ **Good use cases:**

- Implementing new features
- Fixing bugs with errors/logs
- Code refactoring
- Writing tests
- Updating documentation
- Optimizing performance
- Setting up integrations

### How to Ask Effectively

**Good prompts:**

```
"I'm getting this error when connecting Outlook OAuth: [error message].
Here's the screenshot. Can you help debug?"

"I need to add a new feature for bulk email sending. It should:
1. Accept CSV of recipients
2. Send personalized emails
3. Track delivery status
Can you help implement this?"
```

**Bad prompts:**

```
"Fix my code"  ❌ (too vague)
"It's broken"  ❌ (no context)
```

### Sharing Context

Always provide:

1. **Error messages** (full text or screenshot)
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Relevant code files** (if known)
5. **Environment** (local dev, staging, production)

---

## 8. Emergency Hotfixes

### When to Use Hotfix Branch

🚨 **Only for critical production bugs:**

- Site is down
- Security vulnerability
- Data loss risk
- Payment processing broken

### Hotfix Process (Fast-Track)

1. **Create hotfix branch from main:**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-oauth-redirect
   ```

2. **Fix the issue quickly:**

   ```bash
   # Make minimal changes to fix the issue
   git add .
   git commit -m "Hotfix: Critical OAuth redirect issue"
   git push origin hotfix/critical-oauth-redirect
   ```

3. **Create PR with `[HOTFIX]` prefix:**

   ```
   Title: [HOTFIX] Fix critical OAuth redirect issue
   ```

4. **Bypass normal review process:**
   - Get emergency approval
   - Merge immediately
   - Monitor production closely

5. **Follow up:**
   - Create issue to investigate root cause
   - Add tests to prevent recurrence
   - Document in post-mortem

---

## 9. Release Process

### Version Numbering (Semantic Versioning)

```
v1.2.3
  │ │ │
  │ │ └── Patch (bug fixes)
  │ └──── Minor (new features, backward compatible)
  └────── Major (breaking changes)
```

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped in package.json
- [ ] Create GitHub release with notes
- [ ] Tag release: `git tag v1.2.3`
- [ ] Deploy to production
- [ ] Monitor for issues

---

## 10. Best Practices

### Do's ✅

- Write clear, descriptive commit messages
- Test changes locally before pushing
- Keep PRs small and focused (< 500 lines)
- Link commits/PRs to issues
- Update documentation with code changes
- Ask for help when stuck
- Review others' code constructively

### Don'ts ❌

- Don't commit directly to main (use PR workflow)
- Don't commit secrets/credentials
- Don't leave commented-out code
- Don't push untested code
- Don't ignore CI failures
- Don't make massive PRs (split them up)
- Don't rewrite public commit history

---

## 11. Getting Help

### Options

1. **GitHub Issues** - Report bugs or request features
2. **GitHub Discussions** - Ask questions, general chat
3. **Claude Code** - Get AI-powered development help
4. **Code Comments** - Leave inline questions in PR
5. **Team Chat** - Slack/Discord for quick questions

### When to Use Each

- **Issue:** "Login button broken on mobile" 🐛
- **Discussion:** "What's the best way to structure this feature?" 💬
- **Claude:** "Help me implement OAuth flow" 🤖
- **PR Comment:** "Why did you choose this approach?" 💭
- **Chat:** "Quick question about environment setup" ⚡

---

## Quick Reference

### Common Commands

```bash
# Start working on issue
git checkout main
git pull origin main
git checkout -b feature/issue-42-new-feature

# Make changes and commit
git add .
git commit -m "Feat: Add new feature

Fixes #42"

# Push and create PR
git push origin feature/issue-42-new-feature
# Then create PR on GitHub

# Update branch with latest main
git checkout main
git pull origin main
git checkout feature/issue-42-new-feature
git merge main

# Squash commits before merging
git rebase -i HEAD~3  # Squash last 3 commits
```

### Issue Templates

- Bug Report: `.github/ISSUE_TEMPLATE/bug_report.md`
- Feature Request: `.github/ISSUE_TEMPLATE/feature_request.md`

### Resources

- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)

---

## Summary

**The Golden Rule:** Always work in feature branches, never commit directly to main.

**The Workflow:**

1. 📝 Create/find issue
2. 🌿 Create feature branch
3. 💻 Make changes
4. ✅ Test locally
5. 📤 Push and create PR
6. 👀 Get review
7. 🎉 Merge and close issue

**Remember:** Good workflow = Happy team = Quality code! 🚀
