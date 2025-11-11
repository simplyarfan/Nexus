#!/bin/bash

echo "🚀 Pushing Nexus CORS Fix to GitHub"
echo ""

cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus

# Check git status
echo "1️⃣ Current changes:"
git status --short

echo ""
echo "2️⃣ Adding changes (excluding .env files)..."
# Make sure .env files aren't accidentally added
git rm --cached backend/.env frontend/.env frontend/.env.local 2>/dev/null || true
git add .

echo ""
echo "3️⃣ Committing changes..."
git commit -m "🔧 Fix CORS issues - Allow Netlify + Vercel origins

- Added ALLOWED_ORIGINS to backend .env with all deployment domains
- Updated frontend to point to Vercel backend (thesimpleai.vercel.app)
- Enhanced CORS middleware with debug logging
- Fixed hydration errors in ErrorBoundary and StaggeredMenu
- Added dev startup scripts for local testing

Changes:
- backend/.env: Added ALLOWED_ORIGINS config
- backend/server.js: Enhanced CORS debug logging
- frontend/.env: Set NEXT_PUBLIC_API_URL
- frontend/.env.local: Added API configuration
- frontend/src/components/shared/ErrorBoundary.js: Fixed null check
- frontend/src/components/reactbits/StaggeredMenu.js: Changed useLayoutEffect to useEffect

Scripts:
- start-dev.sh: Starts both servers with CORS testing
- check-config.sh: Verifies configuration
- fix-cors.sh: CORS testing script"

echo ""
echo "4️⃣ Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Changes pushed to GitHub!"
echo ""
echo "📦 Next: Deploy to Vercel/Netlify to see changes live"
