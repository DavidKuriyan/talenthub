# TalentHub - Migration & Testing Guide

## 🗄️ Step 1: Apply Database Migrations

You have 2 new migrations to apply:
- `120_cleanup_rls_policies.sql` - Fixes RLS policy conflicts
- `121_enforce_tenant_id_not_null.sql` - Enforces NOT NULL on tenant_id

### Option A: Using Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd "d:\Boot Camp\TalentHub"

# Apply all pending migrations
supabase db push
```

### Option B: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your TalentHub project
3. Navigate to **SQL Editor**
4. Run migration 120 first:
   - Copy contents of `supabase/migrations/120_cleanup_rls_policies.sql`
   - Paste and click **Run**
   - Expected output: `NOTICE: RLS policies successfully cleaned and re-applied. Total policies: 3`

5. Run migration 121:
   - Copy contents of `supabase/migrations/121_enforce_tenant_id_not_null.sql`
   - Paste and click **Run**
   - Expected output: `NOTICE: ✅ tenant_id successfully set to NOT NULL`

---

## ✅ Step 2: Verify Migrations

Run these queries in Supabase SQL Editor:

```sql
-- Verify RLS policies (should return exactly 3)
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'messages' AND schemaname = 'public'
ORDER BY policyname;

-- Expected output:
-- messages_rls_insert | INSERT
-- messages_rls_select | SELECT
-- messages_rls_update | UPDATE

-- Verify tenant_id is NOT NULL
SELECT column_name, is_nullable, data_type
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'tenant_id';

-- Expected output:
-- tenant_id | NO | uuid
```

---

## 🧪 Step 3: Local Testing

### Test 1: Build Check
```bash
# Ensure everything compiles
npm run build
```

### Test 2: TypeScript Type Check
```bash
# Check for type errors
npx tsc --noEmit
```

### Test 3: Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000 and test:

#### Logout Flow Test
1. Login as any user
2. Navigate to `/logout` (create logout button that goes to `/logout` page)
3. ✅ Should see "Logging out..." spinner
4. ✅ Should redirect to `/login?logout=true`
5. ✅ Should NOT auto-redirect back to dashboard
6. Try visiting `/organization/dashboard` directly
7. ✅ Should redirect to `/organization/login`

#### Realtime Messaging Test
1. Open two browsers (Chrome + Firefox incognito)
2. Browser A: Login as Organization user
3. Browser B: Login as Engineer user (same tenant)
4. Both: Navigate to Messages → Select same match → Open chat
5. Browser A: Send "Test from Org"
6. ✅ Browser B should receive message INSTANTLY (no refresh)
7. Browser B: Send "Reply from Eng"
8. ✅ Browser A should receive message INSTANTLY
9. Check browser console: Should see `[Realtime] 🔌 Subscribing to...` (only once, not multiple)

#### Error Handling Test
1. Open chat page
2. Open DevTools → Network tab → Set to "Offline"
3. ✅ Red error banner should appear: "Connection Issue"
4. Set back to "Online"
5. ✅ Error banner should disappear

---

## 🐛 Step 4: Troubleshooting

### Issue: Migration 121 fails with "Found X messages with NULL tenant_id"

**Fix**: Backfill missing tenant_ids first:

```sql
-- Check how many messages have NULL tenant_id
SELECT COUNT(*) FROM public.messages WHERE tenant_id IS NULL;

-- Backfill from matches table
UPDATE public.messages msg
SET tenant_id = m.tenant_id
FROM public.matches m
WHERE msg.match_id = m.id
AND msg.tenant_id IS NULL;

-- Verify all messages now have tenant_id
SELECT COUNT(*) FROM public.messages WHERE tenant_id IS NULL;
-- Should return: 0

-- Now run migration 121
```

### Issue: TypeScript errors after changes

**Fix**: Restart TypeScript server
- VS Code: Press `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
- Or restart IDE

### Issue: "pgrst" schema not found during migration

**Fix**: This is a warning, not an error. The `NOTIFY pgrst, 'reload schema'` is a PostgREST command that works in production but may warn locally.

---

## 📦 Step 5: Code Changes Summary

### Files Created ✅
- `src/app/logout/page.tsx` - New logout page
- `supabase/migrations/120_cleanup_rls_policies.sql`
- `supabase/migrations/121_enforce_tenant_id_not_null.sql`

### Files Modified ✅
- `src/app/actions/auth/logout.ts` - Added `{ scope: 'global' }`
- `src/middleware.ts` - Force clear cookies on logout flag
- `src/lib/types.ts` - Fixed `tenant_id` to NOT NULL
- `src/hooks/useMessagesRealtime.ts` - Made `tenantId` required, renamed type
- `src/app/(chat)/messages/[matchId]/page.tsx` - Added `useCallback` + error UI

### No Changes Needed ✅
- Jitsi integration (already correct)
- Message soft delete (already using `deleted_for`)
- Realtime subscriptions (already using `postgres_changes`)

---

## 🚀 Step 6: Ready for Staging?

Before deploying to staging, ensure:

- [x] All migrations applied successfully
- [x] Verification queries pass
- [x] Local build succeeds (`npm run build`)
- [x] Manual tests pass (logout, realtime, errors)
- [x] No TypeScript errors
- [ ] Code committed to Git
- [ ] PR reviewed (if applicable)

---

## 📝 Next Steps After Testing

1. **Commit Changes**:
```bash
git add .
git commit -m "fix: critical security fixes - logout flow, RLS policies, tenant isolation"
```

2. **Deploy to Staging**:
   - Push to staging branch
   - Apply migrations on staging database
   - Run smoke tests

3. **Production Deployment**:
   - Once staging verified, deploy to production
   - Apply migrations on production database
   - Monitor Supabase logs for 24 hours

---

## 🆘 Need Help?

- **Migrations failing?** Check Supabase logs in Dashboard → Logs
- **Type errors?** Restart TS server and check `tsconfig.json`
- **Realtime not working?** Check browser console for subscription errors
- **Logout still redirecting?** Clear browser cache and cookies manually

Refer to the full audit report in `implementation_plan.md` for detailed explanations.
