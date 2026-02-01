-- ==========================================
-- SECURE MATCHES TABLE WITH TENANT ISOLATION
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure clean state
DROP POLICY IF EXISTS "Tenant can access matches" ON public.matches;
DROP POLICY IF EXISTS "matches_select_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_policy" ON public.matches;
DROP POLICY IF EXISTS "matches_update_policy" ON public.matches;

-- Create tenant-isolated policy
CREATE POLICY "Tenant can access matches"
ON public.matches
FOR ALL
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  OR
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.matches TO authenticated;
