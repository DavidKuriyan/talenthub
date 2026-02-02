# TalentHub Real-Time Messaging - Manual Test Plan

## Setup Instructions

### 1. Run Database Migrations

**CRITICAL**: Before testing, run these migrations in Supabase Dashboard → SQL Editor:

```sql
-- Migration 103: Fix deleted_by/deleted_for
-- File: supabase/migrations/103_fix_realtime_delete_final.sql
ALTER TABLE messages DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for uuid[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_messages_deleted_for ON messages USING GIN (deleted_for);
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

```sql
-- Migration 104: Fix sender_role defaults
-- File: supabase/migrations/104_fix_sender_role_default.sql
UPDATE messages SET sender_role = 'organization' WHERE sender_role IS NULL;
ALTER TABLE messages ALTER COLUMN sender_role SET NOT NULL;
ALTER TABLE messages ALTER COLUMN sender_role SET DEFAULT 'organization';
```

```sql
-- Migration 105: Fix RLS policies
-- File: supabase/migrations/105_fix_rls_messages.sql
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own deleted_for" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_policy" ON messages FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    AND (deleted_for IS NULL OR NOT (deleted_for @> ARRAY[auth.uid()]))
);

CREATE POLICY "messages_insert_policy" ON messages FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    AND sender_id = auth.uid()
);

CREATE POLICY "messages_update_policy" ON messages FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);
```

### 2. Verify Realtime is Enabled

1. Go to Supabase Dashboard → Database → Replication
2. Verify `messages` table is in the publication
3. If not, run: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

### 3. Build and Start Application

```bash
npm run build
npm run dev
```

---

## Test Suite

### Test 1: Organization → Engineer Real-Time Messaging

**Objective**: Verify organization can send messages that appear instantly for engineer

**Steps**:
1. Open Chrome Incognito window
2. Navigate to `http://localhost:3000/organization/login`
3. Login as organization user
4. Navigate to `/organization/messages`
5. Select an active engineer match
6. Click "Open Real-time Chat"
7. Type message: "Test from Organization at [TIME]"
8. Press Send

9. Open Chrome Normal window
10. Navigate to `http://localhost:3000/login`
11. Login as engineer for that match
12. Navigate to `/engineer/messages`
13. Select the same match
14. Click "Enter Chat"

**Expected Results**:
✅ Message appears in engineer window **WITHOUT REFRESH**
✅ Message shows on **LEFT** side
✅ Message has **dark gray background with INDIGO left border**
✅ Timestamp is visible and correct
✅ Sender name shows organization name (not "Engineer #...")
✅ No console errors

**Failure Modes**:
❌ Message appears only after refresh → Realtime subscription broken
❌ Message on wrong side → Alignment logic broken
❌ Wrong colors → Role detection broken

---

### Test 2: Engineer → Organization Real-Time Messaging

**Objective**: Verify engineer can send messages that appear instantly for organization

**Steps**:
1. In Engineer window (from Test 1), send message: "Reply from Engineer at [TIME]"
2. Observe message appears on **RIGHT** with **EMERALD gradient**
3. Switch to Organization window
4. Observe message appears **WITHOUT REFRESH**

**Expected Results**:
✅ Engineer sees own message on **RIGHT with emerald gradient**
✅ Organization sees engineer message on **LEFT with dark gray + emerald border**
✅ Messages appear **instantly** (< 1 second)
✅ No duplicates
✅ Chronological order preserved

---

### Test 3: Rapid Message Burst

**Objective**: Verify system handles rapid messages without duplication or loss

**Steps**:
1. In Organization window, send 5 messages rapidly:
   - "Message 1"
   - "Message 2"
   - "Message 3"
   - "Message 4"
   - "Message 5"

**Expected Results**:
✅ All 5 messages appear in engineer window
✅ All in correct order
✅ No duplicates
✅ No delay > 2 seconds for any message
✅ Auto-scroll to bottom works

---

### Test 4: Soft Delete (Delete for Me)

**Objective**: Verify delete works and syncs in real-time

**Steps**:
1. In Organization window, right-click on own message
2. Select "Delete for me"
3. Verify message disappears from organization view
4. Switch to Engineer window
5. Verify message is **still visible** in engineer view

6. In Engineer window, long-press (or right-click) on own message
7. Select "Delete for me"
8. Verify message disappears from engineer view
9. Switch to Organization window
10. Verify engineer's message is **still visible**

**Expected Results**:
✅ Delete only affects the user who deleted
✅ Other user still sees the message
✅ No UPDATE realtime event triggers refresh loop
✅ No console errors

---

### Test 5: Dashboard Real-Time Updates

**Objective**: Verify dashboard shows live counts

**Steps**:
1. Open Organization dashboard: `/organization/dashboard`
2. Note the "Communications" card count
3. In another tab, send a message in messaging center
4. Return to dashboard (DO NOT REFRESH)

