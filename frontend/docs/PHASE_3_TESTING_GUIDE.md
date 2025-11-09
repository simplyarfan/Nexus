# Phase 3: Testing & Rollout Guide

## Current Status

✅ **Phase 1:** Prisma installed in backend (Complete)
✅ **Phase 2:** Next.js API routes created (Complete)
🔄 **Phase 3:** Testing & Rollout (IN PROGRESS)

**Latest Commit:** `b77cce1` - "Phase 2 Complete: Next.js API Routes with Prisma"

---

## Step 1: Add Environment Variables to Vercel

You need to add these environment variables to your Vercel project. We'll start with **Preview** environment only (safe testing).

### Required Environment Variables:

```env
# Feature Flag (enables new ticketing system)
NEXT_PUBLIC_USE_NEW_TICKETING=true

# Database Connection (direct, non-pooled)
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:npg_U7DVSnPM9Bmr@ep-sweet-dust-adc4jjkh.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Secret (must match backend)
JWT_SECRET=your_backend_jwt_secret_here
```

### Method 1: Using Vercel Web Dashboard (RECOMMENDED)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your frontend project (should be "frontend" or similar)

2. **Navigate to Environment Variables:**
   - Click on your project
   - Go to "Settings" tab
   - Click "Environment Variables" in the left sidebar

3. **Add Each Variable (one at a time):**

   **Variable 1: NEXT_PUBLIC_USE_NEW_TICKETING**
   - Name: `NEXT_PUBLIC_USE_NEW_TICKETING`
   - Value: `true`
   - Environments: ✅ **Preview only** (uncheck Production and Development)
   - Click "Save"

   **Variable 2: POSTGRES_URL_NON_POOLING**
   - Name: `POSTGRES_URL_NON_POOLING`
   - Value: `postgresql://neondb_owner:npg_U7DVSnPM9Bmr@ep-sweet-dust-adc4jjkh.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - Environments: ✅ **Preview only**
   - Click "Save"

   **Variable 3: JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: (You need to get this from your backend .env or Vercel backend settings)
   - Environments: ✅ **Preview only**
   - Click "Save"

4. **Redeploy Preview:**
   - Go to "Deployments" tab
   - Find the latest deployment
   - Click the three dots (⋯) on the right
   - Click "Redeploy"
   - Wait for deployment to complete

### Method 2: Using Vercel CLI (Alternative)

```bash
# Add to Preview environment only
vercel env add NEXT_PUBLIC_USE_NEW_TICKETING preview
# When prompted, enter: true

vercel env add POSTGRES_URL_NON_POOLING preview
# When prompted, paste your connection string

vercel env add JWT_SECRET preview
# When prompted, enter your JWT secret

