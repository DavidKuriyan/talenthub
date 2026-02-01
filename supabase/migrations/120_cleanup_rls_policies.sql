-- ==========================================
-- CLEAN UP DUPLICATE/CONFLICTING RLS POLICIES
-- ==========================================
-- This migration removes redundant RLS policies that may grant unintended access
-- and replaces them with minimal, correct policies for tenant isolation.

-- Drop ALL existing message policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their matches" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own deleted_for" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;
DROP POLICY IF EXISTS "Tenant can access messages" ON public.messages;

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- FINAL, CORRECT, MINIMAL RLS POLICIES
-- ==========================================

-- POLICY 1: SELECT
-- Users can view messages in their tenant, excluding soft-deleted
CREATE POLICY "messages_rls_select" ON public.messages
FOR SELECT USING (
    -- Must be in user's tenant
    tenant_id IN (
        SELECT p.tenant_id 
        FROM public.profiles p 
        WHERE p.user_id = auth.uid()
    )
    AND (
        -- Not soft-deleted for this user
        deleted_for IS NULL 
        OR NOT (deleted_for @> ARRAY[auth.uid()])
    )
);

-- POLICY 2: INSERT
-- Users can send messages in their tenant, in matches they're part of
CREATE POLICY "messages_rls_insert" ON public.messages
FOR INSERT WITH CHECK (
    -- Must be sender
    sender_id = auth.uid()
    AND
    -- Must be in user's tenant
    tenant_id IN (
        SELECT p.tenant_id 
        FROM public.profiles p 
        WHERE p.user_id = auth.uid()
    )
    AND
    -- Must be participant in the match
    match_id IN (
        SELECT m.id FROM public.matches m
        JOIN public.requirements r ON m.requirement_id = r.id
        JOIN public.profiles p ON m.profile_id = p.id
        WHERE r.client_id = auth.uid() OR p.user_id = auth.uid()
    )
);

-- POLICY 3: UPDATE
-- Users can update messages in their tenant (for soft delete via RPC only)
-- Direct updates blocked, RPC uses SECURITY DEFINER to bypass this
CREATE POLICY "messages_rls_update" ON public.messages
FOR UPDATE USING (
    -- Must be in user's tenant
    tenant_id IN (
        SELECT p.tenant_id 
        FROM public.profiles p 
        WHERE p.user_id = auth.uid()
    )
);

-- DELETE policy: NONE (hard deletes not allowed)

-- Force Supabase schema cache reload
NOTIFY pgrst, 'reload schema';

-- Verification query
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'messages';
    
    IF policy_count != 3 THEN
        RAISE EXCEPTION 'Expected exactly 3 RLS policies on messages table, found %', policy_count;
    END IF;
    
    RAISE NOTICE 'RLS policies successfully cleaned and re-applied. Total policies: %', policy_count;
END $$;
