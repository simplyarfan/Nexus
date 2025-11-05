# Complete Step-by-Step Walkthrough - Start to Finish

## Before You Start

### What You'll Need:

- ✅ GitHub account with your Nexus repository
- ✅ Terminal/Command line access
- ✅ VS Code (or your preferred editor)
- ✅ 30-40 minutes of uninterrupted time

### Where You Are Right Now:

- You're in: `/Users/syedarfan/Documents/Projects/webpages:webapps/nexus`
- You have all the files I just created
- Now we'll configure everything and test it!

---

# PHASE 1: GitHub Configuration (10-15 minutes)

## Part 1A: Set Up Branch Protection Rules

### Why This Matters:

Branch protection prevents you from accidentally pushing directly to `main`. It forces you to use Pull Requests, which is a professional best practice.

### Step-by-Step:

#### Step 1: Open Your GitHub Repository

1. **Open your web browser** (Chrome, Safari, Firefox, etc.)

2. **Go to GitHub.com** and log in

3. **Navigate to your Nexus repository**
   - URL format: `https://github.com/YOUR-USERNAME/nexus`
   - Replace `YOUR-USERNAME` with your actual GitHub username
   - Example: `https://github.com/johndoe/nexus`

4. **You should see:**
   - Repository name at top: `YOUR-USERNAME/nexus`
   - Code, Issues, Pull requests tabs
   - Green "Code" button

---

#### Step 2: Go to Settings

1. **Click the "Settings" tab**
   - It's on the far right of the top menu
   - Between "Insights" and "Security"
   - ⚠️ **If you don't see Settings**: You might not be the repo owner or have admin access

2. **You should now see:**
   - Left sidebar with many options
   - "General" selected by default
   - Repository settings in the main area

---

#### Step 3: Access Branch Protection

1. **In the left sidebar, find "Branches"**
   - Under "Code and automation" section
   - Click on **"Branches"**

2. **You should see:**
   - "Branch protection rules" section
   - "Add rule" or "Add branch protection rule" button
   - Possibly empty (no rules yet) or existing rules

---

#### Step 4: Create Protection Rule for Main Branch

1. **Click the green "Add rule" button**
   - Or "Add branch protection rule" button

2. **You'll see a form with many options**

3. **In "Branch name pattern" field, type:**
   ```
   main
   ```

   - Just the word "main" (lowercase)
   - This applies the rule to your main branch

---

#### Step 5: Configure Protection Settings

Now scroll down and enable these checkboxes:

**CHECK THESE BOXES:**

**1. ✅ Require a pull request before merging**

- Find this checkbox
- Click it to enable
- It will expand to show more options

**Under this, you'll see:**

