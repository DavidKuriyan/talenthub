-- ============================================================
-- FIX: Add tenant_id to messages table and backfill
-- ============================================================

-- 1. Add tenant_id column if not exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 2. Backfill tenant_id from matches table
-- (Messages belong to a match, which belongs to a tenant)
UPDATE messages
SET tenant_id = matches.tenant_id
FROM matches
WHERE messages.match_id = matches.id
AND messages.tenant_id IS NULL;

-- 3. Enforce Not Null (optional, but recommended for RLS)
-- We only enforce if we are sure backfill worked.
-- ALTER TABLE messages ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Re-apply RLS policies from 105 (just to be safe they use the new column correctly)
-- (Copying strictly relevant parts from 105 to ensure this migration is standalone)

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_policy" ON messages;
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    AND (deleted_for IS NULL OR NOT (deleted_for @> ARRAY[auth.uid()]))
);

DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    AND sender_id = auth.uid()
);

DROP POLICY IF EXISTS "messages_update_policy" ON messages;
CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
)
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);
