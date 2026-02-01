-- ==========================================
-- ENFORCE tenant_id NOT NULL (FINAL FIX)
-- ==========================================
-- Ensures tenant_id is always present for proper multi-tenant isolation

-- 1. Check for any NULL tenant_ids (safety check)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM public.messages
    WHERE tenant_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found % messages with NULL tenant_id. Must be fixed first.', null_count;
    END IF;
    
    RAISE NOTICE 'All messages have tenant_id. Proceeding with NOT NULL constraint.';
END $$;

-- 2. Set NOT NULL constraint
ALTER TABLE public.messages 
ALTER COLUMN tenant_id SET NOT NULL;

-- 3. Verify constraint is applied
DO $$
DECLARE
    check_nullable TEXT;
BEGIN
    SELECT is_nullable INTO check_nullable
    FROM information_schema.columns 
    WHERE table_name = 'messages' 
    AND column_name = 'tenant_id';
    
    IF check_nullable = 'YES' THEN
        RAISE EXCEPTION 'tenant_id is still nullable!';
    END IF;
    
    RAISE NOTICE '✅ tenant_id successfully set to NOT NULL';
END $$;

-- Force Supabase schema cache reload
NOTIFY pgrst, 'reload schema';