- **"Required approvals"** - Set to `0` (since you're solo)
  - Click the dropdown
  - Select `0`
  - (Later when working with others, set to 1 or more)

- ✅ **Check: "Dismiss stale pull request approvals when new commits are pushed"**
  - This ensures if you push new code, old approvals don't count

**2. ✅ Require status checks to pass before merging**

- Find this checkbox
- Click to enable
- It will expand

**Under this:**

- ✅ **Check: "Require branches to be up to date before merging"**
- **Status checks to require:**
  - You might see a search box
  - Type: `CI` or `lint`
  - ⚠️ **NOTE**: These won't show up until you run GitHub Actions for the first time
  - **For now, just check the main box, we'll add specific checks later**

**3. ✅ Require conversation resolution before merging**

- Scroll down to find this
- Check the box
- This means all PR comments must be resolved before merging

**4. ✅ Include administrators**

- Very important! This applies rules to YOU too
- Forces you to follow your own rules (good discipline!)
- Check this box

**5. ⬜ Allow force pushes - LEAVE UNCHECKED**

- Do NOT check this
- Force pushes are dangerous and can lose code

**6. ⬜ Allow deletions - LEAVE UNCHECKED**

- Do NOT check this
- Prevents accidental branch deletion

---

#### Step 6: Save the Rule

1. **Scroll to the very bottom of the page**

2. **Click the green "Create" button**
   - Button text might say "Create" or "Save changes"

3. **You should see:**
   - A success message at the top
   - Your new rule listed under "Branch protection rules"
   - The rule shows: `main` with a green checkmark

**🎉 Congratulations!** Your main branch is now protected!

---

## Part 1B: Enable GitHub Actions

### Why This Matters:

GitHub Actions runs your automated tests, linting, and builds every time you create a Pull Request.

### Step-by-Step:

#### Step 1: Navigate to Actions Settings

**You're already in Settings from the previous section, so:**

1. **In the left sidebar, scroll down to find "Actions"**
   - Under "Code and automation" section
   - Click on **"Actions"**
   - Then click on **"General"** (sub-item under Actions)

---

#### Step 2: Configure Actions Permissions

**You'll see several sections. Configure each:**

**Section 1: "Actions permissions"**

1. **Select the radio button:**
   ```
   ⦿ Allow all actions and reusable workflows
   ```

   - This allows GitHub Actions to run
   - Click this radio button

**Section 2: "Workflow permissions"**

1. **Select the radio button:**

   ```
   ⦿ Read and write permissions
   ```

   - This allows workflows to push changes if needed

2. **Check the box below it:**
   ```
   ✅ Allow GitHub Actions to create and approve pull requests
   ```

   - Check this box

---

#### Step 3: Save Actions Settings

1. **Scroll to the bottom**

2. **Click the green "Save" button**

3. **You should see:**
   - Success message
   - Settings saved

**🎉 GitHub Actions is now enabled!**

---

## Part 1C: Create GitHub Project Board

### Why This Matters:

This gives you a visual board to track your tasks (like Trello, but integrated with GitHub).

### Step-by-Step:

#### Step 1: Navigate to Projects

1. **Click on your repository name at the top**
   - This takes you back to the main repo page
   - Or just click the "Code" tab

2. **Click on the "Projects" tab**
   - It's in the top menu
   - Between "Security" and "Insights"

3. **You should see:**
   - "Link a project" or "Create a project" button
   - Possibly empty if no projects exist

---

#### Step 2: Create New Project

1. **Click the green "New project" button**
   - Or "Link a project" → "New project"

2. **You'll see a modal/popup with template options:**
   - Board
   - Table
   - Roadmap
   - Other templates

3. **Select "Board"**
   - Click on the "Board" template
   - This gives you a Kanban-style board

---

#### Step 3: Name Your Project

1. **In the "Project name" field, type:**

   ```
   Nexus Development Board
   ```

2. **Add a description (optional):**

   ```
   Task management and sprint planning for Nexus project
   ```

3. **Click "Create project" button**

---

#### Step 4: Customize Board Columns

**You'll now see your new board with default columns (Todo, In Progress, Done)**

**Let's add more columns for a complete workflow:**

1. **Click the "+" button** on the far right to add a column

2. **Add these columns in order:**
   - **Backlog** (if not already there)
   - **To Do** (if not already there)
   - **In Progress** (if not already there)
   - **In Review** (add this new one)
   - **Done** (if not already there)

**To add each column:**

- Click the **"+" button**
- Type the column name
- Press Enter
- Drag columns to reorder if needed

**Final column order (left to right):**

```
Backlog → To Do → In Progress → In Review → Done
```

---

#### Step 5: Configure Column Automation (Optional but Recommended)

1. **Click the "..." menu on the "In Progress" column**

2. **Select "Workflows"**

3. **Enable automation:**
   - When an issue is assigned → Move to "In Progress"
   - When PR is created → Move to "In Review"
   - When issue is closed → Move to "Done"

4. **Repeat for other columns as desired**

**🎉 Your Project Board is ready!**

---

## PHASE 1 CHECKPOINT ✅

**You should now have:**

- ✅ Branch protection on `main` branch
- ✅ GitHub Actions enabled
- ✅ Project board: "Nexus Development Board" with 5 columns

**Verification:**

- Go to Settings → Branches → See your rule
- Go to Settings → Actions → See "Allow all actions" selected
- Go to Projects → See "Nexus Development Board"

**Time Check:** You should be about 10-15 minutes in. Take a short break if needed! ☕

---

# PHASE 2: Code Quality Setup (10-15 minutes)

## Part 2A: Install Dependencies

### Why This Matters:

ESLint finds bugs and code issues. Prettier formats your code consistently. These are industry-standard tools.

### Step-by-Step:

#### Step 1: Open Terminal

**On Mac:**

1. Press `Cmd + Space`
2. Type "Terminal"
3. Press Enter

**On Windows:**

1. Press `Win + R`
2. Type "cmd" or "powershell"
3. Press Enter

**On Linux:**

1. Press `Ctrl + Alt + T`

---

#### Step 2: Navigate to Your Project

**In the terminal, type:**

```bash
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus
```

**Press Enter**

**Verify you're in the right place:**

```bash
ls
```

**You should see:**

```
CHANGELOG.md
CLAUDE.md
SETUP_CHECKLIST.md
backend/
docs/
frontend/
```

---

#### Step 3: Install Backend Dependencies

**Type these commands one by one:**

```bash
cd backend
```

Press Enter (you're now in the backend folder)

```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
```

Press Enter

**What you'll see:**

- Terminal will show "npm WARN" messages (normal!)
- Progress indicators
- "added X packages" message
- Takes 30-60 seconds

**Expected output (something like):**

```
added 150 packages, and audited 800 packages in 45s

found 0 vulnerabilities
```

⚠️ **If you see errors:**

- Make sure you're in the `backend` folder
- Check that `package.json` exists: `ls package.json`
- If Node.js is not installed, install it first from [nodejs.org](https://nodejs.org)

---

#### Step 4: Install Frontend Dependencies

**Type:**

```bash
cd ../frontend
```

Press Enter (moves from backend to frontend folder)

```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

Press Enter

**What you'll see:**

- Similar to backend
- Takes 30-60 seconds

**Expected output:**

```
added 4 packages, and audited 500 packages in 30s

found 0 vulnerabilities
```

**🎉 Dependencies installed!**

---

## Part 2B: Add Scripts to package.json

### Why This Matters:

These scripts let you run `npm run lint` and `npm run format` easily.

### Step-by-Step:

#### Step 1: Open Backend package.json

**In your terminal:**

```bash
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/backend
```

**Open VS Code:**

```bash
code package.json
```

Or open VS Code manually and open the file: `backend/package.json`

---

#### Step 2: Edit Backend Scripts

**Find the "scripts" section** (around line 6-12):

**Current scripts (something like):**

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "init-db": "node scripts/init-database.js",
  "seed-db": "node scripts/seed-database.js",
  "test": "echo \"Tests coming soon...\""
}
```

**ADD these new lines** (keep the existing ones, add these):

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "init-db": "node scripts/init-database.js",
  "seed-db": "node scripts/seed-database.js",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"**/*.{js,json,md}\"",
  "format:check": "prettier --check \"**/*.{js,json,md}\"",
  "test": "echo \"Tests coming soon...\""
}
```

**⚠️ Important:**

- Add a comma after each line except the last one
- Keep all existing scripts
- Just ADD the 4 new ones (lint, lint:fix, format, format:check)

**Save the file:**

- Press `Cmd + S` (Mac) or `Ctrl + S` (Windows/Linux)

---

#### Step 3: Edit Frontend Scripts

**Open:** `frontend/package.json`

**Find the "scripts" section:**

**Current:**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

**UPDATE to:**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "format": "prettier --write \"**/*.{js,jsx,json,md,css}\"",
  "format:check": "prettier --check \"**/*.{js,jsx,json,md,css}\""
}
```

**Save the file** (`Cmd + S` or `Ctrl + S`)

**🎉 Scripts added!**

---

## Part 2C: Format Your Code

### Step-by-Step:

**In your terminal:**

#### Step 1: Format Backend

```bash
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/backend
```

```bash
npm run format
```

**What you'll see:**

- List of files being formatted
- Takes 5-10 seconds

**Expected output:**

```
> ai-platform-backend@1.0.1 format
> prettier --write "**/*.{js,json,md}"

server.js 50ms
package.json 5ms
... (more files)
```

---

#### Step 2: Format Frontend

```bash
cd ../frontend
```

```bash
npm run format
```

**Expected output:**

```
> enterprise-ai-hub@2.0.0 format
> prettier --write "**/*.{js,jsx,json,md,css}"

package.json 5ms
next.config.js 10ms
... (more files)
```

**🎉 Code formatted!**

---

## Part 2D: Set Up VS Code Extensions

### Step-by-Step:

#### Step 1: Open VS Code

**If not already open:**

```bash
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus
code .
```

---

#### Step 2: Install ESLint Extension

1. **Click the Extensions icon** in the left sidebar
   - Or press `Cmd + Shift + X` (Mac) or `Ctrl + Shift + X` (Windows)

2. **In the search box, type:**

   ```
   ESLint
   ```

3. **You'll see "ESLint" by Microsoft (or Dirk Baeumer)**

4. **Click "Install"**

5. **Wait for installation** (5-10 seconds)

---

#### Step 3: Install Prettier Extension

**In the same Extensions search box:**

1. **Type:**

   ```
   Prettier
   ```

2. **Look for "Prettier - Code formatter" by Prettier**

3. **Click "Install"**

4. **Wait for installation**

---

#### Step 4: Configure VS Code Settings

**Create VS Code settings file:**

1. **In VS Code, press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P` (Windows)**

2. **Type:**

   ```
   Preferences: Open Settings (JSON)
   ```

3. **Press Enter**

4. **Add these settings** (paste at the end, before the closing `}`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"]
}
```

5. **Save the file** (`Cmd + S`)

**🎉 VS Code is configured!**

**Test it:**

1. Open any `.js` file
2. Make a messy change (add random spaces)
3. Press `Cmd + S` to save
4. Watch it auto-format! ✨

---

## PHASE 2 CHECKPOINT ✅

**You should now have:**

- ✅ ESLint and Prettier installed in both backend and frontend
- ✅ Scripts added to both package.json files
- ✅ Code formatted
- ✅ VS Code extensions installed and configured
- ✅ Auto-format on save working

**Verification:**

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

Both should complete without major errors (warnings are OK for now).

**Time Check:** You should be about 25-30 minutes in. Almost there! 💪

---

# PHASE 3: First Workflow Test (10-15 minutes)

## Why This Matters:

This tests the entire workflow end-to-end: branch → commit → push → PR → CI → merge

### Step-by-Step:

## Part 3A: Create Feature Branch

**In your terminal:**

#### Step 1: Go to Project Root

```bash
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus
```

---

#### Step 2: Make Sure You're on Main

```bash
git checkout main
```

**Expected output:**

```
Already on 'main'
```

or

```
Switched to branch 'main'
```

---

#### Step 3: Pull Latest Changes

```bash
git pull origin main
```

**Expected output:**

```
Already up to date.
```

or

```
From github.com:YOUR-USERNAME/nexus
 * branch            main       -> FETCH_HEAD
Already up to date.
```

---

#### Step 4: Create New Feature Branch

```bash
git checkout -b feature/setup-professional-workflow
```

**Expected output:**

```
Switched to a new branch 'feature/setup-professional-workflow'
```

**Verify you're on the new branch:**

```bash
git branch
```

**You should see:**

```
  main
* feature/setup-professional-workflow
```

The `*` shows your current branch.

---

## Part 3B: Make a Change

**Let's update the CHANGELOG.md with today's date:**

#### Step 1: Open CHANGELOG.md

**In VS Code or your editor:**

```bash
code CHANGELOG.md
```

---

#### Step 2: Find the [Unreleased] Section

**Look for:**

```markdown
## [Unreleased]

### Added

- Professional development workflow setup
```

---

#### Step 3: Update It

**Change it to:**

```markdown
## [Unreleased]

### Added

- Professional development workflow setup
  - GitHub Flow branching strategy
  - GitHub Actions CI/CD
  - ESLint and Prettier configuration
  - Pull request and issue templates
  - Project board setup
  - User journey documentation
  - Notion templates
  - Versioning guide

### Changed

- None

### Fixed

- None
```

**Save the file** (`Cmd + S`)

---

## Part 3C: Commit Your Changes

**In terminal:**

#### Step 1: Check What Changed

```bash
git status
```

**You should see:**

```
On branch feature/setup-professional-workflow
Changes not staged for commit:
  modified:   CHANGELOG.md
```

---

#### Step 2: Stage the Changes

```bash
git add .
```

This stages ALL changes. The `.` means "all files".

**Verify:**

```bash
git status
```

**You should see:**

```
On branch feature/setup-professional-workflow
Changes to be committed:
  modified:   CHANGELOG.md
  ... (and possibly other files)
```

---

#### Step 3: Commit with Conventional Format

**Copy and paste this entire command:**

```bash
git commit -m "chore: set up professional development workflow

- Added GitHub Flow branching strategy documentation
- Configured GitHub Actions for CI/CD
- Set up ESLint and Prettier for code quality
- Created issue and PR templates
- Configured branch protection rules
- Set up project board
- Added user journey maps
- Created Notion workspace templates
- Initialized CHANGELOG.md with proper versioning"
```

**Press Enter**

**Expected output:**

```
[feature/setup-professional-workflow abc1234] chore: set up professional development workflow
 X files changed, Y insertions(+), Z deletions(-)
 create mode 100644 .github/workflows/ci.yml
 ... (list of changed files)
```

**🎉 Committed!**

---

## Part 3D: Push to GitHub

#### Step 1: Push Your Branch

```bash
git push -u origin feature/setup-professional-workflow
```

**What happens:**

- Git uploads your branch to GitHub
- Creates the branch on GitHub
- Sets up tracking

**Expected output:**

```
Enumerating objects: 50, done.
Counting objects: 100% (50/50), done.
... (upload progress)
To github.com:YOUR-USERNAME/nexus.git
 * [new branch]      feature/setup-professional-workflow -> feature/setup-professional-workflow
Branch 'feature/setup-professional-workflow' set up to track remote branch 'feature/setup-professional-workflow' from 'origin'.
```

**You might also see a URL:**

```
remote: Create a pull request for 'feature/setup-professional-workflow' on GitHub by visiting:
remote:      https://github.com/YOUR-USERNAME/nexus/pull/new/feature/setup-professional-workflow
```

**🎉 Pushed to GitHub!**

---

## Part 3E: Create Pull Request

#### Step 1: Go to GitHub

**Open your browser and go to:**

```
https://github.com/YOUR-USERNAME/nexus
```

(Replace YOUR-USERNAME with your actual username)

---

#### Step 2: You'll See a Yellow Banner

**At the top of the page, you should see:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🟡 feature/setup-professional-workflow had recent pushes    │
│                                                             │
│              [ Compare & pull request ]                     │
└─────────────────────────────────────────────────────────────┘
```

**Click the green "Compare & pull request" button**

---

**Alternative (if you don't see the banner):**

1. Click the "Pull requests" tab
2. Click the green "New pull request" button
3. Select your branch from the dropdown

---

#### Step 3: Fill Out PR Template

**You'll see the PR template auto-filled!**

**The template will have sections like:**

- Description
- Type of Change
- Related Issues
- Changes Made
- Testing
- Checklist

**Fill it out:**

1. **Title** (should already be there):

   ```
   chore: set up professional development workflow
   ```

2. **Description:**

   ```
   Setting up professional development workflow for the Nexus project
   ```

3. **Type of Change** - Check this:
   - [x] 🔧 Refactoring (no functional changes)

4. **Changes Made:**

   ```markdown
   - Added GitHub Flow documentation
   - Configured CI/CD with GitHub Actions
   - Set up ESLint and Prettier
   - Created issue and PR templates
   - Configured branch protection
   - Set up project board
   ```

5. **Checklist** - Check applicable boxes:
   - [x] My code follows the project's style guidelines
   - [x] I have performed a self-review
   - [x] I have updated the documentation

---

#### Step 4: Create the PR

**Scroll to the bottom**

**Click the green "Create pull request" button**

**🎉 Pull Request created!**

---

## Part 3F: Watch CI Run

**You'll now see your PR page with:**

1. **Your PR title and description**

2. **Checks section:**

   ```
   ⚪ Some checks haven't completed yet
   🟡 CI / Lint & Format Check — In progress
   🟡 CI / Build Backend — Queued
   🟡 CI / Build Frontend — Queued
   ```

3. **Watch the checks run:**
   - Yellow circle = Running
   - Green checkmark = Passed
   - Red X = Failed

**This takes 2-5 minutes**

---

#### What If CI Fails?

**If you see red X:**

1. **Click "Details" next to the failed check**

2. **Read the error message**

3. **Common fixes:**
   - Lint errors: `npm run lint:fix`
   - Format errors: `npm run format`
   - Commit and push again:
     ```bash
     git add .
     git commit -m "fix: resolve CI issues"
     git push
     ```

4. **CI will automatically run again**

---

## Part 3G: Merge Your PR

**Once all checks are green ✅:**

#### Step 1: Review Your Changes

**On the PR page:**

1. **Click the "Files changed" tab**

2. **Review all your changes:**
   - Green = Added
   - Red = Removed
   - Look for anything unexpected

3. **If everything looks good, click "Review changes"**

4. **Select "Approve"** and click "Submit review"

---

#### Step 2: Merge the PR

**Go back to "Conversation" tab**

1. **You should see:**

   ```
   ✅ All checks have passed
   🟢 This branch has no conflicts with the base branch
   ```

2. **Click the green "Squash and merge" button**
   - Or just "Merge pull request" (both work)

3. **Confirm merge** by clicking "Confirm squash and merge"

---

#### Step 3: Delete the Branch

**After merging, you'll see:**

```
✅ Pull request successfully merged and closed

[Delete branch]
```

**Click "Delete branch"** to clean up

**🎉 Your first PR is merged!**

---

## Part 3H: Update Local Repository

**Back in your terminal:**

#### Step 1: Switch Back to Main

```bash
git checkout main
```

---

#### Step 2: Pull the Merged Changes

```bash
git pull origin main
```

**You should see:**

```
From github.com:YOUR-USERNAME/nexus
 * branch            main       -> FETCH_HEAD
Updating abc1234..def5678
Fast-forward
 CHANGELOG.md | 10 ++++++++
 ... (files changed)
```

---

#### Step 3: Delete Local Feature Branch

```bash
git branch -d feature/setup-professional-workflow
```

**Expected output:**

```
Deleted branch feature/setup-professional-workflow (was abc1234).
```

**🎉 You're back on main with merged changes!**

---

# PHASE 3 CHECKPOINT ✅

**You should have:**

- ✅ Created a feature branch
- ✅ Made changes
- ✅ Committed with conventional format
- ✅ Pushed to GitHub
- ✅ Created a Pull Request
- ✅ Watched CI run and pass
- ✅ Merged the PR
- ✅ Cleaned up local branches

---

# 🎉 CONGRATULATIONS! YOU'RE DONE! 🎉

## What You Just Accomplished:

✅ **GitHub configured** with branch protection and Actions
✅ **Project board** set up for task management
✅ **Code quality tools** installed and working
✅ **Complete workflow** tested end-to-end
✅ **First professional PR** created and merged!

---

## What's Next?

### Today (if you have time):

- [ ] Read `docs/PROFESSIONAL_WORKFLOW_SETUP.md` (15 minutes)
- [ ] Create your first real issue using GitHub templates
- [ ] Move it to your project board

### This Week:

- [ ] Read `docs/GIT_WORKFLOW.md`
- [ ] Practice: Create 2-3 more PRs
- [ ] Set up Notion workspace (optional)
- [ ] Create visual user journeys in Figma (optional)

### Daily From Now On:

```bash
# Start feature
git checkout -b feature/name

# Work and commit
git add .
git commit -m "type: description"

# Push and create PR
git push -u origin feature/name
# Go to GitHub → Create PR → Merge
```

---

## Quick Reference Card

**Save this!**

```bash
# Daily workflow
git checkout main && git pull              # Start fresh
git checkout -b feature/your-feature       # New branch
# ... work ...
git add .                                  # Stage changes
git commit -m "type: description"          # Commit
git push -u origin feature/your-feature    # Push

# Code quality
npm run lint                               # Check errors
npm run lint:fix                           # Fix errors
npm run format                             # Format code

# Project management
# Go to GitHub → Projects → Move cards
```

---

## Need Help?

**If something didn't work:**

1. **Check the error message** carefully
2. **Google the error** (seriously, everyone does this!)
3. **Check documentation** in `/docs` folder
4. **Create a GitHub issue** using the bug template

**Common issues:**

- CI failing → Run `npm run lint:fix` and `npm run format`
- Can't push → Check branch protection settings
- Merge conflicts → Ask me for help!

---

## You're Now a Professional Developer! 🚀

You have the same workflow that developers at Google, Meta, and top startups use.

**The key to success:** Use it every day. Consistency > perfection.

**Your next commit should be within 24 hours!** Build that habit! 💪
