# Post-Audit Deployment Guide

## 🎯 Quick Status

✅ **P0 Critical Fixes Applied** (3 code changes)  
⚠️ **Build needs verification** (type check recommended)  
📋 **Migrations pending** (2 SQL scripts ready)  
🧪 **Manual testing required** (4 test scenarios)

---

## Step 1: Apply Database Migrations

**CRITICAL**: These migrations MUST be applied before testing.

### Option A: Via Supabase Dashboard (Recommended)
1. Log into Supabase Dashboard
2. Navigate to: SQL Editor → New Query
3. Copy/paste and run **in order**:
   - [`supabase/migrations/120_cleanup_rls_policies.sql`](file:///d:/Boot%20Camp/TalentHub/supabase/migrations/120_cleanup_rls_policies.sql)
   - [`supabase/migrations/121_enforce_tenant_id_not_null.sql`](file:///d:/Boot%20Camp/TalentHub/supabase/migrations/121_enforce_tenant_id_not_null.sql)

### Option B: Via Supabase CLI
```bash
supabase db push
```

### Verify Migrations Applied
```sql
-- Check messages table has correct RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'messages';
-- Should return exactly: messages_rls_select, messages_rls_insert, messages_rls_update

-- Check tenant_id is NOT NULL
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' AND column_name = 'tenant_id';
-- is_nullable should be 'NO'
```

---

## Step 2: Verify Build

Run type check and build:
```bash
npm run build
```

**Common Issues**:
- If build fails, check TypeScript errors
- Our changes should NOT cause new errors
- Pre-existing errors in other files can be ignored for now

---

## Step 3: Manual Testing

### Test 1: Message Send with Validation
**Purpose**: Verify tenantId validation prevents silent failures

1. Start dev server: `npm run dev`
2. Log in as organization user
3. Navigate to any chat: `/messages/[matchId]`
4. Send a message → ✅ Should work normally
5. Open DevTools Console → Clear localStorage
6. Try to send message → ✅ Should show error: "Session expired or tenant context missing"

### Test 2: Role Metadata Consistency
**Purpose**: Verify middleware checks both metadata sources

1. Create test user with role ONLY in `user_metadata` (or use existing)
2. Log in via `/organization/login`
3. Check you can access `/organization/dashboard`
4. ✅ Should work (previously might have blocked)

### Test 3: Engineer Registration
**Purpose**: Verify /register route works

1. Navigate to `/register`
2. Fill form with new email/password
3. Submit
4. ✅ Should create account and redirect to `/engineer/profile`

### Test 4: Logout Completeness
**Purpose**: Verify logout clears all session data

1. Log in as any user
2. Click logout → redirects to `/login`
3. DevTools → Application → Cookies: ✅ No `talenthub-session`
4. DevTools → Application → Local Storage: ✅ Empty
5. Try to access `/organization/dashboard` → ✅ Redirected to login

---

## Step 4: Staging Deployment

### Pre-Deploy Checklist
- [ ] Migrations applied to staging database
- [ ] All 4 manual tests pass locally
- [ ] No new TypeScript errors from our changes
- [ ] Environment variables configured (JITSI_SECRET_KEY, etc.)

### Deploy Command
```bash
# Vercel/Netlify/etc.
git push origin main
# Or manual deploy via dashboard
```

### Post-Deploy Verification
Run all 4 manual tests on staging URL

---

## 🔧 Files Changed Summary

| File | Change | Risk |
|------|--------|------|
| `src/middleware.ts` | Role check fix | Low - safer than before |
| `src/lib/realtime.ts` | Add validation | Low - better UX |
| `src/app/organization/login/page.tsx` | Remove dead code | None - cleanup only |

**Total Impact**: 16 lines changed

---

## ⚠️ Known Non-Blocking Issues

These are P1/P2 issues that should be fixed but don't block deployment:

1. **No auto-login after org registration** (P1 - UX issue)
2. **Email check fetches all users** (P1 - performance at scale)
3. **Jitsi lacks JWT auth** (P1 - security relies on obscurity)
4. **Duplicate session checks** (P2 - performance)

See [`implementation_plan.md`](file:///C:/Users/Admin/.gemini/antigravity/brain/fdb17357-69a2-42e0-9699-5a1127be6748/implementation_plan.md) for details

---

## 📞 Rollback Plan

If issues arise post-deployment:

```bash
# Revert code changes
git revert <commit-hash>

# Rollback migrations
# Run inverse of migration 121:
ALTER TABLE messages ALTER COLUMN tenant_id DROP NOT NULL;

# For migration 120, restore old policies (backup in migration file)
```

---

## ✅ Success Criteria

Deployment is successful when:
- [x] P0 fixes deployed
- [ ] Migrations applied
- [ ] All 4 manual tests pass
- [ ] No production errors in logs
- [ ] Users can send messages
- [ ] Logout works completely
- [ ] Authentication flows work

**Ready for Production**: ✅ After migrations + testing
