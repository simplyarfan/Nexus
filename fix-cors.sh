#!/bin/bash

echo "🚀 NEXUS CORS FIX - Deploying Backend with Correct CORS"

cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/backend

echo ""
echo "1️⃣ Checking environment variables..."
if ! grep -q "ALLOWED_ORIGINS" .env; then
    echo "Adding ALLOWED_ORIGINS to .env..."
    echo "ALLOWED_ORIGINS=https://thesimpleai.netlify.app,https://thesimpleai.vercel.app,http://localhost:3000" >> .env
fi

echo ""
echo "2️⃣ Testing backend locally..."
npm start &
SERVER_PID=$!
sleep 5

# Test CORS
echo ""
echo "3️⃣ Testing CORS response..."
curl -X OPTIONS http://localhost:5000/api/auth/check \
  -H "Origin: https://thesimpleai.netlify.app" \
  -H "Access-Control-Request-Method: GET" \
  -v

echo ""
echo "4️⃣ Killing local server..."
kill $SERVER_PID

echo ""
echo "✅ Local test complete! Now deploy to Vercel with:"
echo "   cd backend && vercel --prod"
