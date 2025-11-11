#!/bin/bash

# Production Database Migration Script
# This script pushes your Prisma schema to the production database

echo "🔄 Starting Production Database Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "Please set your Neon DATABASE_URL:"
  echo "  export DATABASE_URL='postgresql://...your-connection-string...'"
  echo ""
  exit 1
fi

echo "✅ DATABASE_URL found"
echo "📦 Running Prisma migrations..."
echo ""

# Run Prisma migrate deploy (for production)
npx prisma migrate deploy

# Check if migration was successful
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database migration completed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Test your login at https://thesimpleai.vercel.app"
  echo "2. If it works, you're all set!"
  echo ""
else
  echo ""
  echo "❌ Migration failed. Please check the error above."
  echo ""
  exit 1
fi
