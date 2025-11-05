# Code Quality Setup - ESLint & Prettier

## Overview

This project uses:

- **ESLint** - Code linting (find problems)
- **Prettier** - Code formatting (consistent style)

## Installation

### Backend

```bash
cd backend
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
```

### Frontend

```bash
cd frontend
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
# ESLint is already included with Next.js
```

---

## Configuration Files

### Root Level

- `.prettierrc.json` - Prettier configuration (shared by frontend and backend)
- `.prettierignore` - Files to ignore when formatting

### Backend

- `backend/.eslintrc.json` - ESLint rules for Node.js/Express
- `backend/.eslintignore` - Files to ignore when linting

### Frontend

- `frontend/.eslintrc.json` - ESLint rules for Next.js/React
- `frontend/.eslintignore` - Files to ignore when linting

---

## Usage

### Manual Commands

#### Backend

```bash
cd backend

# Lint code
npm run lint

# Fix auto-fixable lint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check
```

#### Frontend

```bash
cd frontend

# Lint code
npm run lint

# Fix auto-fixable lint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check
```

### All-in-One (from root)

```bash
# Lint and format both frontend and backend
npm run lint:all
npm run format:all
```

---

## Adding Scripts to package.json

### Backend package.json

Add these scripts:

```json
{
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
}
```

### Frontend package.json

Add these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"**/*.{js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,json,md,css}\""
  }
}
```

### Root package.json (optional)

Create a root package.json for convenience:

```json
{
  "name": "nexus",
  "private": true,
  "scripts": {
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "lint:all": "npm run lint:backend && npm run lint:frontend",
    "format:backend": "cd backend && npm run format",
    "format:frontend": "cd frontend && npm run format",
    "format:all": "npm run format:backend && npm run format:frontend",
    "format:check": "prettier --check \"**/*.{js,jsx,json,md}\""
  },
  "devDependencies": {
    "prettier": "^3.1.0"
  }
}
```

---

## IDE Integration

### VS Code Setup

1. **Install Extensions**:
   - ESLint (`dbaeumer.vscode-eslint`)
   - Prettier (`esbenp.prettier-vscode`)

2. **Settings** (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "prettier.requireConfig": true
}
```

3. **Restart VS Code**

Now your code will auto-format on save!

### Cursor IDE Setup

Same as VS Code (Cursor is built on VS Code).

---

## Pre-commit Hooks (Optional but Recommended)

Install Husky to run linting before commits:

```bash
# From root directory
npm install --save-dev husky lint-staged

# Initialize husky
npx husky init

# Create pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

Add to root `package.json`:

```json
{
  "lint-staged": {
    "backend/**/*.js": ["eslint --fix", "prettier --write"],
    "frontend/**/*.{js,jsx}": ["eslint --fix", "prettier --write"],
    "**/*.{json,md}": ["prettier --write"]
  }
}
```

Now, every commit will automatically lint and format changed files!

---

## Prettier Configuration Explained

```json
{
  "semi": true, // Use semicolons
  "trailingComma": "es5", // Trailing commas where valid in ES5
  "singleQuote": true, // Use single quotes
  "printWidth": 100, // Wrap lines at 100 characters
  "tabWidth": 2, // 2 spaces per indentation level
  "useTabs": false, // Spaces instead of tabs
  "arrowParens": "always", // Always parentheses around arrow function params
  "endOfLine": "lf" // Unix-style line endings
}
```

---

## ESLint Rules Explained

### Backend Rules

- `no-console: off` - Allow console.log (useful for debugging)
- `no-unused-vars: warn` - Warn about unused variables
- `no-var: error` - Use const/let instead of var
- `prefer-const: warn` - Prefer const when variable isn't reassigned
- `eqeqeq: error` - Require === and !== instead of == and !=
- `quotes: single` - Use single quotes
- `semi: error` - Require semicolons

### Frontend Rules

- Same as backend, plus:
- `react/react-in-jsx-scope: off` - Not needed in Next.js 13+
- `react/prop-types: off` - We're not using PropTypes
- `no-console: warn` - Warn about console.log in production code

---

## Common Issues & Fixes

### Issue: "Parsing error: Cannot find module 'next/babel'"

**Fix:** Create `.babelrc` in frontend:

```json
{
  "presets": ["next/babel"]
}
```

### Issue: ESLint and Prettier conflicts

**Fix:** Install `eslint-config-prettier`:

```bash
npm install --save-dev eslint-config-prettier
```

Then update `.eslintrc.json`:

```json
{
  "extends": ["eslint:recommended", "prettier"]
}
```

### Issue: Prettier not formatting on save

**Fix:**

1. Check VS Code settings (format on save enabled)
2. Ensure Prettier extension is installed
3. Set Prettier as default formatter for JavaScript

---

## Workflow Integration

### Before Committing

```bash
# 1. Lint your code
npm run lint

# 2. Fix auto-fixable issues
npm run lint:fix

# 3. Format code
npm run format

# 4. Run tests (when available)
npm test

# 5. Commit
git add .
git commit -m "feat: add new feature"
```

### In CI/CD (GitHub Actions)

```yaml
- name: Lint code
  run: npm run lint

- name: Check formatting
  run: npm run format:check
```

---

## Best Practices

1. **Format before committing** - Always run `npm run format`
2. **Fix lint errors** - Don't ignore ESLint warnings
3. **Use auto-format on save** - Set up IDE integration
4. **Consistent style** - Let Prettier handle formatting
5. **Review changes** - Check formatted code before committing

---

## Ignoring Files

### .prettierignore

- Build outputs (`dist/`, `build/`, `.next/`)
- Dependencies (`node_modules/`)
- Generated files
- Large data files

### .eslintignore

- Same as Prettier
- Configuration files (optional)

---

## Quick Reference

```bash
# Lint
npm run lint              # Check for errors
npm run lint:fix          # Auto-fix errors

# Format
npm run format            # Format all files
npm run format:check      # Check without changing

# Format specific file
npx prettier --write path/to/file.js

# Lint specific file
npx eslint path/to/file.js --fix
```

---

## Next Steps

1. ✅ Configuration files created
2. ⏳ Install dependencies
3. ⏳ Add scripts to package.json
4. ⏳ Set up IDE integration
5. ⏳ Run first format: `npm run format`
6. ⏳ Fix any lint errors: `npm run lint:fix`
7. ⏳ (Optional) Set up pre-commit hooks with Husky
