-- ==========================================
-- FIX MESSAGES RLS POLICY - MORE PERMISSIVE
-- ==========================================
-- Issue: Policy only checks profiles table, but user may not have profile yet
-- Fix: Also check auth.jwt() directly for tenant_id

-- Drop existing policies
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view messages in their tenant
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
    -- Check tenant from profiles OR from JWT directly
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    OR
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    AND (
        deleted_for IS NULL OR NOT (deleted_for @> ARRAY[auth.uid()])
    )
);

-- INSERT: Users can send messages in their tenant
CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT WITH CHECK (
    -- Sender must be the authenticated user
    sender_id = auth.uid()
    AND
    -- Tenant must match from JWT or profiles
    (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        OR
        tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
    )
);

-- UPDATE: Users can update messages in their tenant (for soft delete)
CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    OR
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
)
WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    OR
    tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
