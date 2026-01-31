-- ============================================================
-- CRITICAL FIX: Schema Repair & Data Cleanup
-- Run this in Supabase SQL Editor to resolve "tenant_id not found"
-- ============================================================

-- 1. TRUNCATE messages to clear "previously messaged" corrupted data
-- (User requested: "delete previously messaged in all accounts")
TRUNCATE TABLE public.messages CASCADE;

-- 2. Ensure tenant_id column exists
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- 3. Sync Schema Cache (Notifying PostgREST to reload)
NOTIFY pgrst, 'reload config';

-- 4. Re-apply RLS Policies for Strict Isolation
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
    AND (deleted_for IS NULL OR NOT (deleted_for @> ARRAY[auth.uid()]))
);

DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
    AND sender_id = auth.uid()
);

DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
CREATE POLICY "messages_update_policy" ON public.messages
FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

-- 5. Fix soft_delete_message RPC (Just in case)
CREATE OR REPLACE FUNCTION public.soft_delete_message(message_id UUID, user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.messages
    SET deleted_for = array_append(COALESCE(deleted_for, ARRAY[]::UUID[]), user_id)
    WHERE id = message_id 
    -- Avoid duplicates
    AND NOT (COALESCE(deleted_for, ARRAY[]::UUID[]) @> ARRAY[user_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.soft_delete_message(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_message(UUID, UUID) TO service_role;
