#!/bin/bash

echo "=== Checking Nexus Build Issues ==="
cd /Users/syedarfan/Documents/Projects/webpages:webapps/nexus/frontend

echo ""
echo "1. Installing dependencies..."
npm install

echo ""
echo "2. Running build to catch errors..."
npm run build 2>&1 | tee build-output.log

echo ""
echo "3. Build complete. Check build-output.log for details."
