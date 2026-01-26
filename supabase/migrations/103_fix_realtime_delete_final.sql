-- TalentHub Realtime Delete Fix
-- Manual run required in Supabase Dashboard -> SQL Editor

-- 1. Drop old column
ALTER TABLE messages DROP COLUMN IF EXISTS deleted_by;

-- 2. Add new column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for uuid[] DEFAULT '{}';

-- 3. Create index
CREATE INDEX IF NOT EXISTS idx_messages_deleted_for ON messages USING GIN (deleted_for);

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
