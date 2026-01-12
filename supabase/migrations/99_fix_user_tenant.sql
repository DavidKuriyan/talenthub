-- Fix user tenant assignment for davidkuriyan20@gmail.com
-- This assigns the user to TalentHub Solutions tenant

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{tenant_id}',
  '"930e6f70-f5cb-41be-84d2-4e5e31f1864e"'::jsonb
)
WHERE email = 'davidkuriyan20@gmail.com';

-- Verify the update
SELECT id, email, raw_user_meta_data->>'tenant_id' as tenant_id
FROM auth.users
WHERE email = 'davidkuriyan20@gmail.com';
