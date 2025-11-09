# Phase 2 Complete: Next.js API Routes with Prisma

## Overview

Phase 2 creates the new ticketing system using Next.js API routes powered by Prisma ORM. This phase implements the server-side logic that will replace the old backend routes.

**Status:** Phase 2 Complete - API routes created (NOT YET ACTIVE)

**Safety:** Old ticketing system still active. New routes controlled by feature flag `NEXT_PUBLIC_USE_NEW_TICKETING=false` (disabled by default).

---

## What Was Done

### 1. **Installed Dependencies**

```bash
npm install @prisma/client jsonwebtoken
```

- `@prisma/client` - Prisma ORM client for database access
- `jsonwebtoken` - JWT token verification for authentication

### 2. **Created Prisma Schema** (`frontend/prisma/schema.prisma`)

- Identical to backend schema
- Maps to existing `users`, `support_tickets`, `ticket_comments` tables
- Uses `POSTGRES_URL_NON_POOLING` for direct connection
- Enables proper read-after-write consistency

### 3. **Generated Prisma Client**

```bash
npx prisma generate
```

- Generated TypeScript-safe database client
- Provides autocomplete and type checking
- Optimized for serverless environments

### 4. **Created Infrastructure Files**

#### `src/lib/prisma.js`
- Singleton Prisma client for Next.js API routes
- Prevents connection leaks in serverless environment
- Hot-reload safe in development

#### `src/lib/api-auth.js`
- JWT authentication helper for API routes
- `authenticateRequest()` - Extracts and verifies tokens
- `withAuth()` - HOC wrapper for protected routes
- `hasRole()` - Role-based access control

### 5. **Created API Routes**

#### `src/pages/api/tickets/index.js`
- **GET** `/api/tickets` - List tickets (with pagination, filtering)
- **POST** `/api/tickets` - Create new ticket

#### `src/pages/api/tickets/[id].js`
- **GET** `/api/tickets/:id` - Get ticket details with all comments
- **PATCH** `/api/tickets/:id` - Update ticket (status, priority, category)
- **DELETE** `/api/tickets/:id` - Delete ticket (admin/support only)

#### `src/pages/api/tickets/[id]/comments.js`
- **POST** `/api/tickets/:id/comments` - Add comment to ticket
- **Critical Fix:** Uses Prisma `$transaction()` to guarantee read-after-write consistency

### 6. **Added Feature Flag to Frontend** (`src/utils/api.js`)

```javascript
// Feature flag control
NEXT_PUBLIC_USE_NEW_TICKETING=false  // Old system (default)
NEXT_PUBLIC_USE_NEW_TICKETING=true   // New system
```

Modified `supportAPI` to route requests based on feature flag:
- When `false`: Calls old backend at `https://thesimpleai.vercel.app/api/support/*`
- When `true`: Calls new Next.js routes at `/api/tickets/*`

### 7. **Updated Configuration**

#### `frontend/.env.example`
Added new environment variables:
- `NEXT_PUBLIC_USE_NEW_TICKETING=false` - Feature flag (disabled by default)
- `POSTGRES_URL_NON_POOLING` - Direct database connection for Prisma
- `JWT_SECRET` - Must match backend for token verification

#### `frontend/.gitignore`
Added Prisma ignores:
- `prisma/migrations/`
- `node_modules/.prisma/`
- `node_modules/@prisma/`

---

## Files Created/Modified

```
frontend/
├── prisma/
│   └── schema.prisma              # NEW - Database schema (identical to backend)
├── src/
│   ├── lib/
│   │   ├── prisma.js              # NEW - Prisma client singleton
│   │   └── api-auth.js            # NEW - JWT authentication helper
│   ├── pages/
│   │   └── api/
│   │       └── tickets/
│   │           ├── index.js       # NEW - List/Create tickets
│   │           ├── [id].js        # NEW - Get/Update/Delete ticket
│   │           └── [id]/
│   │               └── comments.js # NEW - Add comments
│   └── utils/
│       └── api.js                 # MODIFIED - Added feature flag routing
├── .env.example                   # MODIFIED - Added new env vars
├── .gitignore                     # MODIFIED - Added Prisma ignores
├── package.json                   # MODIFIED - Added dependencies
└── docs/
    └── PHASE_2_COMPLETE.md        # NEW - This file
```

---

## Key Technical Improvements

### ✅ **Atomic Transactions**

All database operations use Prisma's `$transaction()`:

```javascript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create comment
  const comment = await tx.ticketComment.create({ ... });

  // 2. Update ticket timestamp
  await tx.supportTicket.update({ ... });

  // 3. Fetch comment with user info
  const commentWithUser = await tx.ticketComment.findUnique({ ... });

  return commentWithUser;
});
```

