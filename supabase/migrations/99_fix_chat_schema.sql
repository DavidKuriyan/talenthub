-- ============================================================
-- FIX: Add missing columns to 'messages' table and ensure RPC exists
-- ============================================================

-- 1. Ensure 'deleted_by' array column exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_by UUID[] DEFAULT ARRAY[]::UUID[];

-- 2. Ensure 'sender_role' column exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_role TEXT DEFAULT 'organization';

-- 3. Create/Replace the soft delete RPC function
CREATE OR REPLACE FUNCTION soft_delete_message(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET deleted_by = array_append(COALESCE(deleted_by, ARRAY[]::UUID[]), user_id)
    WHERE id = message_id 
    -- Avoid duplicates
    AND NOT (deleted_by @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enable RLS (just in case)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
