-- ============================================================================
-- TALENTHUB RLS POLICY VERIFICATION
-- ============================================================================
-- Run these queries to verify RLS policies allow realtime events

-- 1. Check if messages table has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'messages';

-- 2. List all RLS policies on messages
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'messages'
ORDER BY policyname;

-- 3. Verify Realtime publication includes messages
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'messages';

-- 4. Check deleted_for column exists
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'messages'
  AND column_name IN ('deleted_for', 'deleted_by')
ORDER BY column_name;

-- Expected Results:
-- Query 1: rowsecurity should be TRUE
-- Query 2: Should show policies allowing SELECT and UPDATE for authenticated users
-- Query 3: Should return messages table
-- Query 4: Should show ONLY deleted_for (uuid[] type), NOT deleted_by
