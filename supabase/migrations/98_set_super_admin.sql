-- TalentHub Set Super Admin
-- Assigns super_admin role to davidkuriyan20@gmail.com

DO $$
BEGIN
    -- Update Auth metadata
    UPDATE auth.users 
    SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
    WHERE email = 'davidkuriyan20@gmail.com';

    -- Update Public users table (if exists)
    UPDATE public.users
    SET role = 'super_admin'
    WHERE email = 'davidkuriyan20@gmail.com';
END $$;

-- Verify
SELECT id, email, raw_user_meta_data->>'role' as role FROM auth.users WHERE email = 'davidkuriyan20@gmail.com';
