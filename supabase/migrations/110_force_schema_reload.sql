-- ============================================================
-- FIX: Force Schema Cache Reload & Ensure Column Exists
-- ============================================================

-- 1. Double check tenant_id exists (Idempotent safety check)
DO $$ 
BEGIN
    -- Add the column if it's somehow missing despite previous migrations
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.messages 
        ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
        
        RAISE NOTICE 'Added missing tenant_id column to messages table';
    END IF;
END $$;

-- 2. Force PostgREST to reload its schema cache
-- This is often necessary when columns are added but the API doesn't pick them up immediately
NOTIFY pgrst, 'reload schema';
