#!/bin/bash

echo "🔒 SAFE Git Push with Environment Protection"
echo ""

cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus

# Double-check .env files are in .gitignore
echo "1️⃣ Verifying .env files are ignored..."
if grep -q "^\.env$" .gitignore && grep -q "^\.env\.local$" .gitignore; then
    echo "   ✅ .env files are in .gitignore"
else
    echo "   ⚠️  Adding .env patterns to .gitignore..."
    echo ".env" >> .gitignore
    echo ".env.local" >> .gitignore
fi

# Remove any accidentally staged .env files
echo ""
echo "2️⃣ Removing any staged .env files..."
git rm --cached backend/.env 2>/dev/null || true
git rm --cached frontend/.env 2>/dev/null || true
git rm --cached frontend/.env.local 2>/dev/null || true
git rm --cached **/.env 2>/dev/null || true
git rm --cached **/.env.local 2>/dev/null || true

# Show what will be committed
echo ""
echo "3️⃣ Files to be committed:"
git status --short

echo ""
read -p "Does this look safe? No .env files listed? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Push cancelled. Please review the changes."
    exit 1
fi

# Add all changes
echo ""
echo "4️⃣ Staging changes..."
git add .

# Commit
echo ""
echo "5️⃣ Committing..."
git commit -m "🔧 Fix CORS issues - Allow Netlify + Vercel origins

- Added ALLOWED_ORIGINS configuration with all deployment domains
- Updated frontend API URL to point to Vercel backend
- Enhanced CORS middleware with debug logging
- Fixed hydration errors (ErrorBoundary null check, StaggeredMenu useLayoutEffect)
- Added .env.example files for documentation
- Created dev startup and testing scripts

Backend Changes:
- server.js: Enhanced CORS debug logging
- .env.example: Template for environment variables

Frontend Changes:
- .env.example: Template for API configuration
- ErrorBoundary.js: Fixed componentStack null check
- StaggeredMenu.js: Changed useLayoutEffect to useEffect for SSR

New Scripts:
- start-dev.sh: Starts both servers with CORS testing
- check-config.sh: Verifies configuration
- fix-cors.sh: CORS testing script
- push-to-github.sh: Safe git push with .env protection"

# Push
echo ""
echo "6️⃣ Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Successfully pushed to GitHub!"
echo ""
echo "📦 Next Steps:"
echo "   1. Vercel will auto-deploy backend from main branch"
echo "   2. Netlify will auto-deploy frontend from main branch"
echo "   3. Check deployment logs for any issues"
echo ""
echo "🔐 IMPORTANT: Set environment variables in Vercel/Netlify dashboards:"
echo "   Vercel (backend):"
echo "   - ALLOWED_ORIGINS"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - JWT_REFRESH_SECRET"
echo ""
echo "   Netlify (frontend):"
echo "   - NEXT_PUBLIC_API_URL"