**This guarantees:**
- All operations succeed or all fail (atomicity)
- Read-after-write consistency (same connection)
- No race conditions

### ✅ **Type Safety**

Prisma provides full TypeScript support:
- Autocomplete for table names and fields
- Compile-time error checking
- Prevents SQL injection

### ✅ **Authorization Checks**

Every route verifies:
1. Valid JWT token (via `withAuth()`)
2. Ticket ownership or admin/support role
3. Returns 403 Forbidden if unauthorized

### ✅ **Serverless Optimized**

- Connection pooling handled by Prisma
- Hot-reload safe in development
- Graceful shutdown handling

---

## Environment Variables Required

**IMPORTANT:** Set these in Vercel before enabling the feature flag:

```env
# Feature flag (keep false until testing complete)
NEXT_PUBLIC_USE_NEW_TICKETING=false

# Database connection (same as backend)
POSTGRES_URL_NON_POOLING=postgresql://user:pass@ep-xxx.region.neon.tech/db?sslmode=require

# JWT secret (MUST match backend)
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long
```

---

## Safety Guarantees

✅ **Old system untouched** - All existing backend routes still work
✅ **Feature flag disabled** - New routes exist but are not used
✅ **Zero breaking changes** - Frontend still calls old backend by default
✅ **Instant rollback** - Set `NEXT_PUBLIC_USE_NEW_TICKETING=false`
✅ **Other systems safe** - CV Intelligence, Interviews, Auth unaffected

---

## Next Steps: Phase 3 (Testing & Rollout)

### Local Testing (Recommended)

1. **Test with old system (current state):**
   ```bash
   # .env.local
   NEXT_PUBLIC_USE_NEW_TICKETING=false
   ```
   - Create tickets, add comments, verify everything works
   - Confirms old system still functional

2. **Test with new system:**
   ```bash
   # .env.local
   NEXT_PUBLIC_USE_NEW_TICKETING=true
   POSTGRES_URL_NON_POOLING=postgresql://...
   JWT_SECRET=same_as_backend
   ```
   - Create tickets, add comments
   - Navigate away and back to ticket
   - **Verify comments persist** (the original issue)
   - Test all ticket operations (create, update, delete, comment)

### Vercel Deployment

1. **Deploy with flag OFF:**
   ```bash
   git add .
   git commit -m "Phase 2: Create Next.js API Routes with Prisma"
   git push origin main
   ```
   - Vercel auto-deploys
   - New routes deployed but not active
   - Old system continues to work

2. **Enable on Vercel Preview:**
   - Vercel Dashboard → Environment Variables
   - Add `NEXT_PUBLIC_USE_NEW_TICKETING=true` to Preview
   - Add `POSTGRES_URL_NON_POOLING` to Preview
   - Add `JWT_SECRET` to Preview (same as backend)
   - Redeploy Preview environment
   - Test on Preview URL

3. **Enable on Production (if Preview works):**
   - Vercel Dashboard → Environment Variables
   - Add `NEXT_PUBLIC_USE_NEW_TICKETING=true` to Production
   - Add `POSTGRES_URL_NON_POOLING` to Production
   - Add `JWT_SECRET` to Production
   - Redeploy Production

4. **Monitor:**
   - Watch Vercel logs for errors
   - Test ticket creation and comments
   - Monitor for 24-48 hours

5. **Cleanup (Phase 4):**
   - Remove old backend routes
   - Remove feature flag code
   - Update documentation

---

## Rollback Plan

If anything goes wrong:

### Immediate (2 minutes):
```bash
# Vercel Dashboard → Environment Variables
NEXT_PUBLIC_USE_NEW_TICKETING=false  # Change to false
# Click "Redeploy"
```

### Alternative:
```bash
git revert HEAD
git push origin main
```

---

## Testing Checklist

Before enabling in production:

- [ ] Create a ticket with new system
- [ ] Add comment to ticket
- [ ] Navigate to ticket list
- [ ] Navigate back to ticket detail
- [ ] **Verify comment is still there** ✅ (This was the bug!)
- [ ] Add multiple comments
- [ ] Update ticket status
- [ ] Update ticket priority
- [ ] Filter tickets by status
- [ ] Admin: View all tickets
- [ ] Admin: Delete ticket
- [ ] Verify authorization (users can't access other's tickets)
- [ ] Test internal comments (admin/support only)

---

## Questions?

- Backend Prisma schema: `backend/prisma/schema.prisma`
- Frontend Prisma schema: `frontend/prisma/schema.prisma`
- API routes: `frontend/src/pages/api/tickets/`
- Feature flag: `frontend/src/utils/api.js:269-378`
- Migration plan: `backend/PRISMA_MIGRATION.md`
- Phase 1: Completed (Prisma setup in backend)
- Phase 2: Completed (This document)
- Phase 3: Testing & Rollout (Next)
