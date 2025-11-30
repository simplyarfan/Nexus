# NEXUS PROJECT - QUICK FIX CHECKLIST
**Priority Actions from Comprehensive Audit**

---

## 🔴 CRITICAL - DO TODAY (2-4 hours)

### 1. Rotate All Exposed Credentials

**Why:** Database and API keys exposed in .env files

**Steps:**
```bash
# 1. Neon Database
# Go to: https://console.neon.tech/
# Navigate to your project → Settings → Reset password
# Update DATABASE_URL in Vercel/Netlify environment variables

# 2. GROQ API Key
# Go to: https://console.groq.com/keys
# Delete old key, create new key
# Update GROQ_API_KEY in deployment platform

# 3. OpenAI API Key
# Go to: https://platform.openai.com/api-keys
# Revoke old key, create new key
# Update OPENAI_API_KEY in deployment platform

# 4. Email Passwords
# Gmail: Generate new App Password
# Outlook: Regenerate client secret

# 5. JWT Secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Run twice, update JWT_SECRET and JWT_REFRESH_SECRET
```

**Verification:**
- [ ] Neon password rotated
- [ ] GROQ key rotated
- [ ] OpenAI key rotated
- [ ] Email credentials rotated
- [ ] JWT secrets regenerated
- [ ] All new values in Vercel/Netlify (NOT in .env files)

---

### 2. Remove .env Files from Git

**Why:** Credentials in version control = security breach

**Steps:**
```bash
cd /Users/syedarfan/Documents/Projects/webapps/nexus

# Verify .env is in .gitignore (should already be there)
cat .gitignore | grep ".env"

# Remove .env files from git (keeps local copies)
git rm --cached backend/.env
git rm --cached frontend/.env

# Check git history for .env commits
git log --all --full-history -- "*/.env"
# If found, consider using git-filter-repo to remove from history

# Commit the removal
git commit -m "security: Remove .env files from version control"
```

**Verification:**
- [ ] .env in .gitignore
- [ ] .env removed from git tracking
- [ ] Local .env files still exist (NOT deleted)
- [ ] Changes committed

---

### 3. Create .env.example Templates

**Why:** Developers need to know required environment variables

**Steps:**
```bash
# Backend
cat > backend/.env.example << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@host/database"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host/database"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET="your-secret-here-minimum-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-here-minimum-32-characters"
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Security
ENCRYPTION_KEY="your-encryption-key-here"
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=30

# Email
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
OUTLOOK_CLIENT_ID="your-client-id"
OUTLOOK_CLIENT_SECRET="your-client-secret"
OUTLOOK_TENANT_ID="your-tenant-id"

# AI APIs
GROQ_API_KEY="your-groq-api-key"
OPENAI_API_KEY="your-openai-api-key"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
EOF

# Frontend
cat > frontend/.env.example << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Company Info
NEXT_PUBLIC_COMPANY_DOMAIN=your-domain.com
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=admin@your-domain.com

# OAuth
NEXT_PUBLIC_OUTLOOK_CLIENT_ID=your-client-id
NEXT_PUBLIC_OUTLOOK_TENANT_ID=your-tenant-id
EOF

# Add to git
git add backend/.env.example frontend/.env.example
git commit -m "docs: Add .env.example templates for developers"
```

**Verification:**
- [ ] backend/.env.example created
- [ ] frontend/.env.example created
- [ ] No real credentials in .example files
- [ ] Files committed to git

---

## 🟠 HIGH PRIORITY - THIS WEEK (4-6 hours)

### 4. Delete Unused Code (30 min)

```bash
cd /Users/syedarfan/Documents/Projects/webapps/nexus

# Backend - Remove unused middleware
rm backend/middleware/csrf.js
rm backend/middleware/monitoring.js
rm backend/middleware/performance.js

# Backend - Remove backup files
rm backend/routes/cv-intelligence.js.old

# Backend - Remove obsolete migrations
rm backend/scripts/add-phone-column.js
rm backend/create_candidate_profiles.sql

# Frontend - Remove broken/unused code
rm frontend/src/hooks/useApi.js
rm frontend/src/components/shared/Navbar.js
rm frontend/src/constants/theme.js
rm frontend/src/constants/messages.js

# Remove macOS junk
find . -name ".DS_Store" -type f -delete

# Commit
git add -A
git commit -m "chore: Remove 1,495 lines of unused code and backup files"
git push
```

**Verification:**
- [ ] 10 files deleted
- [ ] Changes committed and pushed
- [ ] Build still works: `cd backend && npm run build`
- [ ] Build still works: `cd frontend && npm run build`

---

### 5. Remove Unused NPM Packages (15 min)

```bash
# Frontend
cd frontend
npm uninstall mathjs lenis gsap @gsap/react

# Run audit
npm audit fix

# Update package-lock.json
git add package.json package-lock.json
git commit -m "chore: Remove unused npm packages (saves ~200KB)"

# Verify build works
npm run build
```

