-- ============================================================
-- FIX: Add tenant_id to messages table and backfill SAFELY
-- ============================================================

-- 1. Add tenant_id column if not exists (Nullable first)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 2. Backfill tenant_id from matches table
-- (Messages belong to a match, which belongs to a tenant)
UPDATE public.messages
SET tenant_id = m.tenant_id
FROM public.matches m
WHERE public.messages.match_id = m.id
AND public.messages.tenant_id IS NULL;

-- 3. Enforce Not Null
-- (Only if backfill was successful for all rows, otherwise this might fail if there are orphaned messages)
-- We'll try to delete orphaned messages first if they have no match_id or match doesn't exist?
-- Better to just try setting NOT NULL. If it fails, user needs to clean data manually.
ALTER TABLE public.messages ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Add FK Constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_tenant_id_fkey') THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Refresh Schema Cache
-- IMPORTANT: This ensures the API knows about the new column immediately
NOTIFY pgrst, 'reload schema';

-- 6. Verification
-- (You can run this manually to check)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'tenant_id';
