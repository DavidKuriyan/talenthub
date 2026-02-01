-- ==========================================
-- SECURE INTERVIEWS TABLE WITH TENANT ISOLATION
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure clean state
DROP POLICY IF EXISTS "Tenant can access interviews" ON public.interviews;
DROP POLICY IF EXISTS "interviews_select_policy" ON public.interviews;
DROP POLICY IF EXISTS "interviews_insert_policy" ON public.interviews;
DROP POLICY IF EXISTS "interviews_update_policy" ON public.interviews;
DROP POLICY IF EXISTS "Tenant Isolation for Interviews" ON public.interviews;
DROP POLICY IF EXISTS "Users can view their interviews" ON public.interviews;

-- Create tenant-isolated policy
CREATE POLICY "Tenant can access interviews"
ON public.interviews
FOR ALL
USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  OR
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.interviews TO authenticated;
