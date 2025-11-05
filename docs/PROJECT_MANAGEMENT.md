# Project Management with GitHub Projects

## Overview

GitHub Projects is a built-in project management tool that integrates seamlessly with your repository. It's perfect for solo developers and small teams.

---

## Setting Up Your First Project Board

### Step 1: Create a New Project

1. Go to your repository on GitHub
2. Click the **"Projects"** tab
3. Click **"New project"**
4. Choose template: **"Board"** or **"Table"** (Board recommended for solo dev)
5. Name it: `Nexus Development Board`
6. Click "Create"

### Step 2: Customize Your Board

Default columns in Board view:

- 📋 **Backlog** - Ideas and future tasks
- 🎯 **To Do** - Planned for current sprint/week
- 🚧 **In Progress** - Currently working on
- 👀 **In Review** - Awaiting review/testing
- ✅ **Done** - Completed tasks

You can customize these by clicking the "+" button to add more columns.

---

## Issue Templates

### User Story Template

```markdown
## User Story

As a [type of user], I want [goal] so that [benefit].

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Notes

- Implementation details
- Dependencies
- Potential challenges

## Definition of Done

- [ ] Code written and tested
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to staging/production
```

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Go to...
2. Click on...
3. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Version: [e.g., v2.1.0]

## Screenshots

If applicable

## Possible Fix

Suggestions if you have any

## Priority

- [ ] Critical (blocks users)
- [ ] High (major feature broken)
- [ ] Medium (annoying but workaround exists)
- [ ] Low (minor issue)
```

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature

## Problem Statement

What problem does this solve?

## Proposed Solution

How would you implement this?

## Alternatives Considered

Other ways to solve this

## User Impact

Who benefits and how?

## Priority

- [ ] Must have (critical for launch)
- [ ] Should have (important but not critical)
- [ ] Nice to have (enhance UX)
- [ ] Future consideration

## Effort Estimate

- [ ] Small (< 1 day)
- [ ] Medium (1-3 days)
- [ ] Large (> 3 days)
```

---

## Labels System

### Priority Labels

- 🔴 `priority: critical` - Drop everything, fix now
- 🟠 `priority: high` - Fix this sprint/week
- 🟡 `priority: medium` - Fix soon
- 🟢 `priority: low` - Nice to have

### Type Labels

- ✨ `type: feature` - New feature
- 🐛 `type: bug` - Bug fix
- 📚 `type: documentation` - Documentation
- 🔧 `type: refactor` - Code refactoring
- 🎨 `type: design` - UI/UX improvements
- ⚡ `type: performance` - Performance optimization
- 🔒 `type: security` - Security fix
- 🧪 `type: testing` - Tests

### Status Labels

- 🚧 `status: in-progress` - Being worked on
- 👀 `status: needs-review` - Ready for review
- ⏸️ `status: blocked` - Blocked by dependency
- ❓ `status: needs-info` - Need more information
- 🎯 `status: ready` - Ready to start

### Domain Labels (for your Nexus project)

- 🔐 `domain: auth` - Authentication/Authorization
- 📊 `domain: analytics` - Analytics features
- 📄 `domain: cv-intelligence` - CV/Resume processing
- 📅 `domain: interviews` - Interview coordinator
- 🎫 `domain: support` - Support tickets
- 💾 `domain: database` - Database related
- 🎨 `domain: frontend` - Frontend changes
- 🔧 `domain: backend` - Backend changes

### Effort Labels

- 🟣 `effort: xs` - < 1 hour
- 🔵 `effort: small` - 1-4 hours
- 🟢 `effort: medium` - 1-2 days
- 🟡 `effort: large` - 3-5 days
- 🔴 `effort: xl` - > 1 week

---

## Creating Issues from Template

### Example: User Story Issue

**Title:** `[Feature] Add email notifications for interview reminders`

**Body:**

```markdown
## User Story

As a **hiring manager**, I want **to receive email notifications 24 hours before interviews** so that **I never miss scheduled interviews**.

## Acceptance Criteria

- [ ] Email sent 24h before interview start time
- [ ] Email includes interview details (candidate, time, meeting link)
- [ ] User can opt-in/opt-out in preferences
- [ ] Email template is professional and branded
- [ ] Works for both Google Calendar and Outlook users

## Technical Notes

- Use existing email service in `backend/services/emailService.js`
- Create new email template for interview reminders
- Add cron job or database trigger for 24h check
- Update `user_preferences` table for notification settings

## Definition of Done

- [ ] Backend endpoint implemented
- [ ] Email template created
- [ ] User preferences UI added
- [ ] Tests written and passing
- [ ] Tested with real Gmail/Outlook accounts
- [ ] Documentation updated
- [ ] Deployed to production
```

**Labels:** `type: feature`, `priority: high`, `domain: interviews`, `effort: medium`

**Assignees:** Yourself

**Project:** Nexus Development Board

**Milestone:** v2.2.0 (if using milestones)

---

## Task Breakdown Example

For large features, break into smaller tasks:

### Epic: "Email Notification System"

**Parent Issue:** `#45 - Add email notifications`

**Sub-tasks:**

1. `#46 - Set up email templates`
2. `#47 - Create notification preferences table`
3. `#48 - Build notification service`
4. `#49 - Add user preferences UI`
5. `#50 - Implement interview reminder job`
6. `#51 - Add tests for notification system`

