#!/bin/bash

echo "🔧 CORS Configuration Fix"
echo ""

# Make start script executable
chmod +x /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/start-dev.sh

# Check current configuration
echo "1️⃣ Current Backend CORS Config:"
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/backend
grep "ALLOWED_ORIGINS" .env || echo "❌ ALLOWED_ORIGINS not set"

echo ""
echo "2️⃣ Current Frontend API URL:"
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/frontend
grep "NEXT_PUBLIC_API_URL" .env.local 2>/dev/null || grep "NEXT_PUBLIC_API_URL" .env 2>/dev/null || echo "❌ NEXT_PUBLIC_API_URL not set"

echo ""
echo "✅ Configuration files updated!"
echo ""
echo "🚀 Next steps:"
echo "1. Run: /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/start-dev.sh"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Check console for CORS errors (should be gone!)"
