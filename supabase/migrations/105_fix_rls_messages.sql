-- TalentHub: Fix RLS policies for messages table
-- Ensures proper tenant isolation and deleted_for filtering

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own deleted_for" ON messages;
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view messages in their tenant (excluding soft-deleted)
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
    -- Must belong to user's tenant
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
    AND (
        -- Not soft-deleted for this user
        deleted_for IS NULL OR NOT (deleted_for @> ARRAY[auth.uid()])
    )
);

-- INSERT: Users can send messages in their tenant
CREATE POLICY "messages_insert_policy" ON messages
FOR INSERT WITH CHECK (
    -- Must belong to user's tenant
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
    AND
    -- Sender must be the authenticated user
    sender_id = auth.uid()
);

-- UPDATE: Users can update messages in their tenant (for soft delete)
CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE USING (
    -- Must belong to user's tenant
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    -- Prevent changing core fields, only deleted_for allowed
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
);

-- Verify RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'messages' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on messages table!';
    END IF;
    
    RAISE NOTICE 'RLS policies successfully applied to messages table';
END $$;
