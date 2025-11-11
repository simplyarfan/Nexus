#!/bin/bash

echo "🚀 Starting Nexus with CORS Fix"
echo ""

# Start backend
echo "1️⃣ Starting backend on http://localhost:5000..."
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/backend
npm start &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 8

# Test backend health
echo ""
echo "2️⃣ Testing backend health..."
curl -s http://localhost:5000/health | jq '.'

# Test CORS preflight
echo ""
echo "3️⃣ Testing CORS from Netlify origin..."
curl -X OPTIONS http://localhost:5000/api/auth/check \
  -H "Origin: https://thesimpleai.netlify.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v 2>&1 | grep -E "(access-control|HTTP)"

echo ""
echo "4️⃣ Testing CORS from Vercel origin..."
curl -X OPTIONS http://localhost:5000/api/auth/check \
  -H "Origin: https://thesimpleai.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v 2>&1 | grep -E "(access-control|HTTP)"

# Start frontend
echo ""
echo "5️⃣ Starting frontend on http://localhost:3000..."
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers starting!"
echo ""
echo "📊 Backend:  http://localhost:5000"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
