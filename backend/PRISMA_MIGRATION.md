# Prisma Migration Guide for Ticketing System

## Overview

This document describes the migration of the ticketing system from manual database queries to Prisma ORM.

**Status:** Phase 1 Complete - Prisma installed and configured (NOT YET ACTIVE)

**Safety:** Old ticketing system still active. Prisma coexists but is not used yet.

---

## Phase 1: Setup (COMPLETED) ✅

### What Was Done:

1. **Installed Prisma**
   - `@prisma/client` - Runtime client
   - `prisma` - CLI tool (dev dependency)

2. **Created Prisma Schema** (`prisma/schema.prisma`)
   - Maps to existing `users`, `support_tickets`, and `ticket_comments` tables
   - Uses `POSTGRES_URL_NON_POOLING` for direct connection
   - Preserves all existing relationships and constraints

3. **Created Prisma Client Singleton** (`lib/prisma.js`)
   - Single instance pattern prevents connection leaks
   - Configured for both development and production
   - Graceful shutdown handling

4. **Updated Environment Configuration**
   - Added `POSTGRES_URL_NON_POOLING` to `.env.example`
   - Created `.env.local.example` with actual connection strings
   - Updated `.gitignore` for Prisma-generated files

### Files Created/Modified:

```
backend/
├── prisma/
│   └── schema.prisma          # NEW - Database schema
├── lib/
│   └── prisma.js              # NEW - Prisma client singleton
├── .env.example               # MODIFIED - Added POSTGRES_URL_NON_POOLING
├── .env.local.example         # NEW - Local dev example
├── .gitignore                 # MODIFIED - Added Prisma ignores
├── package.json               # MODIFIED - Added Prisma dependencies
└── PRISMA_MIGRATION.md        # NEW - This file
```

### Environment Variables Required:

**IMPORTANT:** Set in Vercel before deploying:

```env
# Required for Prisma (unpooled connection)
POSTGRES_URL_NON_POOLING="postgresql://user:pass@ep-xxx.region.neon.tech/db?sslmode=require"

# Keep existing (for other routes)
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.neon.tech/db?sslmode=require"
```

---

## Phase 2: Create API Routes (NEXT)

Will create Next.js API routes in `frontend/src/pages/api/tickets/`:
- `index.js` - List/Create tickets
- `[id].js` - Get/Update/Delete single ticket
- `[id]/comments.js` - Add comments

**Feature Flag:** `NEXT_PUBLIC_USE_NEW_TICKETING` will control rollout.

---

## Phase 3: Testing & Rollout (PLANNED)

1. Local testing with feature flag OFF (verify old system works)
2. Local testing with feature flag ON (verify new system works)
3. Deploy to Vercel Preview with flag OFF
4. Enable flag on Preview environment
5. Test on Preview URL
6. Enable flag on Production (gradual rollout)
7. Monitor for 48 hours
8. Remove old backend routes

---

## Rollback Plan

If anything goes wrong:

1. **Immediate:** Set `NEXT_PUBLIC_USE_NEW_TICKETING=false` in Vercel
2. **Redeploy:** Takes 2 minutes
3. **Old system active again**

OR

```bash
git revert HEAD
git push origin main
```

---

## Safety Guarantees

✅ **Old system untouched** - All existing routes still work
✅ **Database unchanged** - Prisma reads existing schema
✅ **Zero downtime** - Feature flag controls traffic
✅ **Instant rollback** - Change environment variable
✅ **Other systems safe** - CV Intelligence, Interviews, Auth unaffected

---

## Next Steps

Run Phase 2:
```bash
# Say "START PHASE 2" to begin creating API routes
```

---

## Questions?

- Prisma schema: `backend/prisma/schema.prisma`
- Prisma client: `backend/lib/prisma.js`
- Migration plan: See commit message for Phase 1