**Verification:**
- [ ] 4 packages removed
- [ ] No build errors
- [ ] Changes committed

---

### 6. Fix Critical Configuration Bugs (1 hour)

**A. Fix Netlify Build Output**
```bash
# File: frontend/netlify.toml
# Change line 3 from:
publish = ".next"
# To:
publish = "out"
```

**B. Fix Duplicate Compression Middleware**
```bash
# File: backend/server.js
# Remove lines 235-247 (duplicate compression middleware)
```

**C. Fix API URL Port Inconsistency**
```bash
# File: frontend/src/utils/usersAPI.js line 4
# Change from:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
# To:
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
```

**Verification:**
- [ ] netlify.toml fixed
- [ ] Duplicate middleware removed
- [ ] API ports consistent
- [ ] All builds successful

---

## 🟡 MEDIUM PRIORITY - NEXT 2 WEEKS

### 7. Consolidate Duplicate Users Pages (3-4 hours)

**Goal:** Reduce 910 duplicate lines

**Steps:**
1. Create `frontend/src/components/shared/UsersManagement.js`
2. Move all logic from `pages/admin/users.js` to new component
3. Update `pages/admin/users.js` to import component
4. Update `pages/superadmin/users.js` to import component
5. Pass role-specific props to differentiate behavior

**Verification:**
- [ ] Component created
- [ ] Both pages use component
- [ ] Functionality unchanged
- [ ] 910 lines saved

---

### 8. Create Shared API Instance (4-6 hours)

**Goal:** Reduce 700 duplicate lines

**Steps:**
1. Update `frontend/src/utils/api.js` with complete axios instance
2. Export configured instance
3. Update all 7 API files to import and use shared instance:
   - `analyticsAPI.js`
   - `usersAPI.js`
   - `candidatesAPI.js`
   - `jobPositionsAPI.js`
   - `interviewsAPI.js`
   - `notificationsAPI.js`
   - `supportAPI.js`

**Verification:**
- [ ] Shared instance created
- [ ] 7 API files updated
- [ ] Token refresh works
- [ ] 700 lines saved

---

### 9. Replace Console.log with Winston Logger (4-6 hours)

**Goal:** Remove 308+ console.log statements

**Steps:**
1. Review Winston configuration in `backend/utils/logger.js`
2. Search for all console.log: `grep -r "console\.log" backend/`
3. Replace with appropriate logger level:
   - `console.log()` → `logger.info()`
   - `console.error()` → `logger.error()`
   - `console.warn()` → `logger.warn()`
4. Wrap debug logs: `if (process.env.NODE_ENV === 'development') logger.debug()`

**Verification:**
- [ ] Winston logger configured
- [ ] All console.log replaced
- [ ] Logs properly formatted
- [ ] Production logs clean

---

## 📋 VERIFICATION CHECKLIST

After completing all fixes, verify:

### Security ✅
- [ ] No .env files in git repository
- [ ] All credentials rotated
- [ ] .env.example files exist
- [ ] No secrets in code
- [ ] No tokens in console logs

### Code Quality ✅
- [ ] Unused files deleted (1,495 lines)
- [ ] Duplicate code reduced
- [ ] Unused packages removed
- [ ] No build errors
- [ ] All tests pass

### Configuration ✅
- [ ] netlify.toml correct
- [ ] API ports consistent
- [ ] Duplicate middleware removed
- [ ] Node versions aligned

### Deployment ✅
- [ ] Environment variables set in Vercel
- [ ] Environment variables set in Netlify
- [ ] Backend builds successfully
- [ ] Frontend builds successfully
- [ ] All services running

---

## 🎯 SUCCESS METRICS

After completing this checklist:

- ✅ **0 exposed credentials** (down from 10+)
- ✅ **1,495 lines deleted** (3.7% codebase reduction)
- ✅ **200KB+ smaller bundle** (npm packages removed)
- ✅ **0 critical security issues**
- ✅ **Production-ready deployment**

---

## 📞 TROUBLESHOOTING

### "Build fails after deleting files"
- Check if deleted files were imported anywhere
- Search for imports: `grep -r "filename" frontend/` or `backend/`

### "Can't connect to database after rotation"
- Verify new DATABASE_URL in Vercel/Netlify
- Check Prisma connection: `npx prisma db pull`

### "API calls failing after changes"
- Verify NEXT_PUBLIC_API_URL is set correctly
- Check browser console for CORS errors
- Verify backend is running on correct port

### "Environment variables not loading"
- Restart dev server after .env changes
- Verify variable names match exactly (case-sensitive)
- Check if variable starts with NEXT_PUBLIC_ (required for frontend)

---

**Created:** November 30, 2025
**Estimated Total Time:** 10-16 hours over 1-2 weeks
**Priority:** Execute Critical section TODAY
