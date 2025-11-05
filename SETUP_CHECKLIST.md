# Setup Checklist - Start Here! 🚀

## Quick Start (30 Minutes)

### ☑️ Phase 1: GitHub Configuration (10 min)

- [ ] **Branch Protection**
  - Go to: GitHub → Settings → Branches
  - Click "Add rule" for `main` branch
  - Enable: Require PR, Require status checks, Conversation resolution
  - [Full Guide](docs/GITHUB_SETUP_GUIDE.md)

- [ ] **Enable GitHub Actions**
  - Go to: GitHub → Settings → Actions → General
  - Select: "Allow all actions"
  - Enable: "Read and write permissions"

- [ ] **Create Project Board**
  - Go to: GitHub → Projects → New Project
  - Name: "Nexus Development Board"
  - Template: Board
  - Add columns: Backlog, To Do, In Progress, In Review, Done

### ☑️ Phase 2: Code Quality (10 min)

- [ ] **Install Dependencies**

  ```bash
  cd backend
  npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier

  cd ../frontend
  npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
  ```

- [ ] **Add Scripts to package.json**

  **Backend** (`backend/package.json`):

  ```json
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.{js,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,json,md}\""
  }
  ```

  **Frontend** (`frontend/package.json`):

  ```json
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,json,md,css}\""
  }
  ```

- [ ] **Format Your Code**

  ```bash
  cd backend && npm run format
  cd frontend && npm run format
  ```

- [ ] **Set Up VS Code**
  - Install Extension: ESLint
  - Install Extension: Prettier
  - Enable Format on Save

### ☑️ Phase 3: First Workflow Test (10 min)

- [ ] **Create Test Branch**

  ```bash
  git checkout main
  git pull
  git checkout -b feature/setup-professional-workflow
  ```

- [ ] **Make a Small Change**
  - Update `CHANGELOG.md` with today's date
  - Or add a comment somewhere

- [ ] **Commit with Conventional Format**

  ```bash
  git add .
  git commit -m "chore: set up professional development workflow

  - Added ESLint and Prettier configuration
  - Set up GitHub Actions for CI/CD
  - Created issue and PR templates
  - Initialized CHANGELOG.md
  - Configured branch protection rules"
  ```

- [ ] **Push and Create PR**

  ```bash
  git push -u origin feature/setup-professional-workflow
  ```

  - Go to GitHub
  - Create Pull Request
  - See the template auto-fill!
  - Watch CI run

- [ ] **Merge Your First PR**
  - Wait for CI to pass (green checkmark)
  - Review the changes
  - Click "Squash and merge"
  - Delete the branch

---

## Optional Setup (1-2 Hours)

### ☑️ Notion Workspace