**Expected Results**:
✅ Communications count updates automatically
✅ No page reload/refresh needed
✅ Console shows: `[Dashboard] 🔄 Realtime update detected`

---

### Test 6: Connection Status Indicator

**Objective**: Verify users can see connection status

**Steps**:
1. Open message page
2. Look for connection indicator

**Expected Results**:
✅ Shows "Real-time Active" or similar indicator
✅ Green dot pulsing animation
✅ Console shows: `[useMessagesRealtime] ✅ Connected`

---

### Test 7: Logout Functionality

**Objective**: Verify logout cleans up properly

**Steps**:
1. From Organization dashboard, click Logout button
2. Verify redirect to `/organization/login`
3. Check browser console

**Expected Results**:
✅ Redirects to `/organization/login` (not `/login`)
✅ Console shows: `[NavBar] 🚪 Logging out...`
✅ Console shows: `[NavBar] ✅ Logged out`
✅ No error messages
✅ All WebSocket connections closed

4. Login as Engineer
5. From Engineer profile, click Logout
6. Verify redirect to `/login`

---

### Test 8: Network Monitoring

**Objective**: Verify WebSocket connection is active

**Steps**:
1. Open Chrome DevTools → Network tab
2. Filter by "WS" (WebSockets)
3. Navigate to message page
4. Send a message

**Expected Results**:
✅ WebSocket connection to `realtime.supabase.co` visible
✅ Status: 101 Switching Protocols
✅ Connection stays open (not disconnecting/reconnecting)
✅ Message events visible in WS frames

---

## Automated Tests

Run these commands to verify build and configuration:

```bash
# Check TypeScript compilation
npm run build

# Test realtime connection
node scripts/test-realtime.js

# Should see:
# ✅ Realtime connection successful!
# Channel is listening for changes on messages table
```

---

## Troubleshooting Guide

### Issue: Messages appear only after refresh

**Diagnosis**:
- Check browser console for: `[useMessagesRealtime] 📡 Status: SUBSCRIBED`
- If not subscribed, check:
  1. Is Realtime enabled in Supabase?
  2. Are RLS policies blocking subscription?
  3. Is tenant_id correct?

**Fix**:
```bash
# Check Supabase logs in Dashboard → Logs → Realtime
# Verify table is in publication

### Issue: Subscription fails or no messages appear
**Diagnosis**:
- Check if client is sending invalid filter string (e.g. `col1=eq.val,col2=eq.val`). Supabase Realtime assumes single column filter.
**Fix**:
- Ensure `useMessagesRealtime` uses `match_id=eq.ID` only. Tenant isolation is handled by RLS.
```

### Issue: Wrong message alignment

**Diagnosis**:
- Check console: `[ChatPage] Debug Alignment: Me=..., Sender=...`
- If sender_id doesn't match current user, alignment will be wrong

**Fix**:
- Verify `currentUserId` prop is passed correctly
- Check `sender_id` is populated in database

### Issue: Console errors about deleted_by

**Diagnosis**:
- Migration 103 not run

**Fix**:
```sql
ALTER TABLE messages DROP COLUMN deleted_by;
ALTER TABLE messages ADD COLUMN deleted_for uuid[] DEFAULT '{}';
```

### Issue: Logout doesn't work

**Diagnosis**:
- Check console for errors
- Verify button is actually calling `handleLogout`

**Fix**:
- Open browser console
- Click logout
- Look for: `[NavBar] 🚪 Logging out...`

---

## Success Criteria

### ✅ PASS Conditions

- [ ] Two browsers show instant messaging (no refresh)
- [ ] Message alignment: Sender=RIGHT, Receiver=LEFT
- [ ] Message colors: Org=Indigo, Engineer=Emerald
- [ ] Delete works and propagates correctly
- [ ] Logout redirects to correct page
- [ ] Dashboard shows "Live" updates
- [ ] **ZERO** console errors
- [ ] WebSocket connection visible in Network tab
- [ ] Supabase Dashboard → Realtime shows active channels

### ❌ FAIL Conditions

- Messages require page refresh
- Alignment is random or incorrect
- Colors don't match specification
- Console shows errors
- Logout doesn't redirect
- WebSocket connection missing

---

## Post-Test Verification

After all tests pass:

1. Check Supabase Dashboard → Realtime
   - Active channels should show
   - Listen stats should increment

2. Check Application Logs
   - No error messages
   - Connection logs show successful subscriptions

3. Performance Check
   - Messages appear in < 1 second
   - No memory leaks (check Chrome Task Manager)
   - CPU usage normal

---

## Deployment Checklist

Before deploying to production:

- [ ] All migrations run on production database
- [ ] Realtime enabled on production Supabase instance
- [ ] Environment variables set correctly
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] All tests pass
- [ ] Load test: 10+ concurrent users messaging

---

**Test Execution Date**: __________  
**Tester Name**: __________  
**Result**: PASS / FAIL  
**Notes**: __________
