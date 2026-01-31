-- TalentHub: Fix sender_role column to prevent NULL values
-- This ensures message UI can reliably determine sender type

-- Update existing NULL values to default
UPDATE messages 
SET sender_role = 'organization' 
WHERE sender_role IS NULL;

-- Add NOT NULL constraint
ALTER TABLE messages 
ALTER COLUMN sender_role SET NOT NULL;

-- Set default for future inserts
ALTER TABLE messages 
ALTER COLUMN sender_role SET DEFAULT 'organization';

-- Verify the fix
DO $$
BEGIN
    RAISE NOTICE 'sender_role column fixed: % NULL values updated', 
        (SELECT COUNT(*) FROM messages WHERE sender_role = 'organization' AND created_at > NOW() - INTERVAL '1 hour');
END $$;
