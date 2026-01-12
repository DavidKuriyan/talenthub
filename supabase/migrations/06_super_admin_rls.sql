-- TalentHub Super Admin RLS Support
-- Grants full access across all tenants for users with 'super_admin' role

-- Enable Super Admin role to bypass tenant filters
-- This is more secure than disabling RLS entirely

-- 1. Updates for USERS table
CREATE POLICY "super_admin_all_users" ON public.users
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 2. Updates for TENANTS table
CREATE POLICY "super_admin_all_tenants" ON public.tenants
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 3. Updates for REQUIREMENTS table
CREATE POLICY "super_admin_all_requirements" ON public.requirements
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 4. Updates for PROFILES table
CREATE POLICY "super_admin_all_profiles" ON public.profiles
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 5. Updates for MATCHES table
CREATE POLICY "super_admin_all_matches" ON public.matches
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 6. Updates for INTERVIEWS table
CREATE POLICY "super_admin_all_interviews" ON public.interviews
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 7. Updates for INVOICES table
CREATE POLICY "super_admin_all_invoices" ON public.invoices
    FOR ALL 
    TO authenticated
    USING (
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
    );

-- 8. Function to verify super admin status easily
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
