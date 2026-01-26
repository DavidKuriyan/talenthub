-- ============================================================
-- EMERGENCY FIX: Consolidate Realtime & RLS Configuration
-- ============================================================

-- 1. Set REPLICA IDENTITY FULL for all synced tables
-- This ensures that UPDATE and DELETE events contain full row data or old data respectively.
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE matches REPLICA IDENTITY FULL;
ALTER TABLE interviews REPLICA IDENTITY FULL;
ALTER TABLE requirements REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- 2. Re-initialize Publication
-- Ensure all tables are part of the 'supabase_realtime' publication
-- Drop first if it exists to ensure a clean slate (optional, but safer to just add)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add tables to publication (using EXCEPTION block to avoid "already exists" errors)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION WHEN others THEN RAISE NOTICE 'Table messages already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches;
EXCEPTION WHEN others THEN RAISE NOTICE 'Table matches already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE interviews;
EXCEPTION WHEN others THEN RAISE NOTICE 'Table interviews already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE requirements;
EXCEPTION WHEN others THEN RAISE NOTICE 'Table requirements already in publication';
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN others THEN RAISE NOTICE 'Table profiles already in publication';
END $$;

-- 3. Ensure RLS is enabled and simplified for Realtime
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select messages" ON messages;
CREATE POLICY "Authenticated users can select messages" 
ON messages FOR SELECT 
TO authenticated 
USING (true);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view profiles for matching" ON profiles;
CREATE POLICY "Anyone can view profiles for matching" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- 4. Final verification of Realtime setup
-- (Note: In a real environment, you'd check dashboard, here we just ensure SQL is valid)