# Redeploy
vercel --prod=false
```

---

## Step 2: Find Your Preview URL

After redeploying:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Look for the latest deployment with a Preview URL
3. The URL will look like: `frontend-xxx-yourname.vercel.app`
4. Click on it to open the Preview deployment

---

## Step 3: Testing Checklist

**IMPORTANT:** You need to get the `JWT_SECRET` value first!

### Where to Find JWT_SECRET:

**Option A: From Backend Vercel Settings**

1. Go to Vercel Dashboard
2. Find your **backend** project (not frontend)
3. Settings → Environment Variables
4. Find `JWT_SECRET` and copy its value

**Option B: From Backend .env file** (if you have it locally)

1. Check `backend/.env.local` (if it exists)
2. Look for `JWT_SECRET=...`
3. Copy the value

**Option C: Generate New One** (NOT RECOMMENDED - will break existing sessions)

- Only do this if you can't find the original
- This will log out all users

### Once You Have All Variables Set:

Test these features on your **Preview URL**:

#### ✅ **Test 1: Create Ticket**

- [ ] Log in to the application
- [ ] Navigate to Support/Tickets
- [ ] Click "Create New Ticket"
- [ ] Fill in subject and description
- [ ] Click Submit
- [ ] **Expected:** Ticket created successfully
- [ ] **Check:** Ticket appears in list

#### ✅ **Test 2: Add Comment (THE CRITICAL TEST)**

- [ ] Open a ticket (click on it)
- [ ] Scroll to comment section
- [ ] Type a comment: "Test comment from new Prisma system"
- [ ] Click "Add Comment"
- [ ] **Expected:** Comment appears immediately
- [ ] Note the comment text for next step

#### ✅ **Test 3: Navigate Away and Back (THE BUG FIX VERIFICATION)**

- [ ] Click "Back to Tickets" or navigate to ticket list
- [ ] Click on the same ticket again
- [ ] **Expected:** Your comment is STILL THERE ✨
- [ ] **This was the bug!** If comment persists, the bug is FIXED!

#### ✅ **Test 4: Multiple Comments**

- [ ] Add another comment
- [ ] Add a third comment
- [ ] Navigate away to ticket list
- [ ] Return to ticket
- [ ] **Expected:** ALL comments are visible

#### ✅ **Test 5: Update Ticket**

- [ ] Change ticket status (e.g., "Open" → "In Progress")
- [ ] **Expected:** Status updates successfully
- [ ] Refresh page
- [ ] **Expected:** Status change persists

#### ✅ **Test 6: Filter Tickets**

- [ ] Go to ticket list
- [ ] Try filtering by status
- [ ] Try filtering by priority
- [ ] **Expected:** Filters work correctly

#### ✅ **Test 7: Authorization** (if you have admin/support role)

- [ ] Try to access another user's ticket
- [ ] **Expected:** Should see your own tickets only (unless admin)
- [ ] Admin: Should see all tickets

#### ✅ **Test 8: Internal Comments** (admin/support only)

- [ ] Add a comment with "Internal" checkbox
- [ ] **Expected:** Comment marked as internal
- [ ] Log in as regular user
- [ ] **Expected:** Cannot see internal comments

---

## Step 4: Check for Errors

### Vercel Function Logs:

1. Go to Vercel Dashboard → Your Project
2. Click on the latest deployment
3. Click "Functions" tab
4. Look for any errors in `/api/tickets/*` routes
5. **Expected:** No errors, all requests successful (200, 201 status codes)

### Browser Console:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Perform ticket operations
4. **Expected:** No errors, successful API responses

---

## Step 5: Decision Point

### ✅ If All Tests Pass:

**The new system works!** You have two options:

**Option A: Enable on Production Immediately**

1. Go back to Vercel Dashboard → Environment Variables
2. For each variable, click "Edit"
3. Check ✅ **Production** environment
4. Click "Save"
5. Redeploy Production
6. Monitor for 24-48 hours

**Option B: Monitor Preview Longer**

- Keep testing on Preview for a few days
- Have other users test on Preview URL
- Enable Production when confident

### ❌ If Tests Fail:

**Document what failed:**

1. Which test failed?
2. What was the error message?
3. Check Vercel function logs
4. Share error details with me

**Rollback:**

1. Go to Vercel Dashboard → Environment Variables
2. Delete or set `NEXT_PUBLIC_USE_NEW_TICKETING=false` for Preview
3. Redeploy Preview
4. Old system will be active again

---

## Step 6: Monitor Production (After Enabling)

### First 24 Hours:

- [ ] Check Vercel function logs every few hours
- [ ] Test ticket creation yourself
- [ ] Ask team to report any issues
- [ ] Watch for error alerts

### First Week:

- [ ] Monitor daily
- [ ] Check that comments persist
- [ ] Verify no data loss
- [ ] Confirm performance is good

### After 1 Week (Phase 4):

- [ ] If stable, proceed to cleanup
- [ ] Remove old backend routes
- [ ] Remove feature flag code
- [ ] Update documentation

---

## Troubleshooting

### Issue: "Authentication failed" when calling API routes

**Cause:** JWT_SECRET mismatch between frontend and backend

**Fix:**

1. Check backend JWT_SECRET in Vercel
2. Make sure frontend JWT_SECRET matches exactly
3. Redeploy frontend

### Issue: "Cannot connect to database"

**Cause:** Wrong database connection string

**Fix:**

1. Go to Neon Console
2. Copy the "Direct connection" string (not "Pooled")
3. Update POSTGRES_URL_NON_POOLING in Vercel
4. Redeploy

### Issue: Comments still disappearing

**Cause:** Feature flag not enabled or old cache

**Fix:**

1. Verify `NEXT_PUBLIC_USE_NEW_TICKETING=true` in Vercel
2. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+F5)
3. Check browser console for which API is being called
4. Should call `/api/tickets/...` (new) not `/api/support/...` (old)

### Issue: "Prisma Client not found"

**Cause:** Prisma client not generated

**Fix:**

1. Check `package.json` has `@prisma/client`
2. Vercel should auto-generate client on build
3. Check build logs in Vercel
4. May need to add build script: `"postinstall": "prisma generate"`

---

## Next Steps After Phase 3

### If Successful:

- **Phase 4:** Remove old backend routes
- Update frontend to remove feature flag
- Clean up documentation
- Celebrate! 🎉

### If Issues Found:

- Document issues
- Roll back to old system
- Debug and fix
- Retry Phase 3

---

## Emergency Rollback

**If something goes VERY wrong in Production:**

### Instant Rollback (2 minutes):

```bash
# Via Vercel Dashboard:
1. Environment Variables
2. NEXT_PUBLIC_USE_NEW_TICKETING → Edit → Change to "false"
3. Redeploy

# OR via Git:
git revert HEAD
git push origin main
```

---

## Questions?

- Phase 3 Guide: This file
- Phase 2 Complete: `PHASE_2_COMPLETE.md`
- Phase 1 Complete: `../backend/PRISMA_MIGRATION.md`
- API Routes: `src/pages/api/tickets/`
- Feature Flag: `src/utils/api.js:269-378`

---

## Current Phase 3 Status

- [ ] Step 1: Add environment variables to Vercel Preview ⬅️ **YOU ARE HERE**
- [ ] Step 2: Find Preview URL
- [ ] Step 3: Run testing checklist
- [ ] Step 4: Check for errors
- [ ] Step 5: Make decision (Production or rollback)
- [ ] Step 6: Monitor Production (if enabled)

**Next Action:** Add the three environment variables to Vercel Preview and redeploy.