Link sub-tasks in parent issue:

```markdown
## Related Issues

- #46
- #47
- #48
- #49
- #50
- #51
```

---

## Weekly Planning Workflow

### Monday Morning Planning

1. **Review Backlog**
   - Look at all issues in Backlog column
   - Prioritize top 5-10 for the week

2. **Move to "To Do"**
   - Drag prioritized issues to "To Do" column
   - Assign effort estimates
   - Add any missing labels

3. **Plan Daily Tasks**
   - Pick 1-3 issues for today
   - Move to "In Progress"
   - Create branch and start work

### Daily Workflow

**Morning:**

- Review "In Progress" column
- Pick today's task
- Create branch: `git checkout -b feature/task-name`

**During Day:**

- Update issue with progress comments
- Move between columns as needed
- Link commits to issues: Use `#issue-number` in commits

**Evening:**

- Push changes
- Update issue status
- Move to "In Review" if ready

### Friday Afternoon Review

1. **Review "Done"**
   - Celebrate completed tasks!
   - Close issues that are fully done

2. **Review "In Progress"**
   - Any blockers?
   - Will they be done this week?

3. **Plan Next Week**
   - Add new issues to Backlog
   - Prioritize for Monday

---

## Linking Issues to Code

### In Commit Messages

```bash
git commit -m "feat(interviews): add email reminders

Implements 24h email notifications for scheduled interviews.

Closes #45
Refs #46, #47"
```

### In Pull Requests

```markdown
## Related Issues

Closes #45
Closes #46

## Description

Implements email notification system...
```

### In Code Comments

```javascript
// TODO(#52): Refactor this function to use async/await
// FIXME(#53): Handle edge case when user has no email
// NOTE(#54): This will be replaced by notification service
```

---

## Project Board Views

### Board View (Recommended for Solo Dev)

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Backlog  │ To Do    │ Progress │ Review   │ Done     │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ Issue #1 │ Issue #5 │ Issue #8 │ Issue #9 │ Issue #10│
│ Issue #2 │ Issue #6 │          │          │ Issue #11│
│ Issue #3 │ Issue #7 │          │          │ Issue #12│
│ Issue #4 │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Table View (for Detailed Overview)

Columns: Title, Status, Priority, Labels, Assignee, Effort, Created

Use filters:

- Show only: `type: feature`
- Show only: `priority: high`
- Show only: `domain: auth`

---

## Automation with GitHub Projects (Beta)

### Auto-move Cards

**When issue/PR is created:**
→ Move to "Backlog"

**When PR is opened:**
→ Move to "In Review"

**When PR is merged:**
→ Move to "Done"

**When issue is closed:**
→ Move to "Done"

Set these up in Project settings → Workflows

---

## Using Milestones for Releases

### Create Milestones for Versions

**Example: v2.2.0 - Email Notifications**

- Due date: February 15, 2025
- Description: Add comprehensive email notification system
- Issues: #45, #46, #47, #48, #49

**Benefits:**

- Track progress toward release
- See completion percentage
- Group related features

---

## Sprint Planning (Optional for Solo Dev)

### 1-Week Sprint Example

**Monday:**

- Sprint planning (1 hour)
- Pick 5-10 issues for the week
- Move to "To Do"

**Tuesday-Thursday:**

- Development
- Daily standup with yourself (5 min journal)
- Update issues

**Friday:**

- Code review and testing
- Sprint retrospective (15 min)
- What went well? What to improve?

---

## Sample Issues for Nexus Project

### Current Sprint Example

```markdown
**Sprint Goal:** Improve Analytics Dashboard

Issues:

1. #60 - Add user activity chart (effort: medium, priority: high)
2. #61 - Export analytics to CSV (effort: small, priority: medium)
3. #62 - Fix analytics date range bug (effort: small, priority: high)
4. #63 - Add real-time metrics (effort: large, priority: low)
5. #64 - Optimize analytics queries (effort: medium, priority: medium)
```

---

## Best Practices

1. ✅ **Create issues for everything** - Even small tasks
2. ✅ **Use descriptive titles** - "Fix login bug" not "Bug fix"
3. ✅ **Add context** - Screenshots, error messages, steps
4. ✅ **Link related issues** - Use `#issue-number`
5. ✅ **Update regularly** - Comment on progress
6. ✅ **Close completed issues** - Keep board clean
7. ✅ **Use labels consistently** - Makes filtering easier
8. ✅ **Break large tasks** - Max 3-5 days per issue
9. ✅ **Celebrate wins** - Review "Done" column weekly
10. ✅ **Regular grooming** - Clean backlog monthly

---

## Quick Reference

### Creating an Issue

```
Repository → Issues → New issue → Choose template
```

### Adding to Project

```
Issue → Projects → Nexus Development Board
```

### Linking in Commit

```bash
git commit -m "fix: resolve issue #42"
```

### Linking in PR

```markdown
Closes #42
Fixes #43
Resolves #44
```

### Filtering Issues

```
is:issue is:open label:"type: feature" label:"priority: high"
```

### Assigning to Yourself

```
Issue → Assignees → Assign yourself
```

---

## Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Issues Guide](https://guides.github.com/features/issues/)
- [Agile for Solo Developers](https://www.agilealliance.org/)
