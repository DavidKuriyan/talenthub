# 🚀 Quick Start: Run Migrations & Test

## Step 1: Run Database Migrations

Go to **Supabase Dashboard → SQL Editor** and run these 3 migrations in order:

### Migration 1: Fix deleted_by → deleted_for

```sql
-- File: supabase/migrations/103_fix_realtime_delete_final.sql

-- 1. Drop old column
ALTER TABLE messages DROP COLUMN IF EXISTS deleted_by;

-- 2. Add new array column for soft deletes
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_for uuid[] DEFAULT '{}';

-- 3. Create GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_messages_deleted_for 
ON messages USING GIN (deleted_for);

-- 4. Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Migration 2: Fix sender_role defaults

```sql
-- File: supabase/migrations/104_fix_sender_role_default.sql

-- 1. Update existing NULL values
UPDATE messages 
SET sender_role = 'organization' 
WHERE sender_role IS NULL;

-- 2. Add NOT NULL constraint
ALTER TABLE messages 
ALTER COLUMN sender_role SET NOT NULL;

-- 3. Set default for future inserts
ALTER TABLE messages 
ALTER COLUMN sender_role SET DEFAULT 'organization';
```

### Migration 3: Fix RLS Policies

```sql
-- File: supabase/migrations/105_fix_rls_messages.sql

-- Drop old policies
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own deleted_for" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: User must be in tenant AND message not soft-deleted for them
CREATE POLICY "messages_select_policy" ON messages 
FOR SELECT 
USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    AND (deleted_for IS NULL OR NOT (deleted_for @> ARRAY[auth.uid()]))
);

-- INSERT: User must match sender_id and be in tenant
CREATE POLICY "messages_insert_policy" ON messages 
FOR INSERT 
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    AND sender_id = auth.uid()
);

-- UPDATE: User must be in tenant (for soft delete functionality)
CREATE POLICY "messages_update_policy" ON messages 
FOR UPDATE 
USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);
```

---

## Step 2: Verify Realtime is Enabled

1. Go to **Supabase Dashboard → Database → Replication**
2. Look for `supabase_realtime` publication
3. Verify `messages` table is listed
4. If not, run: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

---

## Step 3: Test the Application

### Quick Test (5 minutes)

```bash
# 1. Start dev server
npm run dev

# 2. Open two browser windows:
#    - Window 1: http://localhost:3000/organization/login (login as org)
#    - Window 2: http://localhost:3000/login (login as engineer)

# 3. In Window 1:
#    - Go to Messages
#    - Select a match
#    - Send message: "Test from Organization"

# 4. In Window 2:
#    - Go to Messages  
#    - Select same match
#    - Message should appear INSTANTLY without refresh

# 5. Send reply from Window 2
#    - Type: "Reply from Engineer"
#    - Should appear instantly in Window 1
```

### Expected Results ✅

- Messages appear in **< 1 second**
- **No page refresh** required
- Organization messages: **Indigo gradient**, right side
- Engineer messages: **Emerald gradient**, right side
- Received messages: **Dark gray with colored border**, left side
- **Zero console errors**

---

## Step 4: Comprehensive Testing

Follow the full test plan: [`test-realtime-messaging.md`](file:///d:/Boot%20Camp/TalentHub/test-realtime-messaging.md)

**8 Test Scenarios**:
1. Org → Engineer messaging
2. Engineer → Org messaging
3. Rapid message burst (5 messages)
4. Soft delete sync
5. Dashboard real-time updates
6. Connection status
7. Logout functionality  
8. WebSocket inspection

---

## Troubleshooting

### Issue: Messages don't appear instantly

**Check**:
1. Browser Console → Look for `[useMessagesRealtime] ✅ Connected`
2. Network Tab → Filter "WS" → Should see WebSocket connection
3. Supabase Dashboard → Logs → Realtime

**Fix**:
- Verify migrations ran successfully
- Check Realtime is enabled for `messages` table
- Ensure no console errors

### Issue: "Connection timed out"

**Fix**:
- Check `.env.local` has correct Supabase credentials
- Verify Supabase project is not paused
- Check firewall/network settings

### Issue: Messages appear on wrong side

**Check**:
- Console log: `[ChatPage] Debug Alignment: Me=true/false`
- Verify `sender_id` matches current user ID

---

## Success Checklist

- [ ] All 3 migrations executed successfully
- [ ] Realtime enabled and verified in Supabase
- [ ] Dev server running: `npm run dev`
- [ ] Two browser test passed (instant messaging works)
- [ ] No console errors
- [ ] WebSocket connection visible in DevTools
- [ ] Dashboard counts update without refresh
- [ ] Logout works and redirects correctly

---

## 📊 Monitoring

### During Testing, Watch For:

**Browser Console**:
```
✅ [useMessagesRealtime] 🔌 Subscribing to messages:...
✅ [useMessagesRealtime] 📡 Status: SUBSCRIBED
✅ [useMessagesRealtime] ✅ Connected
✅ [ChatPage] 🔄 Realtime event: INSERT
✅ [Dashboard] 🔄 Realtime update detected
```

**Network Tab (WS)**:
```
Status: 101 Switching Protocols
URL: wss://realtime.supabase.co/...
Messages: Sending and receiving frames
```

**Supabase Dashboard → Realtime**:
```
Active Channels: 1+
Connection Status: Connected
```

---

## Next Steps After Successful Test

1. **Regenerate Types** (optional, to remove `as any` casts):
   ```bash
   npx supabase gen types typescript --project-id <PROJECT_ID> > src/types/supabase.ts
   ```

2. **Deploy to Staging**:
   - Run same migrations on staging database
   - Test with staging Supabase credentials
   - Perform load testing

3. **Production Deployment**:
   - Run migrations on production database
   - Update environment variables
   - Monitor Supabase Realtime logs
   - Set up alerts for connection failures

---

**Questions?** Check the full walkthrough: [`walkthrough.md`](file:///C:/Users/Admin/.gemini/antigravity/brain/9ea2eec6-1e8c-4c38-a3cf-752b96062c50/walkthrough.md)
