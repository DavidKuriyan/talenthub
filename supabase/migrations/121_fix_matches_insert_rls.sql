-- ==========================================
-- FIX MATCHES INSERT RLS POLICY
-- ==========================================

-- Drop old policy
DROP POLICY IF EXISTS "Tenant can access matches" ON public.matches;

-- Create comprehensive policy with BOTH USING (for reads) and WITH CHECK (for writes)
CREATE POLICY "Tenant can access matches"
ON public.matches
FOR ALL
USING (
  -- For SELECT/UPDATE/DELETE
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  OR
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
  OR
  -- Allow access if user is linked via the profile_id in the match
  profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  -- For INSERT/UPDATE - must be same tenant
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  OR
  tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())
);

-- Ensure grants are in place
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
