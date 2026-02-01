-- ==========================================
-- FINAL CORRECT TECHNICAL FIX: TENANT ISOLATION
-- ==========================================

-- STEP 1: FIX DATABASE SCHEMA
-- Add tenant_id if missing and enforce NOT NULL
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- STEP 2: BACKFILL EXISTING MESSAGES
-- Map messages to tenants via the matches table
UPDATE public.messages msg
SET tenant_id = m.tenant_id
FROM public.matches m
WHERE msg.match_id = m.id
AND msg.tenant_id IS NULL;

-- ENFORCE NOT NULL (Safe now after backfill)
ALTER TABLE public.messages 
ALTER COLUMN tenant_id SET NOT NULL;

-- ADD FOREIGN KEY CONSTRAINT
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_tenant_id_fkey') THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT messages_tenant_id_fkey
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- STEP 3: FORCE SUPABASE SCHEMA CACHE REFRESH
NOTIFY pgrst, 'reload schema';

-- STEP 7: ADD RLS (SECURITY + STABILITY)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "Tenant can access messages" ON public.messages;

-- Create robust tenant-based policy
-- Note: 'tenant_id' in JWT is standard for this project's multi-tenancy
CREATE POLICY "Tenant can access messages"
ON public.messages
FOR ALL
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  OR 
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);

-- STEP 4: VERIFICATION QUERY (Run this to confirm)
-- SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'tenant_id';