- [ ] Create free Notion account at [notion.so](https://notion.so)
- [ ] Create workspace: "Nexus Development"
- [ ] Set up basic pages (see [NOTION_SETUP.md](docs/NOTION_SETUP.md))
- [ ] Create first feature spec

### ☑️ Figma for User Journeys

- [ ] Create free Figma account at [figma.com](https://figma.com)
- [ ] Open FigJam (Figma's whiteboard)
- [ ] Search template: "User Journey Map"
- [ ] Create board: "Nexus User Journeys"

### ☑️ Pre-commit Hooks (Husky)

- [ ] Install Husky

  ```bash
  npm install --save-dev husky lint-staged
  npx husky init
  ```

- [ ] Configure in root `package.json`:

  ```json
  "lint-staged": {
    "backend/**/*.js": ["eslint --fix", "prettier --write"],
    "frontend/**/*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "**/*.{json,md}": ["prettier --write"]
  }
  ```

- [ ] Create pre-commit hook:
  ```bash
  echo "npx lint-staged" > .husky/pre-commit
  chmod +x .husky/pre-commit
  ```

---

## Verification Checklist

### ✅ GitHub Setup

- [ ] Branch protection active on `main`
- [ ] GitHub Actions enabled
- [ ] Project board created with 5 columns
- [ ] Can create issues using templates
- [ ] Can create PRs using template

### ✅ Code Quality

- [ ] ESLint installed in backend
- [ ] ESLint installed in frontend
- [ ] Prettier installed
- [ ] `npm run lint` works
- [ ] `npm run format` works
- [ ] VS Code auto-formats on save

### ✅ Git Workflow

- [ ] Created feature branch
- [ ] Made commit with conventional format
- [ ] Pushed to GitHub
- [ ] Created Pull Request
- [ ] CI ran successfully
- [ ] Merged PR

---

## Daily Workflow (After Setup)

```bash
# Morning: Start new feature
git checkout main && git pull
git checkout -b feature/new-feature

# During day: Work and commit
git add .
git commit -m "feat: add feature description"
git push -u origin feature/new-feature

# Evening: Create PR and merge
# 1. Go to GitHub
# 2. Create Pull Request
# 3. Wait for CI
# 4. Review and merge
# 5. Delete branch

# Back to main
git checkout main
git pull
```

---

## Documentation Quick Reference

| Need                 | Read This                                                             | Time   |
| -------------------- | --------------------------------------------------------------------- | ------ |
| **Overview**         | [PROFESSIONAL_WORKFLOW_SETUP.md](docs/PROFESSIONAL_WORKFLOW_SETUP.md) | 15 min |
| **Git workflow**     | [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)                               | 20 min |
| **GitHub setup**     | [GITHUB_SETUP_GUIDE.md](docs/GITHUB_SETUP_GUIDE.md)                   | 10 min |
| **Task management**  | [PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md)                   | 25 min |
| **User journeys**    | [USER_JOURNEYS.md](docs/USER_JOURNEYS.md)                             | 15 min |
| **Notion templates** | [NOTION_SETUP.md](docs/NOTION_SETUP.md)                               | 20 min |
| **Code quality**     | [CODE_QUALITY_SETUP.md](docs/CODE_QUALITY_SETUP.md)                   | 15 min |
| **Versioning**       | [VERSIONING_GUIDE.md](docs/VERSIONING_GUIDE.md)                       | 20 min |

---

## 🎯 Your First Week

### Day 1 (Today)

- [x] ~~Complete setup~~ (You did it!)
- [ ] Read [PROFESSIONAL_WORKFLOW_SETUP.md](docs/PROFESSIONAL_WORKFLOW_SETUP.md)
- [ ] Test the workflow with a small PR

### Day 2

- [ ] Read [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
- [ ] Create 3 feature branches
- [ ] Practice conventional commits

### Day 3

- [ ] Read [PROJECT_MANAGEMENT.md](docs/PROJECT_MANAGEMENT.md)
- [ ] Create 5 issues using templates
- [ ] Organize them in Project board

### Day 4

- [ ] Read [USER_JOURNEYS.md](docs/USER_JOURNEYS.md)
- [ ] Review existing journeys
- [ ] Write one user story

### Day 5

- [ ] Read [CODE_QUALITY_SETUP.md](docs/CODE_QUALITY_SETUP.md)
- [ ] Fix any lint errors
- [ ] Format entire codebase

### Day 6-7 (Weekend)

- [ ] Optional: Set up Notion workspace
- [ ] Optional: Create Figma user journeys
- [ ] Review week's progress

---

## 🆘 Troubleshooting

### CI Failing?

1. Check error in GitHub Actions tab
2. Run `npm run lint` locally
3. Run `npm run format` to fix
4. Commit and push again

### ESLint Errors?

1. Run `npm run lint:fix`
2. Manually fix remaining errors
3. Commit changes

### Can't Merge PR?

1. Check branch protection rules
2. Wait for CI to pass
3. Resolve conversations
4. Update branch with main if needed

### Git Conflicts?

1. `git fetch origin`
2. `git merge origin/main`
3. Resolve conflicts in files
4. `git add .`
5. `git commit -m "fix: resolve merge conflicts"`

---

## 📞 Need Help?

1. **Check docs** in `/docs` folder
2. **Search CLAUDE.md** for AI guidance
3. **Create GitHub issue** using bug template
4. **Review GitHub's guides** (linked in docs)

---

## 🎉 You're All Set!

Once you complete the Quick Start checklist above, you'll have a **professional development workflow** running.

### What's Next?

1. Complete the checklist
2. Read the documentation
3. Start building features
4. Ship great software!

**Start with Phase 1 above** (takes 10 minutes). Let's go! 🚀
